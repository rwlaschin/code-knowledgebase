/**
 * In-memory cache for scan progress. GET /scan/progress returns this.
 * Scanner (section 7) calls reportScanProgress at hook points; this module
 * updates the cache and emits scan:progress via pushToStream (throttled).
 */

import { pushToStream } from './streamChannel';

export interface ScanProgressPayload {
  filesProcessed: number;
  filesUpdated: number;
  files?: Array<{ relativePath: string; state: 'new' | 'stale' | 'fresh' }>;
  projectKey?: string;
}

const cache = new Map<string, ScanProgressPayload>();
const MIN_EMIT_MS = 500;
let lastEmitTime = 0;
let pendingPayload: ScanProgressPayload | null = null;
let throttleTimer: ReturnType<typeof setTimeout> | null = null;

function flushPending(): void {
  if (throttleTimer) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }
  if (pendingPayload) {
    pushToStream('scan:progress', JSON.stringify(pendingPayload));
    lastEmitTime = Date.now();
    pendingPayload = null;
  }
}

/**
 * Update cache and optionally emit scan:progress. Throttles emissions to at most 2/sec.
 */
export function reportScanProgress(payload: ScanProgressPayload): void {
  const key = payload.projectKey ?? 'default';
  cache.set(key, payload);

  const now = Date.now();
  const elapsed = now - lastEmitTime;
  if (elapsed >= MIN_EMIT_MS || lastEmitTime === 0) {
    if (throttleTimer) {
      clearTimeout(throttleTimer);
      throttleTimer = null;
    }
    pushToStream('scan:progress', JSON.stringify(payload));
    lastEmitTime = now;
    pendingPayload = null;
  } else {
    pendingPayload = payload;
    if (!throttleTimer) {
      throttleTimer = setTimeout(flushPending, MIN_EMIT_MS - elapsed);
    }
  }
}

/**
 * Get latest progress for a project (for GET /scan/progress).
 */
export function getScanProgress(projectKey: string): ScanProgressPayload | null {
  const payload = cache.get(projectKey) ?? cache.get('default');
  return payload ?? null;
}

/**
 * Get default payload when no scan has run.
 */
export function getDefaultScanProgress(projectKey?: string): ScanProgressPayload {
  return {
    filesProcessed: 0,
    filesUpdated: 0,
    files: [],
    projectKey: projectKey ?? undefined
  };
}
