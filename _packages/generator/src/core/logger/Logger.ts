import type { ILogger, LogLevel, LoggerOptions } from '../interfaces/ILogger';

/**
 * Log level priorities (lower = more verbose)
 */
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

/**
 * Console Logger implementation.
 * 
 * Features:
 * - Log level filtering
 * - Prefix support for context
 * - Child loggers with inherited settings
 * - Emoji prefixes for visual distinction
 */
export class Logger implements ILogger {
  private readonly level: LogLevel;
  private readonly prefix: string;
  
  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.prefix = options.prefix ?? '';
  }
  
  /**
   * Log debug information
   */
  debug(message: string, ...args: unknown[]): void {
    this.log('debug', '🔍', message, args);
  }
  
  /**
   * Log informational messages
   */
  info(message: string, ...args: unknown[]): void {
    this.log('info', 'ℹ️', message, args);
  }
  
  /**
   * Log warning messages
   */
  warn(message: string, ...args: unknown[]): void {
    this.log('warn', '⚠️', message, args);
  }
  
  /**
   * Log error messages
   */
  error(message: string, ...args: unknown[]): void {
    this.log('error', '❌', message, args);
  }
  
  /**
   * Create a child logger with a prefix
   */
  child(prefix: string): ILogger {
    const newPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger({
      level: this.level,
      prefix: newPrefix,
    });
  }
  
  /**
   * Internal log method
   */
  private log(level: LogLevel, emoji: string, message: string, args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const prefixPart = this.prefix ? `[${this.prefix}]` : '';
    const formattedMessage = `${emoji} ${prefixPart} ${message}`.trim();
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, ...args);
        break;
      case 'info':
        console.info(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
        console.error(formattedMessage, ...args);
        break;
    }
  }
  
  /**
   * Check if a message at the given level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }
}
