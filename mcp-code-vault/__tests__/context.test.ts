const {
  setServerContext,
  getServerCwd,
  getServerPort,
  applyConfig,
  getSettingsContent
} = require('../src/mcp/context');

describe('MCP context', () => {
  beforeEach(() => {
    setServerContext(process.cwd(), '3000');
  });

  it('getServerCwd and getServerPort return values set by setServerContext', () => {
    expect(getServerCwd()).toBe(process.cwd());
    expect(getServerPort()).toBe('3000');
  });

  it('setServerContext updates getServerCwd and getServerPort', () => {
    setServerContext('/some/cwd', '4000');
    expect(getServerCwd()).toBe('/some/cwd');
    expect(getServerPort()).toBe('4000');
  });

  it('applyConfig sets cwd when provided', () => {
    setServerContext('/initial', '3000');
    const { set } = applyConfig({ cwd: '/new/cwd' });
    expect(set).toContain('cwd=/new/cwd');
    expect(getServerCwd()).toBe('/new/cwd');
    expect(getServerPort()).toBe('3000');
  });

  it('applyConfig sets port when provided', () => {
    setServerContext('/app', '3000');
    const { set } = applyConfig({ port: '5000' });
    expect(set).toContain('port=5000');
    expect(getServerCwd()).toBe('/app');
    expect(getServerPort()).toBe('5000');
  });

  it('applyConfig sets both cwd and port', () => {
    const { set } = applyConfig({ cwd: '/proj', port: '4000' });
    expect(set).toEqual(['cwd=/proj', 'port=4000']);
    expect(getServerCwd()).toBe('/proj');
    expect(getServerPort()).toBe('4000');
  });

  it('applyConfig ignores empty string and undefined', () => {
    setServerContext('/ok', '3001');
    expect(applyConfig({}).set).toEqual([]);
    expect(applyConfig({ cwd: '' }).set).toEqual([]);
    expect(applyConfig({ port: '' }).set).toEqual([]);
    expect(getServerCwd()).toBe('/ok');
    expect(getServerPort()).toBe('3001');
  });

  it('getSettingsContent returns Code-vault config and MCP snippet', () => {
    setServerContext('/my/project', '4100');
    const content = getSettingsContent();
    expect(content).toContain('Code-vault config');
    expect(content).toContain('cwd: /my/project');
    expect(content).toContain('port: 4100');
    expect(content).toContain('MCP snippet (for Cursor)');
    expect(content).toContain('"mcp-code-vault"');
    expect(content).toContain('"cwd": "/my/project"');
    expect(content).toContain('"PORT": "4100"');
  });
});
