import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

const SERVER_INSTRUCTIONS = `mcp-code-vault provides tools and context for the code knowledge base.

Use the \`ping\` tool to verify the server is connected (returns "pong").

When more tools are available, use \`tools/list\` to discover them.`;

export function createMcpServerApp(): McpServer {
  const server = new McpServer(
    {
      name: 'mcp-code-vault',
      version: '0.1.0'
    },
    {
      capabilities: {
        tools: {}
      },
      instructions: SERVER_INSTRUCTIONS
    }
  );

  server.registerTool(
    'ping',
    {
      description: 'Ping the MCP server. Returns pong.',
      inputSchema: {}
    },
    async () => ({
      content: [{ type: 'text', text: 'pong' }]
    })
  );

  return server;
}

export async function createMcpServer(): Promise<McpServer> {
  const server = createMcpServerApp();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}
