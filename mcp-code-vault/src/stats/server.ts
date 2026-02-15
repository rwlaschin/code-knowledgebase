import Fastify from 'fastify';
import FastifyCompress from '@fastify/compress';
import FastifySSE from 'fastify-sse-v2';
import { connectMongoose } from '../db/mongoose';
import { streamRoutes } from './routes/stream';

export async function createStatsServer() {
  await connectMongoose();

  const logLevel = process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL ?? 'info');
  const fastify = Fastify({
    logger: { level: logLevel }
  });
  await fastify.register(FastifyCompress, { global: true, encodings: ['gzip', 'deflate', 'br'] });
  await fastify.register(FastifySSE);

  await fastify.register(streamRoutes);

  fastify.get('/config', async () => ({ config: 'empty' }));

  fastify.get('/docs', async () => ({ docs: 'empty' }));

  return fastify;
}
