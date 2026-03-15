jest.mock('../src/db/mongoose', () => ({
  connectMongoose: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/db/seed', () => ({
  runSeed: jest.fn().mockResolvedValue(undefined)
}));

import { createStatsServer } from '../src/stats/server';

describe('createStatsServer', () => {
  let fastify: Awaited<ReturnType<typeof createStatsServer>>;

  beforeAll(async () => {
    fastify = await createStatsServer();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it('registers GET /config', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/config' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ config: 'empty' });
  });

  it('registers GET /docs', async () => {
    const res = await fastify.inject({ method: 'GET', url: '/docs' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ docs: 'empty' });
  });

  it('registers GET /metrics/stream route', async () => {
    const routes = fastify.printRoutes();
    expect(routes).toMatch(/stream/);
  });
});
