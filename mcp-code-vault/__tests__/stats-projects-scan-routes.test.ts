jest.mock('../src/db/mongoose', () => ({
  connectMongoose: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../src/db/seed', () => ({
  runSeed: jest.fn().mockResolvedValue(undefined)
}));

const mockFind = jest.fn();
jest.mock('../src/db/models/Project', () => ({
  Project: {
    find: (...args: unknown[]) => mockFind(...args)
  }
}));

const mockGetScanProgress = jest.fn();
const mockGetDefaultScanProgress = jest.fn();
jest.mock('../src/stats/scanProgressCache', () => ({
  getScanProgress: (...args: unknown[]) => mockGetScanProgress(...args),
  getDefaultScanProgress: (...args: unknown[]) => mockGetDefaultScanProgress(...args)
}));

import { createStatsServer } from '../src/stats/server';

function chainMock(leanResult: unknown) {
  return {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(leanResult)
  };
}

describe('Stats projects and scan routes', () => {
  let fastify: Awaited<ReturnType<typeof createStatsServer>> | undefined;

  beforeAll(async () => {
    fastify = await createStatsServer();
  }, 5000);

  afterAll(async () => {
    if (fastify) await fastify.close();
  });

  beforeEach(() => {
    mockFind.mockReturnValue(chainMock([]));
    mockGetScanProgress.mockReturnValue(null);
    mockGetDefaultScanProgress.mockReturnValue({
      filesProcessed: 0,
      filesUpdated: 0,
      files: [],
      projectKey: undefined
    });
  });

  describe('GET /projects', () => {
    it('returns list of projects from Project model', async () => {
      mockFind.mockReturnValue(
        chainMock([
          { key: 'default', name: 'Default Project' },
          { key: 'other', name: 'Other' }
        ])
      );

      const res = await fastify!.inject({ method: 'GET', url: '/projects' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.projects).toEqual([
        { key: 'default', name: 'Default Project' },
        { key: 'other', name: 'Other' }
      ]);
      expect(Array.isArray(body.projects)).toBe(true);
      body.projects.forEach((p: { key: string; name: string }) => {
        expect(p).toHaveProperty('key');
        expect(p).toHaveProperty('name');
        expect(typeof p.key).toBe('string');
        expect(typeof p.name).toBe('string');
      });
    });

    it('returns empty array when no projects', async () => {
      mockFind.mockReturnValue(chainMock([]));

      const res = await fastify!.inject({ method: 'GET', url: '/projects' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.projects).toEqual([]);
    });
  });

  describe('GET /scan/progress', () => {
    it('returns default progress when no cache and no projectKey', async () => {
      mockGetScanProgress.mockReturnValue(null);
      mockGetDefaultScanProgress.mockReturnValue({
        filesProcessed: 0,
        filesUpdated: 0,
        files: [],
        projectKey: undefined
      });

      const res = await fastify!.inject({ method: 'GET', url: '/scan/progress' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.filesProcessed).toBe(0);
      expect(body.filesUpdated).toBe(0);
      expect(body.files).toEqual([]);
    });

    it('returns cached progress when projectKey provided and cache has data', async () => {
      mockGetScanProgress.mockReturnValue({
        filesProcessed: 10,
        filesUpdated: 5,
        files: [{ relativePath: 'a.ts', state: 'fresh' }],
        projectKey: 'default'
      });

      const res = await fastify!.inject({
        method: 'GET',
        url: '/scan/progress?projectKey=default'
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.filesProcessed).toBe(10);
      expect(body.filesUpdated).toBe(5);
      expect(body.files).toHaveLength(1);
      expect(body.files[0]).toEqual({ relativePath: 'a.ts', state: 'fresh' });
      expect(typeof body.filesProcessed).toBe('number');
      expect(typeof body.filesUpdated).toBe('number');
      expect(Array.isArray(body.files)).toBe(true);
    });
  });
});
