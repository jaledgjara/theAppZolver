/**
 * Production-safe logger that only outputs in development mode.
 * Wraps console methods behind __DEV__ checks to prevent
 * performance degradation and info leaks in production builds.
 */

type LogLevel = "log" | "warn" | "error" | "info" | "debug";

function createLogger(level: LogLevel) {
  return (...args: unknown[]) => {
    if (__DEV__) {
      console[level](...args);
    }
  };
}

/** Always logs, even in production — use only for critical errors */
function createAlwaysLogger(level: LogLevel) {
  return (...args: unknown[]) => {
    console[level](...args);
  };
}

export const logger = {
  log: createLogger("log"),
  warn: createLogger("warn"),
  info: createLogger("info"),
  debug: createLogger("debug"),
  /** Logs in production too — use only for critical, non-sensitive errors */
  error: createAlwaysLogger("error"),
};
