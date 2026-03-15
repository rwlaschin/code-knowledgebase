/**
 * Shutdown hooks: run when stdio (MCP transport) closes so we exit cleanly.
 * Disconnect Mongo, close HTTP/Socket.IO, close logs, then process.exit(0).
 */

type ShutdownFn = () => void | Promise<void>;
const hooks: ShutdownFn[] = [];
let running = false;

export function registerShutdown(fn: ShutdownFn): void {
  hooks.push(fn);
}

export async function runShutdown(): Promise<never> {
  if (running) return process.exit(0) as never;
  running = true;
  for (const fn of hooks) {
    try {
      await Promise.resolve(fn());
    } catch {
      // continue with other hooks
    }
  }
  process.exit(0);
}
