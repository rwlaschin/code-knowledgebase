import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ChunkUpdateGrid from './ChunkUpdateGrid.vue';

describe('ChunkUpdateGrid', () => {
  it('renders a grid of blocks for each file', () => {
    const files = [
      { relativePath: 'a.ts', state: 'new' as const },
      { relativePath: 'b.ts', state: 'stale' as const },
      { relativePath: 'c.ts', state: 'fresh' as const }
    ];
    const wrapper = mount(ChunkUpdateGrid, {
      props: { files, filesProcessed: 3, filesUpdated: 1 }
    });
    const blocks = wrapper.findAll('.rounded-sm');
    expect(blocks.length).toBe(3);
  });

  it('applies transparent for new, yellow for stale, green for fresh', () => {
    const files = [
      { relativePath: 'a.ts', state: 'new' as const },
      { relativePath: 'b.ts', state: 'stale' as const },
      { relativePath: 'c.ts', state: 'fresh' as const }
    ];
    const wrapper = mount(ChunkUpdateGrid, {
      props: { files }
    });
    const blocks = wrapper.findAll('.rounded-sm');
    expect(blocks[0].classes()).toContain('bg-transparent');
    expect(blocks[1].classes()).toContain('bg-amber-400/70');
    expect(blocks[2].classes()).toContain('bg-emerald-500/70');
  });

  it('shows summary line with filesProcessed and filesUpdated', () => {
    const wrapper = mount(ChunkUpdateGrid, {
      props: { files: [], filesProcessed: 10, filesUpdated: 5 }
    });
    expect(wrapper.text()).toContain('10 files processed, 5 updated.');
  });

  it('hides summary when no data', () => {
    const wrapper = mount(ChunkUpdateGrid, {
      props: { files: [], filesProcessed: 0, filesUpdated: 0 }
    });
    const summary = wrapper.find('p.text-sm');
    expect(summary.exists()).toBe(false);
  });

  it('uses block size ~5x10 px', () => {
    const wrapper = mount(ChunkUpdateGrid, {
      props: { files: [{ relativePath: 'x', state: 'new' }] }
    });
    const block = wrapper.find('.rounded-sm');
    expect(block.attributes('style')).toMatch(/10px|5px/);
  });
});
