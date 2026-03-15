/**
 * MCP server context: CWD and port saved at startup so we can return them in
 * instructions and in the config/setup tool (for ListOfferings, GetInstructions).
 */
let serverCwd: string = process.cwd();
let serverPort: string = process.env.PORT ?? '3000';

export function getServerCwd(): string {
  return serverCwd;
}

export function getServerPort(): string {
  return serverPort;
}

export function setServerContext(cwd: string, port: string): void {
  serverCwd = cwd;
  serverPort = port;
}

/** Build the text content for the config tool (cwd, port, MCP snippet). */
export function getConfigToolContent(): string {
  const cwd = serverCwd;
  const port = serverPort;
  const projectName = process.env.MCP_PROJECT_NAME ?? 'my-project';
  const snippet = JSON.stringify(
    {
      mcpServers: {
        'mcp-code-vault': {
          command: 'node',
          args: ['dist/index.js'],
          cwd,
          env: { PORT: port, MCP_PROJECT_NAME: projectName }
        }
      }
    },
    null,
    2
  );
  return `cwd: ${cwd}\nport: ${port}\n\nMCP config snippet:\n${snippet}`;
}
