"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatsServer = createStatsServer;
const fastify_1 = __importDefault(require("fastify"));
const compress_1 = __importDefault(require("@fastify/compress"));
const fastify_sse_v2_1 = __importDefault(require("fastify-sse-v2"));
const mongoose_1 = require("../db/mongoose");
const stream_1 = require("./routes/stream");
async function createStatsServer() {
    await (0, mongoose_1.connectMongoose)();
    const fastify = (0, fastify_1.default)({
        logger: { level: process.env.LOG_LEVEL || 'info' }
    });
    await fastify.register(compress_1.default, { global: true, encodings: ['gzip', 'deflate', 'br'] });
    await fastify.register(fastify_sse_v2_1.default);
    await fastify.register(stream_1.streamRoutes);
    fastify.get('/config', async () => ({ config: 'empty' }));
    fastify.get('/docs', async () => ({ docs: 'empty' }));
    return fastify;
}
