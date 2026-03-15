/**
 * In-memory store for MCP servers that have registered via discovery broadcast.
 * Prune entries older than STALE_MS so the list stays current.
 */

const STALE_MS = 30_000 // 30s without heartbeat → remove

export interface RegisteredServer {
  projectName: string
  port: number
  lastSeen: number
}

const store = new Map<string, RegisteredServer>() // key: `${projectName}:${port}`

export function register(projectName: string, port: number): void {
  const key = `${projectName}:${port}`
  store.set(key, { projectName, port, lastSeen: Date.now() })
}

export function pruneStale(): void {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastSeen > STALE_MS) store.delete(key)
  }
}

export function getServers(): RegisteredServer[] {
  pruneStale()
  return Array.from(store.values())
}
