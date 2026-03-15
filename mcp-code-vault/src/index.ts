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
import { setSocketIO } from './stats/streamChannel';
import { markStatsServerReady } from './stats/metricsClient';
import { writeProcessLog, setProcessLogSink, stdioMode } from './stdioMode';
import { appendLine as appendProcessLogToFile, closeLogFile, getLogDir, getLogPath } from './logFile';
import { appendRequestLog } from './mcp/requestLog';
import { registerShutdown, runShutdown } from './shutdown';
import { disconnectMongoose } from './db/mongoose';
import { startDiscoveryClient, stopDiscoveryClient } from './discoveryClient';

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
  process.stderr.write(message + '\n');
}

export async function main(): Promise<void> {
  logToStderr('[backend] Starting...');
  setProcessLogSink(appendProcessLogToFile);

  const logDir = getLogDir();
  const cwd = process.cwd();
  logToStderr(`[backend] cwd=${cwd} port=${process.env.PORT ?? '(none)'} logFile=${getLogPath()}`);
  logger.info({ msg: 'MCP server starting', cwd, stdioMode, logFile: getLogPath(), logDir });

  const raw = process.env.PORT;
  const port = raw !== undefined && raw !== '' ? Number(raw) : (stdioMode ? 3000 : NaN);
  if (!stdioMode && (raw === undefined || raw === '')) throw new Error('PORT is required');
  if (Number.isNaN(port) || port < 0 || !Number.isInteger(port)) throw new Error('PORT must be a non-negative integer');

  logger.info({ msg: 'Ports', http: port, discoveryUdp: 9255 });
  setServerContext(cwd, String(port));

  await createMcpServer();

  // When Cursor disconnects (e.g. Disable), stdin gets EOF. Shut down everything and exit.
  process.stdin.on('end', () => {
    runShutdown().then(() => {});
  });

  let statsApp: Awaited<ReturnType<typeof createStatsServer>> | null = null;
  try {
    statsApp = await createStatsServer();
    await statsApp.listen({ port: Number(port), host: '0.0.0.0' });
    markStatsServerReady();
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
  io.on('connection', (socket) => {
    writeProcessLog('[BACKEND] Socket.IO client connected\n');
    socket.emit('connected', JSON.stringify({ ts: new Date().toISOString() }));
    socket.emit('heartbeat', JSON.stringify({ ts: new Date().toISOString() }));
    const iv = setInterval(() => {
      socket.emit('heartbeat', JSON.stringify({ ts: new Date().toISOString() }));
    }, STREAM_HEARTBEAT_MS);
    socket.on('disconnect', () => clearInterval(iv));
  });

  startDiscoveryClient(Number(port));
  registerShutdown(stopDiscoveryClient);

  const networkHost = localNetworkHost();
  logToStderr(`[backend] Stats server listening on http://0.0.0.0:${port} (metrics, Socket.IO, discovery UDP 9255)`);
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

  // Metrics are recorded only when the MCP is requested (tool calls via withMetrics); no startup/heartbeat POSTs.
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
