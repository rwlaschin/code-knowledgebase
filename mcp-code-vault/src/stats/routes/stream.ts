import { FastifyInstance } from 'fastify';

export async function* metricsStreamEvents(): AsyncGenerator<{ event: string; data: string }> {
  yield { event: 'connected', data: JSON.stringify({ ts: new Date().toISOString() }) };
  while (true) {
    await new Promise((r) => setTimeout(r, 5000));
    yield { event: 'heartbeat', data: JSON.stringify({ ts: new Date().toISOString() }) };
  }
}

export async function streamRoutes(fastify: FastifyInstance) {
  fastify.get('/metrics/stream', async (_request, reply) => {
    reply.sse(metricsStreamEvents());
  });
}
