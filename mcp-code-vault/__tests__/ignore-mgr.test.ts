import { shouldIgnore } from '../src/utils/ignore-mgr';

describe('shouldIgnore', () => {
  it('returns false for paths without node_modules', () => {
    expect(shouldIgnore('src/index.ts')).toBe(false);
    expect(shouldIgnore('lib/utils.js')).toBe(false);
    expect(shouldIgnore('foo')).toBe(false);
  });

  it('returns true for paths containing node_modules', () => {
    expect(shouldIgnore('node_modules/foo.js')).toBe(true);
    expect(shouldIgnore('packages/a/node_modules/pkg/index.js')).toBe(true);
  });
});
