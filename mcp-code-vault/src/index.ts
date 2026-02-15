import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });

import * as os from 'os';
import { createStatsServer } from './stats/server';
import { createMcpServer } from './mcp/server';
import { logger } from './logger';

export function localNetworkHost(): string | null {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const a of ifaces[name] ?? []) {
      if (a.family === 'IPv4' && !a.internal) return a.address;
    }
  }
  return null;
}

export async function main(): Promise<void> {
  const raw = process.env.PORT;
  if (raw === undefined || raw === '') throw new Error('PORT is required');
  const port = Number(raw);
  if (Number.isNaN(port) || port < 0) throw new Error('PORT must be a non-negative number');

  const statsApp = await createStatsServer();
  await statsApp.listen({ port, host: '0.0.0.0' });

  const networkHost = localNetworkHost();
  logger.info({
    msg: 'Stats server listening',
    local: `http://localhost:${port}`,
    network: networkHost != null ? `http://${networkHost}:${port}` : undefined,
    routes: ['/config', '/docs', '/metrics/stream (SSE)']
  });
  logger.info({ msg: 'MCP server: add this app as an MCP server in Cursor to connect on stdio' });

  await createMcpServer();
}

if (require.main === module) {
  main().catch((err) => {
    logger.fatal(err);
    process.exit(1);
  });
}
