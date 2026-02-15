"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ignore_mgr_1 = require("../src/utils/ignore-mgr");
describe('shouldIgnore', () => {
    it('returns false for paths without node_modules', () => {
        expect((0, ignore_mgr_1.shouldIgnore)('src/index.ts')).toBe(false);
        expect((0, ignore_mgr_1.shouldIgnore)('lib/utils.js')).toBe(false);
        expect((0, ignore_mgr_1.shouldIgnore)('foo')).toBe(false);
    });
    it('returns true for paths containing node_modules', () => {
        expect((0, ignore_mgr_1.shouldIgnore)('node_modules/foo.js')).toBe(true);
        expect((0, ignore_mgr_1.shouldIgnore)('packages/a/node_modules/pkg/index.js')).toBe(true);
    });
});
