import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from './Logger';

describe('Logger', () => {
  let consoleDebug: ReturnType<typeof vi.spyOn>;
  let consoleInfo: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;
  
  beforeEach(() => {
    consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleDebug.mockRestore();
    consoleInfo.mockRestore();
    consoleWarn.mockRestore();
    consoleError.mockRestore();
  });
  
  describe('log levels', () => {
    it('should log all levels when level is debug', () => {
      const logger = new Logger({ level: 'debug' });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleDebug).toHaveBeenCalled();
      expect(consoleInfo).toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
    });
    
    it('should filter debug when level is info', () => {
      const logger = new Logger({ level: 'info' });
      
      logger.debug('debug message');
      logger.info('info message');
      
      expect(consoleDebug).not.toHaveBeenCalled();
      expect(consoleInfo).toHaveBeenCalled();
    });
    
    it('should filter debug and info when level is warn', () => {
      const logger = new Logger({ level: 'warn' });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      
      expect(consoleDebug).not.toHaveBeenCalled();
      expect(consoleInfo).not.toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalled();
    });
    
    it('should only log errors when level is error', () => {
      const logger = new Logger({ level: 'error' });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleDebug).not.toHaveBeenCalled();
      expect(consoleInfo).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
    });
    
    it('should log nothing when level is silent', () => {
      const logger = new Logger({ level: 'silent' });
      
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');
      
      expect(consoleDebug).not.toHaveBeenCalled();
      expect(consoleInfo).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    });
  });
  
  describe('prefix', () => {
    it('should include prefix in log messages', () => {
      const logger = new Logger({ level: 'info', prefix: 'MyService' });
      
      logger.info('test message');
      
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[MyService]'),
      );
    });
    
    it('should not include prefix when not specified', () => {
      const logger = new Logger({ level: 'info' });
      
      logger.info('test message');
      
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.not.stringContaining('['),
      );
    });
  });
  
  describe('child', () => {
    it('should create child logger with combined prefix', () => {
      const parent = new Logger({ level: 'info', prefix: 'Parent' });
      const child = parent.child('Child');
      
      child.info('test message');
      
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child]'),
      );
    });
    
    it('should inherit log level from parent', () => {
      const parent = new Logger({ level: 'warn' });
      const child = parent.child('Child');
      
      child.info('should not appear');
      child.warn('should appear');
      
      expect(consoleInfo).not.toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalled();
    });
    
    it('should work without parent prefix', () => {
      const parent = new Logger({ level: 'info' });
      const child = parent.child('Child');
      
      child.info('test message');
      
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Child]'),
      );
    });
  });
  
  describe('additional arguments', () => {
    it('should pass additional arguments to console', () => {
      const logger = new Logger({ level: 'info' });
      const extraData = { key: 'value' };
      
      logger.info('message with data', extraData);
      
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.any(String),
        extraData
      );
    });
    
    it('should handle multiple additional arguments', () => {
      const logger = new Logger({ level: 'info' });
      
      logger.info('message', 'arg1', 'arg2', 123);
      
      expect(consoleInfo).toHaveBeenCalledWith(
        expect.any(String),
        'arg1',
        'arg2',
        123
      );
    });
  });
});
