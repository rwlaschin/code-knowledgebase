"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
const Metric_1 = require("../../db/models/Metric");
async function healthRoutes(fastify) {
    fastify.get('/health', async () => {
        const count = await Metric_1.Metric.countDocuments();
        const recent = await Metric_1.Metric.findOne().sort({ started_at: -1 }).lean();
        return {
            status: 'ok',
            metricsCount: count,
            lastMetricAt: recent?.started_at ?? null
        };
    });
}
