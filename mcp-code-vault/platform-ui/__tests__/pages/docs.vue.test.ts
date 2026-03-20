import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';
import Docs from '../../pages/docs.vue';
import { MOCK_STATS_PORT } from '../../testConstants';

const mockCwd = '/absolute/project/root';
const mockPort = String(MOCK_STATS_PORT);

const mockUseRoute = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => mockUseRoute(),
  useRouter: () => mockUseRouter()
}));

vi.mock('nuxt/app', () => ({
  useState: (_key: string, init?: () => string | null) => ({ value: init ? init() : null })
}));

vi.stubGlobal(
  'useAsyncData',
  () => Promise.resolve({ data: ref({ cwd: mockCwd, port: mockPort }) })
);

/** Mount Docs inside Suspense so async setup resolves and the component renders. */
async function mountDocs() {
  const wrapper = mount(
    {
      template: '<Suspense><Docs /><template #fallback>Loading...</template></Suspense>',
      components: { Docs }
    },
    {
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } }
      }
    }
  );
  await flushPromises();
  return wrapper;
}

describe('Docs page', () => {
  beforeEach(() => {
    mockUseRoute.mockReturnValue({ path: '/docs', hash: '' });
    mockUseRouter.mockReturnValue({ replace: vi.fn(), push: vi.fn() });
  });

  it('renders Docs title and search header', async () => {
    const wrapper = await mountDocs();
    expect(wrapper.text()).toContain('Docs');
    expect(wrapper.find('input[placeholder="Search..."]').exists()).toBe(true);
  });

  it('does not use GlassCard (plain article layout for docs)', async () => {
    const wrapper = await mountDocs();
    expect(wrapper.findComponent({ name: 'GlassCard' }).exists()).toBe(false);
    expect(wrapper.find('article').exists()).toBe(true);
  });

  it('has sections with correct ids for sidebar scroll and scroll-spy', async () => {
    const wrapper = await mountDocs();
    expect(wrapper.find('#quick-start').exists()).toBe(true);
    expect(wrapper.find('#setting-up-mcp-cursor').exists()).toBe(true);
    expect(wrapper.find('#user-interface').exists()).toBe(true);
  });

  it('renders doc content: Quick start, Setting up MCP, Platform UI', async () => {
    const wrapper = await mountDocs();
    const text = wrapper.text();
    expect(text).toContain('Quick start');
    expect(text).toContain('Setting up MCP server');
    expect(text).toContain('Platform UI');
    expect(text).toContain('mcpServers');
    expect(text).toContain('pong');
  });

  it('shows Copy button for the MCP snippet', async () => {
    const wrapper = await mountDocs();
    expect(wrapper.text()).toContain('Copy');
  });

  it('renders MCP snippet with server-provided cwd and port (no placeholder)', async () => {
    const wrapper = await mountDocs();
    const snippet = wrapper.find('pre code').text();
    expect(snippet).not.toContain('/path/to/mcp-code-vault');
    expect(snippet).toContain(mockCwd);
    expect(snippet).toContain(`"PORT": "${mockPort}"`);
    expect(snippet).toContain('"cwd":');
    expect(snippet).toContain('"args": ["dist/index.js"]');
  });

  it('MCP snippet structure matches snapshot', async () => {
    const wrapper = await mountDocs();
    const snippet = wrapper.find('pre code').text();
    const normalized = snippet.split(mockCwd).join('<project-root>');
    expect(normalized).toMatchInlineSnapshot(`
      "{
        "mcpServers": {
          "mcp-code-vault": {
            "command": "node",
            "args": ["dist/index.js"],
            "cwd": "<project-root>",
            "env": {
              "PORT": "3000",
              "MCP_PROJECT_NAME": "my-project",
              "WORKING_DIRECTORY": "<project-root>"
            }
          }
        }
      }"
    `);
  });

  it('Copy button calls copySnippet and updates label', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(global.navigator, 'clipboard', { value: { writeText }, configurable: true });
    vi.useFakeTimers();
    const wrapper = await mountDocs();
    const copyBtn = wrapper.findAll('button').find((b) => b.text().includes('Copy'))!;
    await copyBtn.trigger('click');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('mcpServers'));
    expect(wrapper.text()).toContain('Copied!');
    await vi.advanceTimersByTime(2000);
    expect(wrapper.text()).toContain('Copy');
    vi.useRealTimers();
  });
});
