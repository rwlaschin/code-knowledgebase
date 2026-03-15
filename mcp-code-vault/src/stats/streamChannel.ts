/**
 * Stream to all connected UI clients. Socket.IO (primary) + optional SSE.
 * MCP POSTs to /metrics → Mongo → pushToStream → io.emit / subscribers.
 */

import type { Server as SocketIOServer } from 'socket.io';
import { writeProcessLog } from '../stdioMode';

type StreamMessage = { event: string; data: string };
type Subscriber = (msg: StreamMessage | null) => void;
const subscribers = new Set<Subscriber>();
let io: SocketIOServer | null = null;

export function setSocketIO(socketServer: SocketIOServer): void {
  io = socketServer;
}

/** Push a metric (or any event) to the stream. Every connected client receives it. */
export function pushToStream(event: string, data: string): void {
  writeProcessLog(`[BACKEND] pushing message to client event=${event} ${data.slice(0, 60)}...\n`);
  const msg: StreamMessage = { event, data };
  if (io) io.emit(event, data);
  const subs = Array.from(subscribers);
  subscribers.clear();
  subs.forEach((resolve) => resolve(msg));
}

function waitNext(timeoutMs: number): Promise<StreamMessage | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      subscribers.delete(deliver);
      resolve(null);
    }, timeoutMs);
    const deliver: Subscriber = (msg: StreamMessage | null) => {
      clearTimeout(t);
      subscribers.delete(deliver);
      resolve(msg);
    };
    subscribers.add(deliver);
  });
}

const HEARTBEAT_MS = 5000;

/** Async generator for SSE (tests / legacy): connected, immediate heartbeat, then metric or heartbeat. */
export async function* streamToUI(): AsyncGenerator<StreamMessage> {
  yield { event: 'connected', data: JSON.stringify({ ts: new Date().toISOString() }) };
  yield { event: 'heartbeat', data: JSON.stringify({ ts: new Date().toISOString() }) };
  while (true) {
    const msg = await waitNext(HEARTBEAT_MS);
    if (msg) {
      yield msg;
    } else {
      writeProcessLog(`[BACKEND] sending heartbeat to client\n`);
      yield { event: 'heartbeat', data: JSON.stringify({ ts: new Date().toISOString() }) };
    }
  }
}
