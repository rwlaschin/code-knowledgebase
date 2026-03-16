"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../src/stats/metricsClient', () => ({
    withMetrics: jest.fn((_op, handler) => handler)
}));
jest.mock('../src/mcp/context', () => {
    const { MOCK_STATS_PORT } = require('./testConstants');
    return {
        getServerCwd: jest.fn(() => '/test-cwd'),
        getServerPort: jest.fn(() => String(MOCK_STATS_PORT)),
        applyConfig: jest.fn(() => ({ set: [] })),
        getSettingsContent: jest.fn(() => `Code-vault config\ncwd: /test-cwd\nport: ${MOCK_STATS_PORT}\n\nMCP snippet (for Cursor)\n{}`)
    };
});
const server_1 = require("../src/mcp/server");
describe('MCP server', () => {
    it('createMcpServerApp returns a server instance', () => {
        const server = (0, server_1.createMcpServerApp)();
        expect(server).toBeDefined();
        expect(server.server).toBeDefined();
    });
    it('server has connect and close methods', () => {
        const server = (0, server_1.createMcpServerApp)();
        expect(typeof server.connect).toBe('function');
        expect(typeof server.close).toBe('function');
    });
    it('server is not connected before connect()', () => {
        const server = (0, server_1.createMcpServerApp)();
        expect(server.isConnected()).toBe(false);
    });
});
