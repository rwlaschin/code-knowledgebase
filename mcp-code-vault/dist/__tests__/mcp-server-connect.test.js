"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('@modelcontextprotocol/sdk/server/stdio', () => ({
    StdioServerTransport: jest.fn().mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(undefined)
    }))
}));
const server_1 = require("../src/mcp/server");
describe('createMcpServer', () => {
    it('returns server after connecting transport', async () => {
        const server = await (0, server_1.createMcpServer)();
        expect(server).toBeDefined();
        expect(server.server).toBeDefined();
    });
});
