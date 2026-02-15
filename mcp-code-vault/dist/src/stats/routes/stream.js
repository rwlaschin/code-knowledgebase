"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsStreamEvents = metricsStreamEvents;
exports.streamRoutes = streamRoutes;
async function* metricsStreamEvents() {
    yield { event: 'connected', data: JSON.stringify({ ts: new Date().toISOString() }) };
    while (true) {
        await new Promise((r) => setTimeout(r, 5000));
        yield { event: 'heartbeat', data: JSON.stringify({ ts: new Date().toISOString() }) };
    }
}
async function streamRoutes(fastify) {
    fastify.get('/metrics/stream', async (_request, reply) => {
        reply.sse(metricsStreamEvents());
    });
}
