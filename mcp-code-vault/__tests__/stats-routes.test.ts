import Fastify from 'fastify';
import FastifySSE from 'fastify-sse-v2';
import { streamRoutes } from '../src/stats/routes/stream';

describe('Stats routes', () => {
  let fastify: Awaited<ReturnType<typeof createTestApp>>;

  async function createTestApp() {
    const app = Fastify();
    await app.register(FastifySSE);
    await app.register(streamRoutes);
    app.get('/config', async () => ({ config: 'empty' }));
    app.get('/docs', async () => ({ docs: 'empty' }));
    return app;
  }

  beforeAll(async () => {
    fastify = await createTestApp();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('GET /config', () => {
    it('returns config object', async () => {
      const res = await fastify.inject({ method: 'GET', url: '/config' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual({ config: 'empty' });
    });
  });

  describe('GET /docs', () => {
    it('returns docs object', async () => {
      const res = await fastify.inject({ method: 'GET', url: '/docs' });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toEqual({ docs: 'empty' });
    });
  });

  describe('GET /metrics/stream', () => {
    it('stream yields connected event first', async () => {
      const gen = (await import('../src/stats/routes/stream')).metricsStreamEvents();
      const first = await gen.next();
      expect(first.done).toBe(false);
      expect(first.value?.event).toBe('connected');
      expect(first.value?.data).toBeDefined();
      const data = JSON.parse(first.value!.data);
      expect(data.ts).toBeDefined();
      expect(typeof data.ts).toBe('string');
    });

    it('stream yields heartbeat after delay', async () => {
      jest.useFakeTimers();
      const { metricsStreamEvents } = await import('../src/stats/routes/stream');
      const gen = metricsStreamEvents();
      await gen.next();
      const nextPromise = gen.next();
      jest.advanceTimersByTime(5000);
      const second = await nextPromise;
      jest.useRealTimers();
      expect(second.done).toBe(false);
      expect(second.value?.event).toBe('heartbeat');
      expect(JSON.parse(second.value!.data).ts).toBeDefined();
    });
  });
});
