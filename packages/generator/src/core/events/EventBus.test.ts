import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from './EventBus';

describe('EventBus', () => {
  let eventBus: EventBus;
  
  beforeEach(() => {
    eventBus = new EventBus();
  });
  
  describe('emit and on', () => {
    it('should emit events to subscribed handlers', () => {
      const handler = vi.fn();
      
      eventBus.on('test-event', handler);
      eventBus.emit('test-event', { data: 'hello' });
      
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({ data: 'hello' });
    });
    
    it('should support multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      eventBus.emit('test-event', 'payload');
      
      expect(handler1).toHaveBeenCalledWith('payload');
      expect(handler2).toHaveBeenCalledWith('payload');
    });
    
    it('should not call handlers for different events', () => {
      const handler = vi.fn();
      
      eventBus.on('event-a', handler);
      eventBus.emit('event-b', 'payload');
      
      expect(handler).not.toHaveBeenCalled();
    });
    
    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      
      const unsubscribe = eventBus.on('test-event', handler);
      
      eventBus.emit('test-event', 'first');
      expect(handler).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      
      eventBus.emit('test-event', 'second');
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
    
    it('should handle events with no subscribers', () => {
      // Should not throw
      expect(() => {
        eventBus.emit('no-subscribers', { data: 'test' });
      }).not.toThrow();
    });
  });
  
  describe('once', () => {
    it('should call handler only once', () => {
      const handler = vi.fn();
      
      eventBus.once('test-event', handler);
      
      eventBus.emit('test-event', 'first');
      eventBus.emit('test-event', 'second');
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('first');
    });
    
    it('should auto-unsubscribe after first call', () => {
      const handler = vi.fn();
      
      eventBus.once('test-event', handler);
      eventBus.emit('test-event', 'payload');
      
      expect(eventBus.listenerCount('test-event')).toBe(0);
    });
  });
  
  describe('off', () => {
    it('should remove specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      
      eventBus.off('test-event', handler1);
      eventBus.emit('test-event', 'payload');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith('payload');
    });
    
    it('should handle removing non-existent handler', () => {
      const handler = vi.fn();
      
      // Should not throw
      expect(() => {
        eventBus.off('test-event', handler);
      }).not.toThrow();
    });
  });
  
  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const otherHandler = vi.fn();
      
      eventBus.on('test-event', handler1);
      eventBus.on('test-event', handler2);
      eventBus.on('other-event', otherHandler);
      
      eventBus.removeAllListeners('test-event');
      
      eventBus.emit('test-event', 'payload');
      eventBus.emit('other-event', 'payload');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(otherHandler).toHaveBeenCalled();
    });
    
    it('should remove all listeners when no event specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      eventBus.on('event-a', handler1);
      eventBus.on('event-b', handler2);
      
      eventBus.removeAllListeners();
      
      eventBus.emit('event-a', 'payload');
      eventBus.emit('event-b', 'payload');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });
  
  describe('listenerCount', () => {
    it('should return correct count of listeners', () => {
      expect(eventBus.listenerCount('test-event')).toBe(0);
      
      eventBus.on('test-event', () => {});
      expect(eventBus.listenerCount('test-event')).toBe(1);
      
      eventBus.on('test-event', () => {});
      expect(eventBus.listenerCount('test-event')).toBe(2);
    });
    
    it('should return 0 for non-existent event', () => {
      expect(eventBus.listenerCount('non-existent')).toBe(0);
    });
  });
  
  describe('async handlers', () => {
    it('should support async handlers', async () => {
      const results: string[] = [];
      
      eventBus.on('async-event', async (payload: string) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push(payload);
      });
      
      eventBus.emit('async-event', 'test');
      
      // Handler is async, so result won't be immediate
      expect(results).toHaveLength(0);
      
      // Wait for async handler
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(results).toHaveLength(1);
      expect(results[0]).toBe('test');
    });
  });
  
  describe('error handling', () => {
    it('should not break other handlers when one throws', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();
      
      eventBus.on('test-event', errorHandler);
      eventBus.on('test-event', normalHandler);
      
      // Should not throw and should call other handlers
      expect(() => {
        eventBus.emit('test-event', 'payload');
      }).not.toThrow();
      
      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
    });
  });
});
