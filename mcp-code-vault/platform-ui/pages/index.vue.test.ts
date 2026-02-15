import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Index from './index.vue';

const handlers: { onopen?: () => void; onmessage?: (e: { data: string }) => void; onerror?: () => void } = {};
const mockEventSource = {
  addEventListener: vi.fn(),
  close: vi.fn(),
  get onopen() { return handlers.onopen; },
  set onopen(fn) { handlers.onopen = fn; },
  get onmessage() { return handlers.onmessage; },
  set onmessage(fn) { handlers.onmessage = fn; },
  get onerror() { return handlers.onerror; },
  set onerror(fn) { handlers.onerror = fn; }
};
vi.stubGlobal('EventSource', vi.fn(() => mockEventSource));

describe('Index page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    handlers.onopen = undefined;
    handlers.onmessage = undefined;
    handlers.onerror = undefined;
  });

  it('renders and sets up EventSource on mount', async () => {
    const wrapper = mount(Index, {
      global: { stubs: { ClientOnly: { template: '<div><slot /></div>' }, apexchart: true } }
    });
    expect(wrapper.text()).toContain('Stats');
    expect(wrapper.text()).toContain('Time series');
    expect(EventSource).toHaveBeenCalledWith('/metrics/stream');
  });

  it('updates streamStatus and lastStreamEvent when EventSource fires', async () => {
    const wrapper = mount(Index, {
      global: { stubs: { ClientOnly: { template: '<div><slot /></div>' }, apexchart: true } }
    });
    await wrapper.vm.$nextTick();
    expect(handlers.onopen).toBeDefined();
    expect(handlers.onmessage).toBeDefined();
    expect(handlers.onerror).toBeDefined();
    handlers.onopen!();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Connected');
    handlers.onmessage!({ data: '{"event":"heartbeat"}' });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('{"event":"heartbeat"}');
    handlers.onerror!();
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Backend not connected');
  });
});
