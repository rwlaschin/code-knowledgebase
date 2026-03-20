/**
 * Tests for per-project DB structure.
 * - ensureProjectCollections(projectKey) creates/ensures the two collections (_knowledge_base, _FileProcessor) and indexes.
 * - hasAnyPaths(projectKey) returns false when no knowledge_base docs exist.
 */

const mockCreateIndex = jest.fn().mockResolvedValue('indexName');
const mockCountDocuments = jest.fn().mockResolvedValue(0);

const mockCollection = () => ({
  createIndex: mockCreateIndex,
  createIndexes: jest.fn().mockResolvedValue(undefined),
  countDocuments: jest.fn().mockImplementation(() => ({
    then: (fn: (n: number) => unknown) => Promise.resolve(mockCountDocuments()).then(fn)
  }))
});

const mockDb = {
  collection: jest.fn((name: string) => {
    const col = mockCollection();
    (col.countDocuments as jest.Mock).mockResolvedValue(0);
    return col;
  })
};

const mockConnection = {
  db: mockDb
};

jest.mock('../src/db/mongoose', () => ({
  connectMongoose: jest.fn().mockResolvedValue({ connection: mockConnection })
}));

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connection: mockConnection
  };
});

import {
  ensureProjectCollections,
  hasAnyPaths,
  knowledgeBaseCollectionName,
  fileProcessorCollectionName
} from '../src/db/projectDb';

describe('projectDb — ensure project collections and hasAnyPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
    mockDb.collection.mockImplementation((name: string) => {
      const col = mockCollection();
      (col.countDocuments as jest.Mock).mockResolvedValue(0);
      return col;
    });
  });

  describe('collection names', () => {
    it('returns correct suffix names for projectKey', () => {
      expect(knowledgeBaseCollectionName('my-proj')).toBe('my-proj_knowledge_base');
      expect(fileProcessorCollectionName('my-proj')).toBe('my-proj_FileProcessor');
    });
  });

  describe('ensureProjectCollections', () => {
    it('creates or ensures the two per-project collections for the given projectKey', async () => {
      await ensureProjectCollections('test-project');

      expect(mockDb.collection).toHaveBeenCalledWith('test-project_knowledge_base');
      expect(mockDb.collection).toHaveBeenCalledWith('test-project_FileProcessor');
      expect(mockDb.collection).toHaveBeenCalledTimes(2);
    });

    it('creates indexes on FileProcessor collection (path unique, checksum, processedAt, path text)', async () => {
      await ensureProjectCollections('fp-proj');
      const fpResultIndex = mockDb.collection.mock.calls.findIndex((c) => c[0] === 'fp-proj_FileProcessor');
      expect(fpResultIndex).toBeGreaterThanOrEqual(0);
      const fpCol = mockDb.collection.mock.results[fpResultIndex]?.value;
      expect(fpCol?.createIndex).toHaveBeenCalledWith({ path: 1 }, { unique: true });
      expect(fpCol?.createIndex).toHaveBeenCalledWith({ checksum: 1 });
      expect(fpCol?.createIndex).toHaveBeenCalledWith({ processedAt: 1 });
      expect(fpCol?.createIndex).toHaveBeenCalledWith({ path: 'text' });
    });
  });

  describe('hasAnyPaths', () => {
    it('returns false when project has no knowledge_base docs', async () => {
      const result = await hasAnyPaths('empty-project');
      expect(result).toBe(false);
      expect(mockDb.collection).toHaveBeenCalledWith('empty-project_knowledge_base');
    });

    it('returns true when project has at least one knowledge_base doc', async () => {
      mockDb.collection.mockImplementation((name: string) => {
        const col = mockCollection();
        (col.countDocuments as jest.Mock).mockResolvedValue(name.endsWith('_knowledge_base') ? 1 : 0);
        return col;
      });
      const result = await hasAnyPaths('has-docs');
      expect(result).toBe(true);
    });
  });

  describe('integration: ensure then hasAnyPaths', () => {
    it('after ensureProjectCollections for NEW project, hasAnyPaths is false', async () => {
      await ensureProjectCollections('new-project');
      const hasPaths = await hasAnyPaths('new-project');
      expect(hasPaths).toBe(false);
    });
  });
});
