"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
});
