"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../src/db/mongoose', () => ({
    connectMongoose: jest.fn().mockResolvedValue(undefined)
}));
const server_1 = require("../src/stats/server");
describe('createStatsServer', () => {
    let fastify;
    beforeAll(async () => {
        fastify = await (0, server_1.createStatsServer)();
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
        expect(routes).toContain('metrics/stream');
    });
});
