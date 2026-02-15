"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMcpServerApp = createMcpServerApp;
exports.createMcpServer = createMcpServer;
const mcp_1 = require("@modelcontextprotocol/sdk/server/mcp");
const stdio_1 = require("@modelcontextprotocol/sdk/server/stdio");
function createMcpServerApp() {
    const server = new mcp_1.McpServer({
        name: 'mcp-code-vault',
        version: '0.1.0'
    }, {
        capabilities: {
            tools: {}
        }
    });
    server.registerTool('ping', {
        description: 'Ping the MCP server. Returns pong.',
        inputSchema: {}
    }, async () => ({
        content: [{ type: 'text', text: 'pong' }]
    }));
    return server;
}
async function createMcpServer() {
    const server = createMcpServerApp();
    const transport = new stdio_1.StdioServerTransport();
    await server.connect(transport);
    return server;
}
