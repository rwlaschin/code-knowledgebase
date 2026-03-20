import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Index from '../../pages/index.vue';
import GlassCard from '../../components/GlassCard.vue';
import { MOCK_STATS_URL, MOCK_STATS_PORT } from '../../testConstants';

const mockSocketHandlers: Record<string, (...args: unknown[]) => void> = {};
const mockSocket = {
  on: vi.fn((event: string, fn: (...args: unknown[]) => void) => {
    mockSocketHandlers[event] = fn;
    return mockSocket;
  }),
  disconnect: vi.fn()
};
const mockIo = vi.fn(() => mockSocket);

const mockRuntimeConfig = vi.fn(() => ({
  public: { statsBaseUrl: MOCK_STATS_URL }
}));
vi.mock('nuxt/app', () => ({
  useRuntimeConfig: () => mockRuntimeConfig()
}));

/** Shared mount options: stub Icon (Nuxt Icon / lucide) and other components not resolved in test env. */
const globalMountOptions = {
  global: {
    components: { GlassCard },
    stubs: {
      ClientOnly: { template: '<div><slot /></div>' },
      apexchart: true,
      Icon: { template: '<span />' }
    }
  }
};

vi.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args)
}));

/** Mock /api/servers with a registered MCP so the UI connects from broadcast (not config fallback). */
function mockServersWithPort(port: number) {
  return {
    ok: true,
    json: () => Promise.resolve({ servers: [{ projectName: 'mcp', port }] })
  } as Response;
}

beforeEach(() => {
  globalThis.fetch = vi.fn((url: string) =>
    Promise.resolve(
      typeof url === 'string' && url.includes('/api/servers')
        ? mockServersWithPort(MOCK_STATS_PORT)
        : { ok: true, json: () => Promise.resolve([]) } as Response
    )
  );
});

describe('Index page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSocketHandlers).forEach((k) => delete mockSocketHandlers[k]);
    globalThis.fetch = vi.fn((url: string) =>
      Promise.resolve(
        typeof url === 'string' && url.includes('/api/servers')
          ? mockServersWithPort(MOCK_STATS_PORT)
          : { ok: true, json: () => Promise.resolve([]) } as Response
      )
    );
  });

  it('renders and sets up Socket.IO on mount', async () => {
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    expect(wrapper.text()).toContain('Stats');
    expect(wrapper.text()).toContain('Time series');
    expect(mockIo).toHaveBeenCalledWith(MOCK_STATS_URL, expect.objectContaining({ autoConnect: true, reconnection: true }));
  });

  it('uses NUXT_PUBLIC_UI_PORT (port only) as backend URL for Socket.IO', async () => {
    mockRuntimeConfig.mockReturnValueOnce({
      public: { statsBaseUrl: '3100' }
    });
    globalThis.fetch = vi.fn((url: string) =>
      Promise.resolve(
        typeof url === 'string' && url.includes('/api/servers')
          ? mockServersWithPort(3100)
          : { ok: true, json: () => Promise.resolve([]) } as Response
      )
    );
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    expect(mockIo).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/.+:3100$/),
      expect.objectContaining({ autoConnect: true, reconnection: true })
    );
  });

  it('shows Connected when server emits connected event (even if first heartbeat is missed)', async () => {
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    const connectedCb = mockSocketHandlers['connected'];
    expect(connectedCb).toBeDefined();
    connectedCb!('{"ts":"2025-01-01T00:00:00.000Z"}');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Connected');
  });

  it('updates streamStatus and lastStreamEvent when socket fires connected and heartbeat', async () => {
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    const connectedCb = mockSocketHandlers['connected'];
    const heartbeatCb = mockSocketHandlers['heartbeat'];
    const disconnectCb = mockSocketHandlers['disconnect'];
    expect(connectedCb).toBeDefined();
    expect(heartbeatCb).toBeDefined();
    expect(disconnectCb).toBeDefined();

    connectedCb!('{"ts":"2025-01-01T00:00:00.000Z"}');
    await wrapper.vm.$nextTick();
    heartbeatCb!('{"ts":"2025-01-01T00:00:00.000Z"}');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Connected');

    disconnectCb!();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Waiting for connection to MCP server');
  });

  it('shows "—" for Files processed and Files updated when no scan data', async () => {
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    expect(wrapper.text()).toContain('Files processed');
    expect(wrapper.text()).toContain('Files updated');
    expect(wrapper.text()).toMatch(/—/);
  });

  it('updates Files processed and Files updated when socket receives scan:progress', async () => {
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    const progressCb = mockSocketHandlers['scan:progress'];
    expect(progressCb).toBeDefined();
    progressCb!(JSON.stringify({ filesProcessed: 42, filesUpdated: 10 }));
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('42');
    expect(wrapper.text()).toContain('10');
  });

  it('shows connection title with last update when connected and heartbeat received', async () => {
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    const connectedCb = mockSocketHandlers['connected'];
    const heartbeatCb = mockSocketHandlers['heartbeat'];
    connectedCb!('{"ts":"2025-01-01T12:00:00.000Z"}');
    await wrapper.vm.$nextTick();
    heartbeatCb!('{"ts":"2025-01-01T12:00:00.000Z"}');
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Connected');
  });

  it('updates stats from stream when metric event has duration and metadata', async () => {
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    const metricCb = mockSocketHandlers['metric'];
    expect(metricCb).toBeDefined();
    metricCb!(JSON.stringify({
      instance_id: 'i1',
      operation: 'query',
      started_at: '2025-01-01T00:00:00.000Z',
      ended_at: '2025-01-01T00:00:01.000Z',
      duration_ms: 100,
      status: 'ok',
      metadata: { tokens_in: 50, tokens_out: 20 }
    }));
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toMatch(/\d+/);
  });

  it('stream event log data accordion stays open when another heartbeat prepends (grouped top row)', async () => {
    const wrapper = mount(Index, globalMountOptions);
    await flushPromises();
    const connectedCb = mockSocketHandlers['connected'];
    const heartbeatCb = mockSocketHandlers['heartbeat'];
    expect(connectedCb).toBeDefined();
    expect(heartbeatCb).toBeDefined();

    connectedCb!('{}');
    await wrapper.vm.$nextTick();
    heartbeatCb!(JSON.stringify({ ts: '2025-01-01T00:00:01.000Z' }));
    await wrapper.vm.$nextTick();
    heartbeatCb!(JSON.stringify({ ts: '2025-01-01T00:00:02.000Z' }));
    await wrapper.vm.$nextTick();

    const dataToggles = wrapper.findAll('button[aria-label="Show full data"]');
    expect(dataToggles.length).toBeGreaterThan(0);
    await dataToggles[0]!.trigger('click');
    await wrapper.vm.$nextTick();
    expect(dataToggles[0]!.attributes('aria-expanded')).toBe('true');

    heartbeatCb!(JSON.stringify({ ts: '2025-01-01T00:00:03.000Z' }));
    await wrapper.vm.$nextTick();

    const after = wrapper.findAll('button[aria-label="Show full data"]');
    expect(after[0]!.attributes('aria-expanded')).toBe('true');
  });
});
