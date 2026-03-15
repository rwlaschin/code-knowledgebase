/**
 * Is NEW project defaults (Section 2.2): ensure collections and default branch from .git/HEAD.
 */

import * as fs from 'fs';
import * as path from 'path';
import { getProjectRoot } from '../scannerRequirements';
import {
  ensureProjectCollections,
  hasAnyPaths,
  getOrCreateBranch
} from './projectDb';

/**
 * Reads the current branch name from .git/HEAD under the given project root.
 * Returns branch name (e.g. "main") or "HEAD" if detached / unreadable.
 */
export function readCurrentBranchFromRoot(projectRoot: string): string {
  const headPath = path.join(projectRoot, '.git', 'HEAD');
  try {
    const content = fs.readFileSync(headPath, 'utf8').trim();
    const match = content.match(/^ref: refs\/heads\/(.+)$/);
    return match ? match[1].trim() : 'HEAD';
  } catch {
    return 'HEAD';
  }
}

/**
 * Ensures project collections exist and, when the project is NEW (no paths),
 * creates the default branch from .git/HEAD and persists it via getOrCreateBranch.
 */
export async function ensureProjectDefaults(projectKey: string): Promise<void> {
  await ensureProjectCollections(projectKey);
  if (await hasAnyPaths(projectKey)) return;
  const root = await getProjectRoot(projectKey);
  const branchName = readCurrentBranchFromRoot(root);
  await getOrCreateBranch(projectKey, branchName);
}
