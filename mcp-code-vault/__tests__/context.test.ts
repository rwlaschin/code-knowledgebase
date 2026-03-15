const {
  setServerContext,
  getServerCwd,
  getServerPort,
  getConfigToolContent
} = require('../src/mcp/context');

describe('MCP context', () => {
  const origEnv = process.env;

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('getServerCwd and getServerPort return defaults before setServerContext', () => {
    expect(getServerCwd()).toBe(process.cwd());
    expect(getServerPort()).toBeDefined();
  });

  it('setServerContext updates getServerCwd and getServerPort', () => {
    setServerContext('/some/cwd', '4000');
    expect(getServerCwd()).toBe('/some/cwd');
    expect(getServerPort()).toBe('4000');
  });

  it('getConfigToolContent returns cwd, port and MCP snippet', () => {
    setServerContext('/app', '3001');
    delete process.env.MCP_PROJECT_NAME;
    const text = getConfigToolContent();
    expect(text).toContain('cwd: /app');
    expect(text).toContain('port: 3001');
    expect(text).toContain('MCP config snippet:');
    expect(text).toContain('"mcp-code-vault"');
    expect(text).toContain('"command": "node"');
    expect(text).toContain('"args":');
    expect(text).toContain('dist/index.js');
    expect(text).toContain('"cwd": "/app"');
    expect(text).toContain('"PORT": "3001"');
    expect(text).toContain('"MCP_PROJECT_NAME": "my-project"');
  });

  it('getConfigToolContent uses MCP_PROJECT_NAME when set', () => {
    setServerContext('/proj', '3002');
    process.env.MCP_PROJECT_NAME = 'my-repo';
    const text = getConfigToolContent();
    expect(text).toContain('"MCP_PROJECT_NAME": "my-repo"');
  });
});
