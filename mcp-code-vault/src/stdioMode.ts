/**
 * True = assume MCP (stdio): do not write to stdout/stderr; use noop logger.
 * Default is true. Only when we're clearly in a TTY (isTTY === true) do we allow file logging and non-noop logger.
 * Set MCP_STDIO=0 to force non-MCP when running in a terminal but with piped stdio.
 */
export const stdioMode =
  process.env.MCP_STDIO !== '0' && process.stdout.isTTY !== true;

type LogSink = (message: string) => void;
let processLogSink: LogSink | null = null;

/** Set the sink for writeProcessLog (e.g. file). Call from index once logFile is loaded. */
export function setProcessLogSink(sink: LogSink): void {
  processLogSink = sink;
}

/** In stdio mode we only skip stdout/stderr; the sink (file) is still used. */
export function writeProcessLog(message: string): void {
  if (processLogSink) processLogSink(message);
}
