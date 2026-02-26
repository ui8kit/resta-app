export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  child(prefix: string): ILogger;
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
}
