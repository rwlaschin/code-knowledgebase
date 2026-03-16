/**
 * MCP server context: CWD and port. Set at startup; config tool can update them.
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

export type ConfigInput = { cwd?: string; port?: string };

/** Apply settings from the config tool. Returns what was set. */
export function applyConfig(input: ConfigInput): { set: string[] } {
  const set: string[] = [];
  if (input.cwd !== undefined && input.cwd !== '') {
    serverCwd = input.cwd;
    set.push(`cwd=${serverCwd}`);
  }
  if (input.port !== undefined && input.port !== '') {
    serverPort = input.port;
    set.push(`port=${serverPort}`);
  }
  return { set };
}

/** Return current settings and MCP snippet (read-only) for the settings tool. Matches Config page: config table + MCP snippet. */
export function getSettingsContent(): string {
  const projectName = process.env.MCP_PROJECT_NAME ?? 'my-project';
  const snippet = JSON.stringify(
    {
      mcpServers: {
        'mcp-code-vault': {
          command: 'node',
          args: ['dist/index.js'],
          cwd: serverCwd,
          env: { PORT: serverPort, MCP_PROJECT_NAME: projectName }
        }
      }
    },
    null,
    2
  );
  return `Code-vault config\ncwd: ${serverCwd}\nport: ${serverPort}\n\nMCP snippet (for Cursor)\n${snippet}`;
}
