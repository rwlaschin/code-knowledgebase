"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_sse_v2_1 = __importDefault(require("fastify-sse-v2"));
const stream_1 = require("../src/stats/routes/stream");
describe('Stats routes', () => {
    let fastify;
    async function createTestApp() {
        const app = (0, fastify_1.default)();
        await app.register(fastify_sse_v2_1.default);
        await app.register(stream_1.streamRoutes);
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
            const gen = (await Promise.resolve().then(() => __importStar(require('../src/stats/routes/stream')))).metricsStreamEvents();
            const first = await gen.next();
            expect(first.done).toBe(false);
            expect(first.value?.event).toBe('connected');
            expect(first.value?.data).toBeDefined();
            const data = JSON.parse(first.value.data);
            expect(data.ts).toBeDefined();
            expect(typeof data.ts).toBe('string');
        });
        it('stream yields heartbeat after delay', async () => {
            jest.useFakeTimers();
            const { metricsStreamEvents } = await Promise.resolve().then(() => __importStar(require('../src/stats/routes/stream')));
            const gen = metricsStreamEvents();
            await gen.next();
            const nextPromise = gen.next();
            jest.advanceTimersByTime(5000);
            const second = await nextPromise;
            jest.useRealTimers();
            expect(second.done).toBe(false);
            expect(second.value?.event).toBe('heartbeat');
            expect(JSON.parse(second.value.data).ts).toBeDefined();
        });
    });
});
