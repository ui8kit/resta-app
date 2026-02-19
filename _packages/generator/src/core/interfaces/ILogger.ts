/**
 * Logger interface for generator services.
 * 
 * Provides a consistent logging API that can be implemented
 * with different backends (console, file, external service).
 */
export interface ILogger {
  /**
   * Log debug information (only in development)
   */
  debug(message: string, ...args: unknown[]): void;
  
  /**
   * Log informational messages
   */
  info(message: string, ...args: unknown[]): void;
  
  /**
   * Log warning messages
   */
  warn(message: string, ...args: unknown[]): void;
  
  /**
   * Log error messages
   */
  error(message: string, ...args: unknown[]): void;
  
  /**
   * Create a child logger with a prefix
   */
  child(prefix: string): ILogger;
}

/**
 * Log level enum for filtering
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * Logger options
 */
export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
}
