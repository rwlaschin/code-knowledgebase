"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRoutes = metricsRoutes;
const Metric_1 = require("../../db/models/Metric");
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
async function metricsRoutes(fastify) {
    fastify.post('/metrics', {
        schema: { body: metricBodySchema }
    }, async (request, reply) => {
        const body = request.body;
        await Metric_1.Metric.create({
            ...body,
            started_at: new Date(body.started_at),
            ended_at: new Date(body.ended_at)
        });
        return { ok: true };
    });
    fastify.get('/metrics', async (request, reply) => {
        const query = request.query;
        const filter = {};
        if (query.instance_id)
            filter.instance_id = query.instance_id;
        if (query.operation)
            filter.operation = query.operation;
        if (query.since)
            filter.started_at = { $gte: new Date(query.since) };
        const docs = await Metric_1.Metric.find(filter).sort({ started_at: -1 }).limit(100).lean();
        return { metrics: docs };
    });
}
