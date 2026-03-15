import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DefaultLayout from './default.vue';

const mockUseRoute = vi.fn();
const mockUseRouter = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => mockUseRoute(),
  useRouter: () => mockUseRouter()
}));

describe('Default layout', () => {
  beforeEach(() => {
    mockUseRoute.mockReturnValue({ path: '/', hash: '' });
    mockUseRouter.mockReturnValue({ replace: vi.fn(), push: vi.fn() });
  });

  it('renders sidebar with Stats, Config, Scan, Docs links', () => {
    const wrapper = mount(DefaultLayout, {
      slots: { default: '<div>page content</div>' },
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } }
      }
    });
    expect(wrapper.text()).toContain('Stats');
    expect(wrapper.text()).toContain('Config');
    expect(wrapper.text()).toContain('Scan');
    expect(wrapper.text()).toContain('Docs');
    expect(wrapper.text()).toContain('page content');
  });

  it('when route is /docs, shows doc subheadings with correct hrefs', () => {
    mockUseRoute.mockReturnValue({ path: '/docs', hash: '' });
    const wrapper = mount(DefaultLayout, {
      slots: { default: '<div>docs</div>' },
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } }
      }
    });
    const links = wrapper.findAll('a[href^="#"]');
    expect(links.length).toBe(7);
    expect(links.map((l) => l.attributes('href'))).toEqual([
      '#quick-start',
      '#setting-up-mcp-cursor',
      '#using-the-mcp',
      '#tool-ping',
      '#tool-config',
      '#user-interface',
      '#configuration'
    ]);
    expect(wrapper.text()).toContain('Quick start');
    expect(wrapper.text()).toContain('Setting up the MCP server in Cursor');
    expect(wrapper.text()).toContain('MCP tools reference');
    expect(wrapper.text()).toContain('ping');
    expect(wrapper.text()).toContain('config');
    expect(wrapper.text()).toContain('Platform UI');
  });

  it('when route is not /docs, does not show doc subheadings', () => {
    mockUseRoute.mockReturnValue({ path: '/' });
    const wrapper = mount(DefaultLayout, {
      slots: { default: '<div>stats</div>' },
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } }
      }
    });
    const hashLinks = wrapper.findAll('a[href^="#"]');
    expect(hashLinks.length).toBe(0);
  });

  it('clicking a doc section link calls scrollToDocSection (router.replace + scrollIntoView)', async () => {
    mockUseRoute.mockReturnValue({ path: '/docs', hash: '' });
    const replace = vi.fn();
    mockUseRouter.mockReturnValue({ replace, push: vi.fn() });
    const scrollIntoView = vi.fn();
    vi.spyOn(document, 'getElementById').mockReturnValue({ scrollIntoView } as unknown as HTMLElement);
    const wrapper = mount(DefaultLayout, {
      slots: { default: '<div>docs</div>' },
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } }
      }
    });
    const quickStartLink = wrapper.findAll('a[href="#quick-start"]')[0];
    await quickStartLink.trigger('click', { preventDefault: () => {} });
    expect(replace).toHaveBeenCalledWith({ path: '/docs', hash: '#quick-start' });
    expect(document.getElementById).toHaveBeenCalledWith('quick-start');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});
