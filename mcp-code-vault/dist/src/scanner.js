"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanProject = scanProject;
// LLM IMPLEMENT FUNCTIONALITY
async function scanProject(projectKey) {
    // LOAD CONFIG FROM DB FOR PROJECT
    const { connectToDatabase } = await Promise.resolve().then(() => __importStar(require('./db')));
    const { shouldIgnore } = await Promise.resolve().then(() => __importStar(require('./utils/ignore-mgr')));
    const { analyzeFile } = await Promise.resolve().then(() => __importStar(require('./analyzer')));
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const db = await connectToDatabase();
    const project = await db.collection('registry').findOne({ project_key: projectKey });
    if (!project)
        throw new Error('Project not found');
    const root = project.root_path;
    let filesScanned = 0, filesUpdated = 0, symbolsFound = 0;
    const walk = (dir) => {
        let results = [];
        for (const file of fs.readdirSync(dir)) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (!shouldIgnore(filePath))
                    results = results.concat(walk(filePath));
            }
            else {
                if (!shouldIgnore(filePath))
                    results.push(filePath);
            }
        }
        return results;
    };
    const allFiles = walk(root);
    filesScanned = allFiles.length;
    for (const file of allFiles) {
        // TODO: Check mtime/MD5 for incremental update
        const summary = await analyzeFile(projectKey, file);
        filesUpdated++;
        // Store symbols in DB (simplified: just store summary)
        await db.collection('symbols').updateOne({ project_key: projectKey, file }, { $set: { summary, updated: new Date() } }, { upsert: true });
        // Count symbols (very rough: count 'class'/'function'/'interface' in summary)
        symbolsFound += (summary.match(/(class |function |interface )/g) || []).length;
    }
    // Watch for file changes and update DB (basic implementation)
    // In production, use chokidar or similar for robust watching
    if (!globalThis.__mcp_watchers)
        globalThis.__mcp_watchers = {};
    if (!globalThis.__mcp_watchers[projectKey]) {
        const chokidar = (await Promise.resolve().then(() => __importStar(require('chokidar')))).default;
        const watcher = chokidar.watch(root, { ignored: /node_modules/ });
        watcher.on('change', async (changedPath) => {
            if (shouldIgnore(changedPath))
                return;
            const summary = await analyzeFile(projectKey, changedPath);
            await db.collection('symbols').updateOne({ project_key: projectKey, file: changedPath }, { $set: { summary, updated: new Date() } }, { upsert: true });
        });
        globalThis.__mcp_watchers[projectKey] = watcher;
    }
    return { filesScanned, filesUpdated, symbolsFound };
}
