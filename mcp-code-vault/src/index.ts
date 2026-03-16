import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env from package root so it works when cwd is not the project (e.g. Cursor MCP).
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });
dotenv.config({ quiet: true }); // still allow cwd/.env to override

import * as os from 'os';
import { Server as SocketIOServer } from 'socket.io';
import { createStatsServer } from './stats/server';
import { createMcpServer } from './mcp/server';
import { setServerContext } from './mcp/context';
import { logger } from './logger';
import { setSocketIO, pushToStream, setStreamRole } from './stats/streamChannel';
import { markServerReady, setStatsBaseUrl } from './stats/metricsClient';
import { writeProcessLog, setProcessLogSink, addProcessLogSink, stdioMode } from './stdioMode';
import { appendLine as appendProcessLogToFile, closeLogFile, getLogDir, getLogPath } from './logFile';
import { appendRequestLog } from './mcp/requestLog';
import { registerShutdown, runShutdown, setShutdownOnTransportClose } from './shutdown';
import { disconnectMongoose } from './db/mongoose';
import {
  startDiscoveryClient,
  stopDiscoveryClient,
  tryStartDiscoveryAsPrimary,
  startPrimaryAnnouncer,
  discoverPrimary,
  setRegisterUpgrade
} from './discoveryClient';
import { startPrimaryServer, stopPrimaryServer, getCurrentSecondaries } from './primaryServer';
import { connectToPrimary, disconnectFromPrimary, onPrimaryDisconnect } from './primaryClient';

let processInstanceId: string | undefined = undefined;

export function localNetworkHost(): string | null {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const a of ifaces[name] ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return null;
}

function logToStderr(message: string): void {
  const line = message != null ? String(message) : '';
  process.stderr.write(line + '\n');
}

/** Options when starting as primary (e.g. from failover: upgrade so UI replaces secondary chip). */
interface RunAsPrimaryOpts {
  projectName?: string;
  upgrade?: boolean;
}

/**
 * Full primary startup: stats server, Mongo, Socket.IO, discovery UDP 9255, primary TCP 9256.
 * Used at initial startup when we bound 9255 and for failover when a client upgrades to primary.
 * Start TCP 9256 and announcer first so secondaries can connect while the rest of primary comes up.
 * When opts.upgrade is true, register with the UI includes upgrade: true so the UI can replace the secondary chip.
 */
async function runAsPrimary(port: number, opts?: RunAsPrimaryOpts): Promise<void> {
  setShutdownOnTransportClose(false);
  if (opts?.upgrade && opts?.projectName) setRegisterUpgrade(opts.projectName);
  const projectName = opts?.projectName ?? process.env.MCP_PROJECT_NAME ?? `mcp-${port}`;
  const cwd = process.cwd();

  registerShutdown(() => {
    pushToStream('primary:disconnected', JSON.stringify({ ts: new Date().toISOString(), port }));
  });
  startPrimaryServer(Number(port));
  registerShutdown(stopPrimaryServer);
  const primaryTcpPort = Number(process.env.PRIMARY_TCP_PORT) || 9256;
  startPrimaryAnnouncer('127.0.0.1', primaryTcpPort);

  let statsApp: Awaited<ReturnType<typeof createStatsServer>> | null = null;
  try {
    statsApp = await createStatsServer();
    await statsApp.listen({ port: Number(port), host: '0.0.0.0' });
    await markServerReady('server');
    registerShutdown(async () => {
      await statsApp!.close();
    });
    registerShutdown(async () => {
      await disconnectMongoose();
    });
    registerShutdown(closeLogFile);
  } catch (statsErr) {
    const errMsg = statsErr instanceof Error ? statsErr.message : String(statsErr);
    const errStack = statsErr instanceof Error ? statsErr.stack : undefined;
    logToStderr('[backend] Stats server failed: ' + errMsg);
    if (errStack) logToStderr(errStack);
    if (stdioMode) {
      writeProcessLog(`[BACKEND] Stats server failed (MCP-only): ${errMsg} cwd=${cwd}\n`);
      registerShutdown(closeLogFile);
      return;
    }
    throw statsErr;
  }

  const STREAM_HEARTBEAT_MS = 5000;
  const io = new SocketIOServer(statsApp!.server, {
    cors: {
      origin: ['http://localhost:2999', 'http://127.0.0.1:2999'],
      methods: ['GET', 'POST']
    }
  });
  setSocketIO(io);
  setStreamRole('primary');
  io.on('connection', (socket) => {
    writeProcessLog('[BACKEND] Socket.IO client connected\n');
    socket.emit('connected', JSON.stringify({ ts: new Date().toISOString() }));
    socket.emit('heartbeat', JSON.stringify({ ts: new Date().toISOString() }));
    socket.emit('primary:identified', JSON.stringify({ ts: new Date().toISOString(), port }));
    for (const { port: p, projectName: name } of getCurrentSecondaries()) {
      socket.emit('secondary:connected', JSON.stringify({ port: p, projectName: name, ts: new Date().toISOString() }));
    }
    const iv = setInterval(() => {
      socket.emit('heartbeat', JSON.stringify({ ts: new Date().toISOString() }));
    }, STREAM_HEARTBEAT_MS);
    socket.on('disconnect', () => clearInterval(iv));
  });

  startDiscoveryClient(Number(port), projectName);
  registerShutdown(stopDiscoveryClient);

  pushToStream('primary:identified', JSON.stringify({ ts: new Date().toISOString(), port }));

  const networkHost = localNetworkHost();
  logToStderr(
    `[backend] Primary: stats http://0.0.0.0:${port} (metrics, Socket.IO), discovery UDP 9255, primary TCP 9256`
  );
  writeProcessLog(
    `[BACKEND] Stats server listening on port ${port} (POST /metrics, GET /metrics, Socket.IO stream)\n`
  );
  writeProcessLog(`[BACKEND] Discovery: listening on UDP 9255; will register with UI when broadcast received\n`);
  logger.info({
    msg: 'Backend ports',
    http: port,
    discoveryUdp: 9255,
    local: `http://localhost:${port}`,
    network: networkHost != null ? `http://${networkHost}:${port}` : undefined
  });
  logger.info({
    msg: 'Stats routes',
    routes: ['/config', '/docs', '/metrics', '/metrics/stream (SSE)', '/projects', '/scan/progress', 'Socket.IO']
  });
  logger.info({ msg: 'MCP: add this app as an MCP server in Cursor to connect on stdio' });
  logger.info({ msg: 'Discovery: listening on UDP 9255; will register with UI when it broadcasts' });
}

