import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Config from '../../pages/config.vue';
import GlassCard from '../../components/GlassCard.vue';
import { MOCK_STATS_URL } from '../../testConstants';

const mockSocketHandlers: Record<string, (...args: unknown[]) => void> = {};

const mockSocket = {
  on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
    mockSocketHandlers[event] = fn;
    return mockSocket;
  }),
  disconnect: vi.fn()
};

const mockIo = vi.fn(() => mockSocket);
const mockFetch = vi.fn();

vi.mock('nuxt/app', () => ({
  useRuntimeConfig: () => ({
    public: { statsBaseUrl: MOCK_STATS_URL, useStatsProxy: false }
  })
}));

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args)
}));

describe('Config page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    vi.stubGlobal('fetch', mockFetch);
  });

  it('renders Config title and project selector', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ projects: [] })
    });

    const wrapper = mount(Config, {
      global: {
        components: { GlassCard },
        stubs: {}
      }
    });

    await flushPromises();
    expect(wrapper.text()).toContain('Config');
    expect(wrapper.find('select').exists()).toBe(true);
  });

  it('refreshes project selector when project event is received', async () => {
    mockFetch
      // initial fetchProjects()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [] })
      })
      // fetchProjects() after socket event
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            projects: [{ key: 'default', name: 'Default Project' }]
          })
      })
      // fetchConfig() after selectedProjectKey is set by fetchProjects()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ config: 'Code-vault config' })
      });

    const wrapper = mount(Config, {
      global: {
        components: { GlassCard },
        stubs: {}
      }
    });

    await flushPromises();

    const cb = mockSocketHandlers['project'];
    expect(cb).toBeDefined();

    cb!('{"projectKey":"default","action":"created"}');
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(wrapper.text()).toContain('Default Project');
    expect(wrapper.text()).toContain('Code-vault config');
  });
});
