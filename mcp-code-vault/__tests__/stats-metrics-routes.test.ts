jest.mock('../src/db/mongoose', () => ({
  connectMongoose: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../src/db/seed', () => ({
  runSeed: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../src/db/ensureProject', () => ({
  ensureProjectFromConfig: jest.fn().mockResolvedValue('unchanged' as const)
}));

jest.mock('../src/db/projectDb', () => ({
  ...jest.requireActual('../src/db/projectDb'),
  ensureProjectCollections: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/stats/metricsClient', () => ({
  ...jest.requireActual('../src/stats/metricsClient'),
  postMetric: jest.fn().mockResolvedValue(undefined)
}));

const mockCreate = jest.fn();
const mockFind = jest.fn();
jest.mock('../src/db/models/Metric', () => ({
  Metric: {
    get create() {
      return mockCreate;
    },
    get find() {
      return mockFind;
    }
  }
}));

const mockPushToStream = jest.fn();
jest.mock('../src/stats/streamChannel', () => ({
  pushToStream: (...args: unknown[]) => mockPushToStream(...args)
}));

import { createStatsServer } from '../src/stats/server';

function chainMock(leanResult: unknown) {
  return {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(leanResult)
  };
}

describe('Stats metrics routes', () => {
  let fastify: Awaited<ReturnType<typeof createStatsServer>> | undefined;

  beforeAll(async () => {
    fastify = await createStatsServer();
  }, 5000);

  afterAll(async () => {
    if (fastify) await fastify.close();
  });

  beforeEach(() => {
    mockCreate.mockReset();
    mockFind.mockReturnValue(chainMock([]));
    mockPushToStream.mockClear();
  });

  describe('POST /metrics', () => {
    it('validates body and returns 400 on invalid', async () => {
      const res = await fastify!.inject({
        method: 'POST',
        url: '/metrics',
        payload: { instance_id: 'x' }
      });
      expect(res.statusCode).toBe(400);
    });

    it('creates metric and pushes to stream', async () => {
      const doc = {
        _id: { toString: () => 'abc123' },
        instance_id: 'i1',
        operation: 'query',
        kind: 'query',
        started_at: new Date('2025-01-01T00:00:00.000Z'),
        ended_at: new Date('2025-01-01T00:00:01.000Z'),
        duration_ms: 100,
        status: 'ok' as const,
        error_code: undefined,
        metadata: { projectKey: 'default' }
      };
      mockCreate.mockResolvedValue(doc);

      const res = await fastify!.inject({
        method: 'POST',
        url: '/metrics',
        payload: {
          instance_id: 'i1',
          operation: 'query',
          kind: 'query',
          started_at: '2025-01-01T00:00:00.000Z',
          ended_at: '2025-01-01T00:00:01.000Z',
          duration_ms: 100,
          status: 'ok'
        }
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload)).toEqual({ ok: true });
      expect(mockCreate).toHaveBeenCalled();
      expect(mockCreate.mock.calls[0][0]).toMatchObject({
        metadata: { projectKey: 'default' }
      });
      expect(mockPushToStream).toHaveBeenCalledWith('metric', expect.any(String));
      const pushedPayload = JSON.parse(mockPushToStream.mock.calls[0][1]);
      expect(pushedPayload.operation).toBe('query');
      expect(pushedPayload.kind).toBe('query');
      expect(pushedPayload.instance_id).toBe('i1');
      expect(pushedPayload.metadata).toEqual({ projectKey: 'default' });
      expect(new Date(pushedPayload.started_at).toISOString()).toBe(pushedPayload.started_at);
      expect(new Date(pushedPayload.ended_at).toISOString()).toBe(pushedPayload.ended_at);
    });
  });

  describe('GET /metrics', () => {
    it('returns metrics array and applies query params', async () => {
      mockFind.mockReturnValue(
        chainMock([
          {
            _id: { toString: () => 'id1' },
            instance_id: 'i1',
            operation: 'query',
            kind: 'query',
            started_at: new Date('2025-01-01T00:00:00.000Z'),
            ended_at: new Date('2025-01-01T00:00:01.000Z'),
            duration_ms: 50,
            status: 'ok',
            error_code: undefined,
            metadata: undefined
          }
        ])
      );

      const res = await fastify!.inject({ method: 'GET', url: '/metrics' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.metrics).toHaveLength(1);
      expect(body.metrics[0].operation).toBe('query');
      expect(body.metrics[0].metadata).toEqual({ projectKey: 'default' });

      await fastify!.inject({
        method: 'GET',
        url: '/metrics?instance_id=my-instance&operation=scan&since=2025-01-01T00:00:00.000Z&limit=10'
      });
      expect(mockFind).toHaveBeenLastCalledWith(
        expect.objectContaining({
          instance_id: 'my-instance',
          operation: 'scan',
          started_at: { $gte: new Date('2025-01-01T00:00:00.000Z') }
        })
      );
    });
  });
});
