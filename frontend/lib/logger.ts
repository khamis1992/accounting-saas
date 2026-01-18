/**
 * Logger Utility
 *
 * Centralized logging utility to replace console.log statements
 * Provides structured logging with levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export type LogContext = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: Date;
  error?: Error;
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxQueueSize: number;
}

class Logger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: process.env.NODE_ENV === "production" ? LogLevel.WARN : LogLevel.DEBUG,
      enableConsole: process.env.NODE_ENV !== "test",
      enableRemote: process.env.NODE_ENV === "production",
      maxQueueSize: 100,
      ...config,
    };
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Format log entry for console output
   */
  private formatForConsole(entry: LogEntry): string[] {
    const prefix = this.getLevelPrefix(entry.level);
    const timestamp = entry.timestamp.toISOString();
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    return [`${timestamp} [${prefix}]`, entry.message, contextStr];
  }

  /**
   * Get level prefix for console
   */
  private getLevelPrefix(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return "DEBUG";
      case LogLevel.INFO:
        return "INFO";
      case LogLevel.WARN:
        return "WARN";
      case LogLevel.ERROR:
        return "ERROR";
      default:
        return "LOG";
    }
  }

  /**
   * Add log entry to queue
   */
  private addToQueue(entry: LogEntry): void {
    this.logQueue.push(entry);

    // Trim queue if it exceeds max size
    if (this.logQueue.length > this.config.maxQueueSize) {
      this.logQueue.shift();
    }
  }

  /**
   * Send logs to remote endpoint
   */
  private async flushRemote(): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) {
      return;
    }

    if (this.logQueue.length === 0) {
      return;
    }

    try {
      const logsToSend = [...this.logQueue];
      this.logQueue = [];

      await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: logsToSend }),
        keepalive: true,
      });
    } catch (error) {
      // Re-add logs to queue on failure
      this.logQueue.unshift(...this.logQueue);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      error,
    };

    // Console output
    if (this.config.enableConsole) {
      const formatted = this.formatForConsole(entry);
      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(...formatted);
          break;
        case LogLevel.WARN:
          console.warn(...formatted);
          break;
        case LogLevel.ERROR:
          if (error) {
            console.error(...formatted, error);
          } else {
            console.error(...formatted);
          }
          break;
      }
    }

    // Add to queue for remote logging
    this.addToQueue(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorObj = error instanceof Error ? error : undefined;
    this.log(LogLevel.ERROR, message, context, errorObj);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, url: string, context?: LogContext): void {
    this.debug(`API ${method} ${url}`, {
      ...context,
      type: "api_request",
    });
  }

  /**
   * Log API response
   */
  apiResponse(
    method: string,
    url: string,
    status: number,
    duration?: number,
    context?: LogContext
  ): void {
    this.debug(`API ${method} ${url} - ${status}`, {
      ...context,
      type: "api_response",
      status,
      duration,
    });
  }

  /**
   * Log API error
   */
  apiError(method: string, url: string, error: Error, context?: LogContext): void {
    this.error(`API ${method} ${url} failed`, error, {
      ...context,
      type: "api_error",
    });
  }

  /**
   * Log user action
   */
  userAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      type: "user_action",
    });
  }

  /**
   * Log performance metric
   */
  performance(metric: string, value: number, unit: string = "ms", context?: LogContext): void {
    this.debug(`Performance: ${metric} = ${value}${unit}`, {
      ...context,
      type: "performance",
      metric,
      value,
      unit,
    });
  }

  /**
   * Flush queued logs to remote endpoint
   */
  flush(): void {
    // In browser, use sendBeacon or fetch with keepalive
    if (typeof window !== "undefined") {
      // Flush on page unload
      window.addEventListener("beforeunload", () => {
        this.flushRemote();
      });
    }
    this.flushRemote();
  }

  /**
   * Clear the log queue
   */
  clear(): void {
    this.logQueue = [];
  }

  /**
   * Get queued log entries
   */
  getQueue(): LogEntry[] {
    return [...this.logQueue];
  }
}

// Create singleton instance
const logger = new Logger();

// Flush logs on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    logger.flush();
  });

  // Flush logs periodically
  setInterval(() => {
    logger.flush();
  }, 30000); // Every 30 seconds
}

export default logger;

/**
 * Convenience hooks for using logger in components
 */
export function useLogger() {
  return logger;
}

/**
 * Create a scoped logger with a prefix
 */
export function createScopedLogger(prefix: string) {
  return {
    debug: (message: string, context?: LogContext) =>
      logger.debug(`${prefix}: ${message}`, context),
    info: (message: string, context?: LogContext) => logger.info(`${prefix}: ${message}`, context),
    warn: (message: string, context?: LogContext) => logger.warn(`${prefix}: ${message}`, context),
    error: (message: string, error?: Error, context?: LogContext) =>
      logger.error(`${prefix}: ${message}`, error, context),
    apiRequest: (method: string, url: string, context?: LogContext) =>
      logger.apiRequest(method, url, { ...context, scope: prefix }),
    apiResponse: (
      method: string,
      url: string,
      status: number,
      duration?: number,
      context?: LogContext
    ) => logger.apiResponse(method, url, status, duration, { ...context, scope: prefix }),
    apiError: (method: string, url: string, error: Error, context?: LogContext) =>
      logger.apiError(method, url, error, { ...context, scope: prefix }),
    userAction: (action: string, context?: LogContext) =>
      logger.userAction(action, { ...context, scope: prefix }),
    performance: (metric: string, value: number, unit?: string, context?: LogContext) =>
      logger.performance(metric, value, unit, { ...context, scope: prefix }),
  };
}
