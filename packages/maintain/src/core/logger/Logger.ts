import type { ILogger, LogLevel, LoggerOptions } from '../interfaces';

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export class Logger implements ILogger {
  private readonly level: LogLevel;
  private readonly prefix: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.prefix = options.prefix ?? '';
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, args);
  }

  child(prefix: string): ILogger {
    const nextPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger({ level: this.level, prefix: nextPrefix });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[this.level];
  }

  private log(level: LogLevel, message: string, args: unknown[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const prefixed = this.prefix ? `[${this.prefix}] ${message}` : message;
    if (level === 'debug') {
      console.debug(prefixed, ...args);
      return;
    }
    if (level === 'info') {
      console.info(prefixed, ...args);
      return;
    }
    if (level === 'warn') {
      console.warn(prefixed, ...args);
      return;
    }
    console.error(prefixed, ...args);
  }
}
