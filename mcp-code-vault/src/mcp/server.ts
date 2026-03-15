import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { withMetrics } from '../stats/metricsClient';
import { createLoggingStdioTransport } from './transportLogger';
import { getServerCwd, getServerPort, getConfigToolContent } from './context';

function getInstructions(): string {
  const cwd = getServerCwd();
  const port = getServerPort();
  return `mcp-code-vault: code knowledge base. CWD=${cwd}, PORT=${port}.

Tools:
- \`ping\`: verify connection (returns "pong").
- \`config\`: return setup/config (cwd, port, MCP snippet).

Use \`tools/list\` to list tools.`;
}

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
      instructions: getInstructions()
    }
  );

  const pingHandler = withMetrics('ping', async (_args: unknown, _extra: unknown) => ({
    content: [{ type: 'text' as const, text: 'pong' }]
  }));

  server.registerTool(
    'ping',
    {
      description: 'Ping the MCP server. Returns pong.',
      inputSchema: {}
    },
    pingHandler as (args: unknown, extra: unknown) => Promise<{ content: { type: 'text'; text: string }[] }>
  );

  const configHandler = withMetrics('config', async (_args: unknown, _extra: unknown) => {
    const text = getConfigToolContent();
    return { content: [{ type: 'text' as const, text }] };
  });

  server.registerTool(
    'config',
    {
      description: 'Return setup/config: cwd, port, and MCP config snippet for Cursor.',
      inputSchema: {}
    },
    configHandler as (args: unknown, extra: unknown) => Promise<{ content: { type: 'text'; text: string }[] }>
  );

  return server;
}

export async function createMcpServer(): Promise<McpServer> {
  const server = createMcpServerApp();
  const transport = createLoggingStdioTransport();
  await server.connect(transport);
  return server;
}
