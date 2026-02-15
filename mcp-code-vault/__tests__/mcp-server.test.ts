import { createMcpServerApp } from '../src/mcp/server';

describe('MCP server', () => {
  it('createMcpServerApp returns a server instance', () => {
    const server = createMcpServerApp();
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });

  it('server has connect and close methods', () => {
    const server = createMcpServerApp();
    expect(typeof server.connect).toBe('function');
    expect(typeof server.close).toBe('function');
  });
});
