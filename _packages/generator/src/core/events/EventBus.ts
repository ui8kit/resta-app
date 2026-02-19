import type { IEventBus, EventHandler } from '../interfaces/IEventBus';

/**
 * EventBus implementation for inter-service communication.
 * 
 * Features:
 * - Subscribe/unsubscribe to events
 * - One-time event handlers
 * - Async handler support
 * - Error isolation between handlers
 */
export class EventBus implements IEventBus {
  private listeners = new Map<string, Set<EventHandler>>();
  
  /**
   * Emit an event to all subscribers
   */
  emit<T = unknown>(event: string, payload: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      return;
    }
    
    // Create a copy to avoid issues if handlers modify the set
    const handlersCopy = Array.from(handlers);
    
    for (const handler of handlersCopy) {
      try {
        // Fire and forget - async handlers run independently
        const result = handler(payload);
        
        // If handler returns a promise, catch any errors
        if (result && typeof result === 'object' && 'catch' in result) {
          (result as Promise<void>).catch((error) => {
            console.error(`[EventBus] Async handler error for "${event}":`, error);
          });
        }
      } catch (error) {
        // Don't let one handler break others
        console.error(`[EventBus] Handler error for "${event}":`, error);
      }
    }
  }
  
  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    const handlers = this.listeners.get(event)!;
    handlers.add(handler as EventHandler);
    
    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }
  
  /**
   * Subscribe to an event once (auto-unsubscribe after first call)
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): void {
    const wrappedHandler: EventHandler<T> = (payload) => {
      this.off(event, wrappedHandler);
      return handler(payload);
    };
    
    this.on(event, wrappedHandler);
  }
  
  /**
   * Remove a specific handler from an event
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }
    
    handlers.delete(handler as EventHandler);
    
    // Clean up empty sets
    if (handlers.size === 0) {
      this.listeners.delete(event);
    }
  }
  
  /**
   * Remove all handlers for an event (or all events if no event specified)
   */
  removeAllListeners(event?: string): void {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
  
  /**
   * Get count of listeners for an event
   */
  listenerCount(event: string): number {
    const handlers = this.listeners.get(event);
    return handlers ? handlers.size : 0;
  }
}
