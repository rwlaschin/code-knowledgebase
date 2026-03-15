/**
 * metricsClient: postMetric, withMetrics.
 * Tests define expected behaviour (TDD-style); fetch is mocked.
 */
const originalFetch = globalThis.fetch;

describe('metricsClient', () => {
  let fetchCalls: { url: string; init: RequestInit }[] = [];

  beforeAll(() => {
    globalThis.fetch = jest.fn((url: string, init?: RequestInit) => {
      fetchCalls.push({ url: url as string, init: init || {} });
      return Promise.resolve({ ok: true } as Response);
    }) as typeof fetch;
  });

  afterEach(() => {
    fetchCalls = [];
    delete process.env.STATS_PORT;
    delete process.env.PORT;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe('postMetric', () => {
    it('does nothing when PORT and STATS_PORT are unset', () => {
      const { postMetric } = require('../src/stats/metricsClient');
      postMetric({
        instance_id: 'id',
        operation: 'op',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        duration_ms: 1,
        status: 'ok'
      });
      expect(fetchCalls.length).toBe(0);
    });
    it('POSTs to http://127.0.0.1:PORT/metrics when PORT is set', () => {
      process.env.PORT = '3999';
      jest.isolateModules(() => {
        const { postMetric, markStatsServerReady } = require('../src/stats/metricsClient');
        postMetric({
          instance_id: 'id',
          operation: 'op',
          started_at: '2020-01-01T00:00:00.000Z',
          ended_at: '2020-01-01T00:00:00.001Z',
          duration_ms: 1,
          status: 'ok'
        });
        markStatsServerReady();
        expect(fetchCalls.length).toBe(1);
        expect(fetchCalls[0].url).toBe('http://127.0.0.1:3999/metrics');
        expect(fetchCalls[0].init.method).toBe('POST');
        expect(JSON.parse(fetchCalls[0].init.body as string)).toMatchObject({
          instance_id: 'id',
          operation: 'op',
          status: 'ok',
          duration_ms: 1
        });
      });
    });
  });

  describe('withMetrics', () => {
    it('returns handler result and POSTs metric with status ok', async () => {
      process.env.PORT = '4000';
      const { withMetrics, markStatsServerReady, resetMetricSenderForTesting } = require('../src/stats/metricsClient');
      resetMetricSenderForTesting();
      const handler = jest.fn().mockResolvedValue(42);
      const wrapped = withMetrics('testOp', handler);
      const result = await wrapped();
      markStatsServerReady();
      expect(result).toBe(42);
      expect(handler).toHaveBeenCalled();
      expect(fetchCalls.length).toBe(1);
      const body = JSON.parse(fetchCalls[0].init.body as string);
      expect(body.operation).toBe('testOp');
      expect(body.status).toBe('ok');
    });
    it('rethrows and POSTs metric with status error when handler throws', async () => {
      process.env.PORT = '4001';
      const { withMetrics, markStatsServerReady, resetMetricSenderForTesting } = require('../src/stats/metricsClient');
      resetMetricSenderForTesting();
      const err = new Error('fail');
      const handler = jest.fn().mockRejectedValue(err);
      const wrapped = withMetrics('errOp', handler);
      await expect(wrapped()).rejects.toThrow('fail');
      markStatsServerReady();
      expect(fetchCalls.length).toBe(1);
      const body = JSON.parse(fetchCalls[0].init.body as string);
      expect(body.operation).toBe('errOp');
      expect(body.status).toBe('error');
      expect(body.error_code).toBe('fail');
    });
  });
});
