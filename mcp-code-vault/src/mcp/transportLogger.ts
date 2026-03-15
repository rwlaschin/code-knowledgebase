import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { runShutdown } from '../shutdown';
import { postMetric } from '../stats/metricsClient';
import { appendRequestLog } from './requestLog';

function getMethod(message: JSONRPCMessage): string {
  if (message && typeof message === 'object' && 'method' in message && typeof (message as { method?: unknown }).method === 'string') {
    return (message as { method: string }).method;
  }
  return 'unknown';
}

type MessageHandler = (message: JSONRPCMessage, extra?: unknown) => void;

/**
 * Wraps StdioServerTransport to log each incoming request method to logs/mcp-requests.log
 * (even in stdio mode) so Cursor users can see when a query arrives.
 */
export function createLoggingStdioTransport(): Transport {
  const inner = new StdioServerTransport();

  return {
    get onclose() {
      return inner.onclose;
    },
    set onclose(handler) {
      inner.onclose = () => {
        if (handler) handler();
        runShutdown().then(() => {});
      };
    },
    get onerror() {
      return inner.onerror;
    },
    set onerror(handler) {
      inner.onerror = handler;
    },
    get onmessage() {
      return inner.onmessage as MessageHandler | undefined;
    },
    set onmessage(handler: MessageHandler | undefined) {
      inner.onmessage = handler
        ? (message: JSONRPCMessage) => {
            appendRequestLog(getMethod(message));
            const now = new Date().toISOString();
            postMetric({
              instance_id: process.env.INSTANCE_ID ?? 'mcp-code-vault',
              operation: 'query',
              started_at: now,
              ended_at: now,
              duration_ms: 0,
              status: 'ok',
              metadata: { method: getMethod(message) }
            });
            handler(message, undefined);
          }
        : undefined;
    },
    start: () => inner.start(),
    send: (message: JSONRPCMessage) => inner.send(message),
    close: () => inner.close()
  };
}
