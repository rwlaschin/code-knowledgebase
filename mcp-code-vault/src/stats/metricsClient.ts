/**
 * Metrics client: POST to stats server (POST /metrics).
 * Queues metrics until the stats server is ready, then flushes.
 * Must never write to stdout/stderr — when run as MCP, stdio is the JSON-RPC channel.
 */

const INSTANCE_ID = process.env.INSTANCE_ID ?? 'mcp-code-vault';

export type MetricPayload = {
  instance_id: string;
  operation: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  status: 'ok' | 'error';
  error_code?: string;
  metadata?: Record<string, unknown>;
};

function getStatsBase(): string {
  const port = process.env.STATS_PORT ?? process.env.PORT ?? '3000';
  return `http://127.0.0.1:${port}`;
}

/**
 * Sends metrics to the stats server. Queues until server is ready, then post becomes send and queue is flushed.
 * Your design: post() only pushes; when ready, this.post = this.send and flush queue.
 */
class MetricSender {
  messageQueue: MetricPayload[] = [];

  /** After server is ready: post becomes send, then flush queue. */
  markServerReady(): void {
    this.post = this.send;
    this.messageQueue.forEach(this.post);
    this.messageQueue = [];
  }

  /** Queue only. After markServerReady(), this is reassigned to send. */
  post = (payload: MetricPayload): void => {
    this.messageQueue.push(payload);
  };

  /** Actually POST one metric to the stats server. Fire-and-forget. */
  send = (payload: MetricPayload): void => {
    const base = getStatsBase();
    fetch(`${base}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  };
}

const metricSender = new MetricSender();

export function markStatsServerReady(): void {
  metricSender.markServerReady();
}

/** Reset queue and sender state (for tests only). */
export function resetMetricSenderForTesting(): void {
  metricSender.messageQueue = [];
  metricSender.post = (payload: MetricPayload): void => {
    metricSender.messageQueue.push(payload);
  };
}

export function postMetric(payload: MetricPayload): void {
  metricSender.post(payload);
}

/**
 * Wraps an async handler with metrics: records start/end, duration_ms, status,
 * POSTs to stats server. Plan: "withMetrics(operation)(handler)".
 */
export function withMetrics<TArgs extends unknown[], TResult>(
  operation: string,
  handler: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const started_at = new Date().toISOString();
    let status: 'ok' | 'error' = 'ok';
    let error_code: string | undefined;
    try {
      const result = await handler(...args);
      return result;
    } catch (err) {
      status = 'error';
      error_code = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const ended_at = new Date().toISOString();
      const started = new Date(started_at).getTime();
      const ended = new Date(ended_at).getTime();
      const duration_ms = Math.max(0, ended - started);
      postMetric({
        instance_id: INSTANCE_ID,
        operation,
        started_at,
        ended_at,
        duration_ms,
        status,
        error_code,
        metadata: {}
      });
    }
  };
}
