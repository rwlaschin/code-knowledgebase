import type { FastifyInstance } from 'fastify';
import { Metric } from '../../db/models/Metric';
import { writeProcessLog } from '../../stdioMode';
import { pushToStream } from '../streamChannel';

const metricBodySchema = {
  type: 'object',
  required: ['instance_id', 'operation', 'started_at', 'ended_at', 'duration_ms', 'status'],
  properties: {
    instance_id: { type: 'string' },
    operation: { type: 'string' },
    started_at: { type: 'string', format: 'date-time' },
    ended_at: { type: 'string', format: 'date-time' },
    duration_ms: { type: 'number' },
    status: { type: 'string', enum: ['ok', 'error'] },
    error_code: { type: 'string' },
    metadata: { type: 'object' }
  }
};

export async function metricRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      instance_id: string;
      operation: string;
      started_at: string;
      ended_at: string;
      duration_ms: number;
      status: 'ok' | 'error';
      error_code?: string;
      metadata?: Record<string, unknown>;
    };
  }>('/metrics', {
    schema: { body: metricBodySchema }
  }, async (request, reply) => {
    const body = request.body;
    writeProcessLog(`[BACKEND] POST /metrics received operation=${body.operation} instance_id=${body.instance_id}\n`);
    const doc = await Metric.create({
      ...body,
      started_at: new Date(body.started_at),
      ended_at: new Date(body.ended_at)
    });
    writeProcessLog(`[BACKEND] pushing message to mongo _id=${(doc as { _id?: unknown })._id} operation=${body.operation}\n`);
    const payload = {
      _id: (doc as { _id?: unknown })._id?.toString?.() ?? (doc as { id?: string }).id,
      instance_id: doc.instance_id,
      operation: doc.operation,
      started_at: doc.started_at.toISOString(),
      ended_at: doc.ended_at.toISOString(),
      duration_ms: doc.duration_ms,
      status: doc.status,
      error_code: doc.error_code,
      metadata: doc.metadata
    };
    pushToStream('metric', JSON.stringify(payload));
    return reply.send({ ok: true });
  });

  fastify.get<{
    Querystring: { instance_id?: string; operation?: string; since?: string; limit?: string };
  }>('/metrics', async (request, reply) => {
    const query = request.query;
    const filter: Record<string, unknown> = {};
    if (query.instance_id) filter.instance_id = query.instance_id;
    if (query.operation) filter.operation = query.operation;
    if (query.since) filter.started_at = { $gte: new Date(query.since) };
    const limit = Math.min(Math.max(parseInt(query.limit ?? '500', 10), 1), 1000);
    const docs = await Metric.find(filter).sort({ started_at: -1 }).limit(limit).lean();
    const metrics = docs.map((d) => ({
      _id: (d as { _id?: unknown })._id?.toString?.() ?? (d as { id?: string }).id,
      instance_id: (d as { instance_id: string }).instance_id,
      operation: (d as { operation: string }).operation,
      started_at: (d as { started_at: Date }).started_at?.toISOString?.() ?? new Date((d as { started_at: string }).started_at).toISOString(),
      ended_at: (d as { ended_at: Date }).ended_at?.toISOString?.() ?? new Date((d as { ended_at: string }).ended_at).toISOString(),
      duration_ms: (d as { duration_ms: number }).duration_ms,
      status: (d as { status: string }).status,
      error_code: (d as { error_code?: string }).error_code,
      metadata: (d as { metadata?: Record<string, unknown> }).metadata
    }));
    return reply.send({ metrics });
  });
}
