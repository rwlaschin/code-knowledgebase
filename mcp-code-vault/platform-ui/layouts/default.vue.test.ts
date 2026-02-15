import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DefaultLayout from './default.vue';

const mockUseRoute = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => mockUseRoute()
}));

describe('Default layout', () => {
  beforeEach(() => {
    mockUseRoute.mockReturnValue({ path: '/', hash: '' });
  });

  it('renders sidebar with Stats, Config, Docs links', () => {
    const wrapper = mount(DefaultLayout, {
      slots: { default: '<div>page content</div>' },
      global: {
        stubs: { NuxtLink: { template: '<a><slot /></a>' } }
      }
    });
    expect(wrapper.text()).toContain('Stats');
    expect(wrapper.text()).toContain('Config');
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
    expect(links.length).toBe(3);
    expect(links.map((l) => l.attributes('href'))).toEqual(['#quick-start', '#setting-up-mcp-cursor', '#user-interface']);
    expect(wrapper.text()).toContain('Quick start');
    expect(wrapper.text()).toContain('Setting up MCP with Cursor');
    expect(wrapper.text()).toContain('User interface');
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
});
