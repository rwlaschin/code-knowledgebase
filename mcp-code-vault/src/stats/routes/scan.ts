import type { FastifyInstance } from 'fastify';
import { getScanProgress, getDefaultScanProgress } from '../scanProgressCache';

export async function scanRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { projectKey?: string } }>('/scan/progress', async (request, reply) => {
    const projectKey = request.query.projectKey ?? 'default';
    const payload = getScanProgress(projectKey) ?? getDefaultScanProgress(projectKey);
    return reply.send(payload);
  });
}
