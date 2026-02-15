// Type for global watcher registry
declare global {
  // eslint-disable-next-line no-var
  var __mcp_watchers: Record<string, any> | undefined;
}
// File walker & Incremental Sync (mtime/MD5)

// Type for global watcher registry
declare global {
  // eslint-disable-next-line no-var
  var __mcp_watchers: Record<string, any> | undefined;
}

// LLM IMPLEMENT FUNCTIONALITY
export async function scanProject(projectKey: string): Promise<{ filesScanned: number; filesUpdated: number; symbolsFound: number }> {
  // LOAD CONFIG FROM DB FOR PROJECT
  const { connectToDatabase } = await import('./db');
  const { shouldIgnore } = await import('./utils/ignore-mgr');
  const { analyzeFile } = await import('./analyzer');
  const fs = await import('fs');
  const path = await import('path');
  const db = await connectToDatabase();
  const project = await db.collection('registry').findOne({ project_key: projectKey });
  if (!project) throw new Error('Project not found');
  const root = project.root_path;
  let filesScanned = 0, filesUpdated = 0, symbolsFound = 0;
  const walk = (dir: string): string[] => {
    let results: string[] = [];
    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (!shouldIgnore(filePath)) results = results.concat(walk(filePath));
      } else {
        if (!shouldIgnore(filePath)) results.push(filePath);
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
    await db.collection('symbols').updateOne(
      { project_key: projectKey, file },
      { $set: { summary, updated: new Date() } },
      { upsert: true }
    );
    // Count symbols (very rough: count 'class'/'function'/'interface' in summary)
    symbolsFound += (summary?.match(/(class |function |interface )/g) ?? []).length;
  }
  // Watch for file changes and update DB (basic implementation)
  // In production, use chokidar or similar for robust watching
  if (!globalThis.__mcp_watchers) globalThis.__mcp_watchers = {};
  if (!globalThis.__mcp_watchers[projectKey]) {
    const chokidar = (await import('chokidar')).default;
    const watcher = chokidar.watch(root, { ignored: /node_modules/ });
    watcher.on('change', async (changedPath: string) => {
      if (shouldIgnore(changedPath)) return;
      const summary = await analyzeFile(projectKey, changedPath);
      await db.collection('symbols').updateOne(
        { project_key: projectKey, file: changedPath },
        { $set: { summary, updated: new Date() } },
        { upsert: true }
      );
    });
    globalThis.__mcp_watchers[projectKey] = watcher;
  }
  return { filesScanned, filesUpdated, symbolsFound };
}
