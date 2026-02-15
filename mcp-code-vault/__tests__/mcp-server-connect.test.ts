jest.mock('@modelcontextprotocol/sdk/server/stdio', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined)
  }))
}));

import { createMcpServer } from '../src/mcp/server';

describe('createMcpServer', () => {
  it('returns server after connecting transport', async () => {
    const server = await createMcpServer();
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });
});