export async function main(): Promise<void> {
  if (processInstanceId !== undefined) {
    process.stderr.write(`[backend] Already initialized (instance ${processInstanceId}), skipping duplicate.\n`);
    return;
  }
  const g = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : ({} as { crypto?: { randomUUID?: () => string } });
  processInstanceId =
    g?.crypto?.randomUUID != null
      ? g.crypto.randomUUID()
      : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  process.stderr.write(`[backend] Instance ID: ${processInstanceId}\n`);

  logToStderr('[backend] Starting...');
  setProcessLogSink(appendProcessLogToFile);
  // So [MCP] and other process-log lines go to file and stderr (Cursor may show MCP stderr)
  addProcessLogSink((msg: string) => {
    if (msg != null && msg !== '') process.stderr.write(String(msg));
  });

  const logDir = getLogDir();
  const cwd = process.cwd();
  const logFilePath = getLogPath();
  logToStderr(`[backend] cwd=${cwd} port=${process.env.PORT ?? '(none)'} logFile=${logFilePath}`);
  writeProcessLog(`[MCP] process log started logFile=${logFilePath}\n`);
  logger.info({ msg: 'MCP server starting', cwd, stdioMode, logFile: getLogPath(), logDir });

  const raw = process.env.PORT;
  const port = raw !== undefined && raw !== '' ? Number(raw) : (stdioMode ? 3000 : NaN);
  if (!stdioMode && (raw === undefined || raw === '')) throw new Error('PORT is required');
  if (Number.isNaN(port) || port < 0 || !Number.isInteger(port)) throw new Error('PORT must be a non-negative integer');

  logger.info({ msg: 'Ports', http: port, discoveryUdp: 9255 });
  setServerContext(cwd, String(port));

  await createMcpServer();

  // When Cursor disconnects (e.g. Disable), stdin gets EOF. Close primary connection first so primary can emit secondary:disconnected to UI, then shut down.
  process.stdin.on('end', () => {
    disconnectFromPrimary();
    runShutdown().then(() => {});
  });

  // Close HTTP server and release port when killed by signal (SIGTERM/SIGINT).
  const onSignal = () => {
    logToStderr('[backend] Signal received, shutting down...');
    disconnectFromPrimary();
    runShutdown().then(() => {});
  };
  process.on('SIGTERM', onSignal);
  process.on('SIGINT', onSignal);

  const isPrimary = await tryStartDiscoveryAsPrimary(Number(port));
  if (isPrimary) {
    setShutdownOnTransportClose(false);
    await runAsPrimary(port);
    return;
  }

  setShutdownOnTransportClose(true);
  const projectName = process.env.MCP_PROJECT_NAME ?? 'default';
  const FAILOVER_JITTER_MS = 50;
  const maxRetries = 100;

  async function secondaryStartup(fromFailover: boolean): Promise<void> {
    let retries = 0;
    while (retries < maxRetries) {
      const discovered = await discoverPrimary(2000);
      if (discovered) {
        logToStderr(`[backend] connecting to primary at ${discovered.host}:${discovered.tcpPort} (from broadcast)`);
      } else {
        logToStderr(`[backend] no broadcast received; connecting to primary at 127.0.0.1:9256 (default)`);
      }
      const result = await connectToPrimary(Number(port), projectName, discovered ?? undefined);
      if (result) {
        setStatsBaseUrl(`http://127.0.0.1:${result.statsPort}`);
        await markServerReady('client');
        registerShutdown(disconnectFromPrimary);
        onPrimaryDisconnect(() => {
          logToStderr('[backend] Primary disconnected; redoing startup after 0–50ms.');
          disconnectFromPrimary();
          setTimeout(() => secondaryStartup(true), Math.floor(Math.random() * 51));
        });
        logToStderr(`[backend] Client; metrics → primary at ${result.statsPort}`);
        return;
      }
      const becamePrimary = await tryStartDiscoveryAsPrimary(Number(port));
      if (becamePrimary) {
        await runAsPrimary(port, fromFailover ? { projectName, upgrade: true } : undefined);
        return;
      }
      retries += 1;
      const jitter = Math.floor(Math.random() * (FAILOVER_JITTER_MS + 1));
      await new Promise((r) => setTimeout(r, jitter));
    }
    logToStderr('[backend] Could not connect to primary or become primary; giving up after retries.');
  }

  await secondaryStartup(false);
}

// When run via tsx, require.main can be the tsx loader, so also treat this file as entry when argv[1] is index.
const isEntry =
  (typeof require !== 'undefined' && require.main === module) ||
  (process.argv[1] != null &&
    (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js')));

if (isEntry) {
  const onFatal = (err: unknown): void => {
    const msg = err instanceof Error ? (err.stack ?? err.message) : String(err);
    process.stderr.write('[backend] FATAL: ' + msg + '\n');
    logger.fatal(err);
    process.exit(1);
  };
  try {
    main().catch(onFatal);
  } catch (err) {
    onFatal(err);
  }
}
