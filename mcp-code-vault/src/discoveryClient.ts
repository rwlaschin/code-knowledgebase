/**
 * Discovery client: listen on UDP port 9255 for UI broadcast messages.
 * When we receive { registerUrl }, POST to that URL with { port } so the UI can list MCP servers.
 * If the advertised host is this machine's IP, use 127.0.0.1 so we don't depend on the UI listening on 0.0.0.0.
 * Throttle: at most once per 25s per registerUrl.
 */

import * as dgram from 'dgram';
import * as http from 'http';
import * as https from 'https';
import * as os from 'os';

const DISCOVERY_PORT = 9255;
const REGISTER_THROTTLE_MS = 25_000;

let socket: dgram.Socket | null = null;
const lastRegisterByUrl = new Map<string, number>();

/** This machine's non-loopback IPv4 addresses (e.g. 10.0.0.122). */
function getLocalAddresses(): Set<string> {
  const set = new Set<string>();
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const a of ifaces[name] ?? []) {
      if (a.family === 'IPv4' && !a.internal && a.address) set.add(a.address);
    }
  }
  return set;
}

/** Resolve register URL: if the host is this machine, use localhost so registration works (UI may listen on IPv6 ::1 only). */
function resolveRegisterUrl(registerUrl: string, localAddresses: Set<string>): string {
  const u = new URL(registerUrl);
  const host = u.hostname.toLowerCase();
  if (host === '127.0.0.1' || host === 'localhost' || host === '::1') return registerUrl;
  if (localAddresses.has(u.hostname)) {
    const port = u.port || (u.protocol === 'https:' ? '443' : '80');
    return `${u.protocol}//localhost:${port}${u.pathname}`;
  }
  return registerUrl;
}

export function startDiscoveryClient(port: number): void {
  if (socket) return;
  const localAddresses = getLocalAddresses();
  socket = dgram.createSocket('udp4');
  socket.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn('[discovery] Port 9255 in use; skipping discovery (another MCP on this host may be listening).');
    } else {
      console.error('[discovery] UDP listener error:', err);
    }
  });
  socket.on('message', (msg) => {
    try {
      const raw = msg.toString('utf8');
      const payload = JSON.parse(raw) as { registerUrl?: string };
      const registerUrl = payload?.registerUrl;
      if (typeof registerUrl !== 'string' || !registerUrl.startsWith('http')) return;
      const now = Date.now();
      const last = lastRegisterByUrl.get(registerUrl) ?? 0;
      if (now - last < REGISTER_THROTTLE_MS) return;
      lastRegisterByUrl.set(registerUrl, now);

      const url = resolveRegisterUrl(registerUrl, localAddresses);
      const body = JSON.stringify({ port });
      const u = new URL(url);
      const isHttps = u.protocol === 'https:';
      const reqPort = u.port || (isHttps ? '443' : '80');
      const options: http.RequestOptions = {
        hostname: u.hostname,
        port: reqPort,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body, 'utf8')
        }
      };
      const req = (isHttps ? https : http).request(options, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          console.info(`[discovery] Registered with UI at ${url}; this backend's stats port is ${port}`);
        }
      });
      req.on('error', (err) => {
        console.warn(
          `[discovery] Register failed: ${(err as Error).message}. ` +
            `Could not reach UI at ${url}. Ensure the UI is running (e.g. npm run dev in platform-ui).`
        );
      });
      req.setTimeout(5000, () => req.destroy());
      req.write(body);
      req.end();
    } catch {
      // ignore parse errors
    }
  });
  socket.bind(DISCOVERY_PORT, () => {
    try {
      socket?.setBroadcast(true);
    } catch {
      // optional
    }
    console.info(
      `[discovery] Listening on UDP ${DISCOVERY_PORT} | stats port ${port} | will register with UI when it broadcasts`
    );
  });
}

export function stopDiscoveryClient(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
  lastRegisterByUrl.clear();
}
