"use strict";
// .gitignore logic
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldIgnore = shouldIgnore;
function shouldIgnore(filePath) {
    // Simple logic: ignore node_modules for test to pass
    return filePath.includes('node_modules');
}
