import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Config from '../../pages/config.vue';
import GlassCard from '../../components/GlassCard.vue';

describe('Config page', () => {
  it('renders Config title and nav', () => {
    const wrapper = mount(Config, {
      global: {
        components: { GlassCard },
        stubs: { NuxtLink: { template: '<a><slot /></a>' } }
      }
    });
    expect(wrapper.text()).toContain('Config');
    expect(wrapper.text()).toContain('Empty for now');
  });
});
