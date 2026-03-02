type LogContext = Record<string, unknown>;

function formatEvent(level: string, event: string): string {
  return `[${level.toUpperCase()}] ${event}`;
}

export const logger = {
  error(event: string, context?: LogContext) {
    console.error(formatEvent("error", event), context ?? {});
  },
  warn(event: string, context?: LogContext) {
    console.warn(formatEvent("warn", event), context ?? {});
  },
  info(event: string, context?: LogContext) {
    console.info(formatEvent("info", event), context ?? {});
  },
};
