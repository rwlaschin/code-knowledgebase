/**
 * In-memory store for MCP servers that have registered via discovery broadcast.
 * Prune entries older than STALE_MS so the list stays current.
 *
 * STALE_MS: env DISCOVERY_STALE_MS (default 5000). Time without a register before a server is pruned.
 */

function getStaleMs(): number {
  const raw = process.env.DISCOVERY_STALE_MS
  if (raw === undefined || raw === '') return 5_000
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : 5_000
}

export interface RegisteredServer {
  projectName: string
  port: number
  lastSeen: number
}

const store = new Map<string, RegisteredServer>() // key: `${projectName}:${port}`

/** Returns true if this register call introduced a new server key. */
export function register(projectName: string, port: number): boolean {
  const key = `${projectName}:${port}`
  const existed = store.has(key)
  store.set(key, { projectName, port, lastSeen: Date.now() })
  return !existed
}

/** Remove a server immediately when the UI detects disconnect (it will re-register if it comes back). */
export function deregister(projectName: string, port: number): void {
  const key = `${projectName}:${port}`
  store.delete(key)
}

export function pruneStale(): void {
  const staleMs = getStaleMs()
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastSeen > staleMs) store.delete(key)
  }
}

export function getServers(): RegisteredServer[] {
  pruneStale()
  return Array.from(store.values())
}
