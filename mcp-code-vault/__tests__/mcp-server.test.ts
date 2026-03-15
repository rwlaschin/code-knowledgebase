jest.mock('../src/stats/metricsClient', () => ({
  withMetrics: jest.fn((_op: string, handler: (...args: unknown[]) => unknown) => handler)
}));

jest.mock('../src/mcp/context', () => {
  const { MOCK_STATS_PORT } = require('./testConstants');
  return {
    getServerCwd: jest.fn(() => '/test-cwd'),
    getServerPort: jest.fn(() => String(MOCK_STATS_PORT)),
    getConfigToolContent: jest.fn(() => `cwd: /test-cwd\nport: ${MOCK_STATS_PORT}\n\nMCP config snippet:\n{}`)
  };
});

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

  it('server is not connected before connect()', () => {
    const server = createMcpServerApp();
    expect(server.isConnected()).toBe(false);
  });
});
