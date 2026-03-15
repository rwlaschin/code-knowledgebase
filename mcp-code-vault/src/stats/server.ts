import * as fs from 'fs';
import pino from 'pino';
import Fastify from 'fastify';
import FastifyCompress from '@fastify/compress';
import FastifyCors from '@fastify/cors';
import FastifySSE from 'fastify-sse-v2';
import { connectMongoose } from '../db/mongoose';
import { runSeed } from '../db/seed';
import { stdioMode } from '../stdioMode';
import { getLogPath, ensureLogDir } from '../logFile';
import { streamRoutes } from './routes/stream';
import { metricRoutes } from './routes/metrics';
import { projectRoutes } from './routes/projects';
import { scanRoutes } from './routes/scan';

export async function createStatsServer() {
  await connectMongoose();
  await runSeed();

  const isTest = process.env.NODE_ENV === 'test';
  const logLevel =
    isTest ? 'silent' : stdioMode ? 'silent' : (process.env.LOG_LEVEL ?? 'info');
  if (!stdioMode && !isTest) ensureLogDir();
  let loggerOpt: false | { level: string; stream: ReturnType<typeof pino.destination> } = false;
  if (!stdioMode && !isTest) {
    const logPath = getLogPath();
    const fd = fs.openSync(logPath, 'a');
    loggerOpt = { level: logLevel, stream: pino.destination({ fd, sync: false }) };
  }
  const fastify = Fastify({ logger: loggerOpt });
  await fastify.register(FastifyCors, { origin: true }); // allow UI origin for direct EventSource
  await fastify.register(FastifyCompress, { global: true, encodings: ['gzip', 'deflate', 'br'] });
  await fastify.register(FastifySSE);

  await fastify.register(streamRoutes);
  await fastify.register(metricRoutes);
  await fastify.register(projectRoutes);
  await fastify.register(scanRoutes);

  fastify.get('/config', async () => ({ config: 'empty' }));

  fastify.get('/docs', async () => ({ docs: 'empty' }));

  return fastify;
}
