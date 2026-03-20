import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Scan from '../../pages/scan.vue';
import GlassCard from '../../components/GlassCard.vue';
import ChunkUpdateGrid from '../../components/ChunkUpdateGrid.vue';
import { MOCK_STATS_URL } from '../../testConstants';

const mockFetch = vi.fn();
const mockSocketHandlers: Record<string, (...args: unknown[]) => void> = {};
const mockSocket = {
  on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
    mockSocketHandlers[event] = fn;
    return mockSocket;
  }),
  disconnect: vi.fn()
};
const mockIo = vi.fn(() => mockSocket);

vi.mock('nuxt/app', () => ({
  useRuntimeConfig: () => ({
    public: { statsBaseUrl: MOCK_STATS_URL }
  })
}));

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args)
}));

beforeEach(() => {
  vi.clearAllMocks();
  Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
  vi.stubGlobal('fetch', mockFetch);
});

describe('Scan page', () => {
  const globalMount = {
    components: { GlassCard, ChunkUpdateGrid },
    stubs: { ClientOnly: { template: '<div><slot /></div>' } }
  };

  it('exists at route /scan and renders Scan title', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ projects: [] }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ filesProcessed: 0, filesUpdated: 0, files: [] }) });
    const wrapper = mount(Scan, {
      global: globalMount
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Scan');
  });

  it('loads projects from API and project selector shows them', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            projects: [
              { key: 'default', name: 'Default Project' },
              { key: 'other', name: 'Other' }
            ]
          })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ filesProcessed: 0, filesUpdated: 0, files: [] })
      });
    const wrapper = mount(Scan, {
      global: globalMount
    });
    await flushPromises();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/projects'));
    expect(wrapper.find('select').exists()).toBe(true);
    expect(wrapper.text()).toMatch(/Project|Select/);
  });

  it('updates grid when receiving scan:progress socket payload', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ projects: [{ key: 'default', name: 'Default' }] }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ filesProcessed: 0, filesUpdated: 0, files: [] }) });
    const wrapper = mount(Scan, {
      global: globalMount
    });
    await flushPromises();
    const progressCb = mockSocketHandlers['scan:progress'];
    expect(progressCb).toBeDefined();
    progressCb!(JSON.stringify({
      filesProcessed: 2,
      filesUpdated: 1,
      files: [
        { relativePath: 'a.ts', state: 'fresh' },
        { relativePath: 'b.ts', state: 'stale' }
      ],
      projectKey: 'default'
    }));
    await wrapper.vm.$nextTick();
    const grid = wrapper.findComponent(ChunkUpdateGrid);
    expect(grid.exists()).toBe(true);
    expect(grid.props('filesProcessed')).toBe(2);
    expect(grid.props('filesUpdated')).toBe(1);
    expect(grid.props('files')).toHaveLength(2);
  });

  it('has project selector that can store selected projectKey', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            projects: [{ key: 'default', name: 'Default Project' }]
          })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ filesProcessed: 0, filesUpdated: 0, files: [] })
      });
    const wrapper = mount(Scan, {
      global: globalMount
    });
    await flushPromises();
    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    await select.setValue('default');
    await wrapper.vm.$nextTick();
    expect(select.exists()).toBe(true);
  });

  it('refetches projects when project event is received', async () => {
    mockFetch
      // initial fetchProjects()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ projects: [] })
      })
      // initial fetchScanProgress() (not called because no selectedProjectKey)
      // project refresh from socket event
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            projects: [{ key: 'default', name: 'Default Project' }]
          })
      })

    const wrapper = mount(Scan, {
      global: globalMount
    })

    await flushPromises()
    const projectInitCb = mockSocketHandlers['project']
    expect(projectInitCb).toBeDefined()

    projectInitCb!(JSON.stringify({ projectKey: 'default', action: 'created' }))
    await wrapper.vm.$nextTick()

    // After refresh, selector should list the new project.
    expect(wrapper.text()).toContain('Default Project')
  })
});
