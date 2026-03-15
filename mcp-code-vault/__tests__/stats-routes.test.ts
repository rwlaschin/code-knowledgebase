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
      const { streamToUI } = await import('../src/stats/streamChannel');
      const gen = streamToUI();
      const first = await gen.next();
      expect(first.done).toBe(false);
      expect(first.value?.event).toBe('connected');
      expect(first.value?.data).toBeDefined();
      const data = JSON.parse(first.value!.data);
      expect(data.ts).toBeDefined();
      expect(typeof data.ts).toBe('string');
    });

    it('stream yields heartbeat immediately after connected', async () => {
      const { streamToUI } = await import('../src/stats/streamChannel');
      const gen = streamToUI();
      await gen.next();
      const second = await gen.next();
      expect(second.done).toBe(false);
      expect(second.value?.event).toBe('heartbeat');
      expect(JSON.parse(second.value!.data).ts).toBeDefined();
    });

    it('stream yields heartbeat after delay', async () => {
      jest.useFakeTimers();
      const { streamToUI } = await import('../src/stats/streamChannel');
      const gen = streamToUI();
      await gen.next();
      await gen.next();
      const nextPromise = gen.next();
      jest.advanceTimersByTime(5000);
      const third = await nextPromise;
      jest.useRealTimers();
      expect(third.done).toBe(false);
      expect(third.value?.event).toBe('heartbeat');
      expect(JSON.parse(third.value!.data).ts).toBeDefined();
    });

    it('pushToStream broadcasts to all connected clients', async () => {
      const { streamToUI, pushToStream } = await import('../src/stats/streamChannel');
      const genA = streamToUI();
      const genB = streamToUI();
      await genA.next(); // connected
      await genB.next(); // connected
      await genA.next(); // heartbeat
      await genB.next(); // heartbeat
      const nextA = genA.next();
      const nextB = genB.next();
      pushToStream('metric', JSON.stringify({ id: '1', operation: 'query' }));
      const [resA, resB] = await Promise.all([nextA, nextB]);
      expect(resA.done).toBe(false);
      expect(resA.value?.event).toBe('metric');
      expect(JSON.parse(resA.value!.data).id).toBe('1');
      expect(resB.done).toBe(false);
      expect(resB.value?.event).toBe('metric');
      expect(JSON.parse(resB.value!.data).id).toBe('1');
    });
  });
});
