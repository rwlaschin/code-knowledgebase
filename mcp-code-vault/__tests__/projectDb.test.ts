/**
 * Tests for per-project DB structure (Section 2.1).
 * - ensureProjectCollections(projectKey) creates/ensures the five collections and indexes.
 * - hasAnyPaths(projectKey) returns false when no paths exist.
 */

const mockCreateIndex = jest.fn().mockResolvedValue('indexName');
const mockCountDocuments = jest.fn().mockResolvedValue(0);

const mockFindOne = jest.fn().mockResolvedValue(null);
const mockInsertOne = jest.fn().mockResolvedValue({ insertedId: 'branch-id-1' });
const mockFind = jest.fn().mockReturnValue({ toArray: () => Promise.resolve([]) });

const mockCollection = () => ({
  createIndex: mockCreateIndex,
  createIndexes: jest.fn().mockResolvedValue(undefined),
  countDocuments: jest.fn().mockImplementation(() => ({
    then: (fn: (n: number) => unknown) => Promise.resolve(mockCountDocuments()).then(fn)
  })),
  findOne: mockFindOne,
  insertOne: mockInsertOne,
  find: mockFind
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

jest.mock('@/db/mongoose', () => ({
  connectMongoose: jest.fn().mockResolvedValue({ connection: mockConnection })
}));

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connection: mockConnection
  };
});

import mongoose from 'mongoose';
import {
  ensureProjectCollections,
  hasAnyPaths,
  pathsCollectionName,
  branchesCollectionName,
  knowledgeBaseCollectionName,
  pathJoinsCollectionName,
  branchJoinsCollectionName,
  getOrCreateBranch,
  getBranchByName,
  listBranches
} from '@/db/projectDb';

describe('projectDb — ensure project collections and hasAnyPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: 'branch-id-1' });
    mockFind.mockReturnValue({ toArray: () => Promise.resolve([]) });
    mockDb.collection.mockImplementation((name: string) => {
      const col = mockCollection();
      (col.countDocuments as jest.Mock).mockResolvedValue(0);
      return col;
    });
  });

  describe('collection names', () => {
    it('returns correct suffix names for projectKey', () => {
      expect(pathsCollectionName('my-proj')).toBe('my-proj_paths');
      expect(branchesCollectionName('my-proj')).toBe('my-proj_branches');
      expect(knowledgeBaseCollectionName('my-proj')).toBe('my-proj_knowledge_base');
      expect(pathJoinsCollectionName('my-proj')).toBe('my-proj_path_joins');
      expect(branchJoinsCollectionName('my-proj')).toBe('my-proj_branch_joins');
    });
  });

  describe('ensureProjectCollections', () => {
    it('creates or ensures the five per-project collections for the given projectKey', async () => {
      await ensureProjectCollections('test-project');

      expect(mockDb.collection).toHaveBeenCalledWith('test-project_paths');
      expect(mockDb.collection).toHaveBeenCalledWith('test-project_branches');
      expect(mockDb.collection).toHaveBeenCalledWith('test-project_knowledge_base');
      expect(mockDb.collection).toHaveBeenCalledWith('test-project_path_joins');
      expect(mockDb.collection).toHaveBeenCalledWith('test-project_branch_joins');
      expect(mockDb.collection).toHaveBeenCalledTimes(5);
    });

    it('creates indexes on paths collection (unique path)', async () => {
      await ensureProjectCollections('p1');
      const pathResultIndex = mockDb.collection.mock.calls.findIndex((c) => c[0] === 'p1_paths');
      expect(pathResultIndex).toBeGreaterThanOrEqual(0);
      const pathsCol = mockDb.collection.mock.results[pathResultIndex]?.value;
      expect(pathsCol?.createIndex).toHaveBeenCalledWith({ path: 1 }, { unique: true });
    });
  });

  describe('hasAnyPaths', () => {
    it('returns false when project has no paths', async () => {
      const result = await hasAnyPaths('empty-project');
      expect(result).toBe(false);
      expect(mockDb.collection).toHaveBeenCalledWith('empty-project_paths');
    });

    it('returns true when project has at least one path', async () => {
      mockDb.collection.mockImplementation((name: string) => {
        const col = mockCollection();
        (col.countDocuments as jest.Mock).mockResolvedValue(name.endsWith('_paths') ? 1 : 0);
        return col;
      });
      const result = await hasAnyPaths('has-paths');
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

  describe('getOrCreateBranch', () => {
    it('inserts branch when not found and returns doc', async () => {
      mockFindOne.mockResolvedValue(null);
      const result = await getOrCreateBranch('p1', 'main');
      expect(result.branch).toBe('main');
      expect(result._id).toBe('branch-id-1');
      expect(mockFindOne).toHaveBeenCalledWith({ branch: 'main' });
      expect(mockInsertOne).toHaveBeenCalled();
    });

    it('returns existing branch when found', async () => {
      mockFindOne.mockResolvedValue({ _id: 'existing-id', branch: 'main' });
      const result = await getOrCreateBranch('p1', 'main');
      expect(result.branch).toBe('main');
      expect(result._id).toBe('existing-id');
      expect(mockInsertOne).not.toHaveBeenCalled();
    });
  });

  describe('getBranchByName', () => {
    it('returns doc when branch exists', async () => {
      mockFindOne.mockResolvedValue({ _id: 'id1', branch: 'main' });
      const doc = await getBranchByName('p1', 'main');
      expect(doc).not.toBeNull();
      expect(doc?.branch).toBe('main');
      expect(mockFindOne).toHaveBeenCalledWith({ branch: 'main' });
    });

    it('returns null when branch not found', async () => {
      mockFindOne.mockResolvedValue(null);
      const doc = await getBranchByName('p1', 'missing');
      expect(doc).toBeNull();
    });
  });

  describe('listBranches', () => {
    it('returns branch names from collection', async () => {
      mockFind.mockReturnValue({
        toArray: () => Promise.resolve([{ branch: 'main' }, { branch: 'develop' }])
      });
      const names = await listBranches('p1');
      expect(names).toEqual(['main', 'develop']);
    });

    it('returns empty array when no branches', async () => {
      mockFind.mockReturnValue({ toArray: () => Promise.resolve([]) });
      const names = await listBranches('p1');
      expect(names).toEqual([]);
    });

    it('after getOrCreateBranch adds a branch, listBranches includes it', async () => {
      mockFindOne.mockResolvedValue(null);
      mockInsertOne.mockResolvedValue({ insertedId: 'new-branch-id' });
      await getOrCreateBranch('p1', 'feature-x');
      mockFind.mockReturnValue({
        toArray: () => Promise.resolve([{ branch: 'main' }, { branch: 'feature-x' }])
      });
      const names = await listBranches('p1');
      expect(names).toContain('feature-x');
      expect(names).toEqual(['main', 'feature-x']);
    });
  });
});
