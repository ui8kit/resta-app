/**
 * Event Bus interface for loose coupling between services.
 * 
 * Allows services to communicate without direct dependencies,
 * enabling plugin-style architecture.
 */
export interface IEventBus {
  /**
   * Emit an event to all subscribers
   * @param event Event name
   * @param payload Event data
   */
  emit<T = unknown>(event: string, payload: T): void;
  
  /**
   * Subscribe to an event
   * @param event Event name
   * @param handler Event handler
   * @returns Unsubscribe function
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  
  /**
   * Subscribe to an event once (auto-unsubscribe after first call)
   * @param event Event name
   * @param handler Event handler
   */
  once<T = unknown>(event: string, handler: EventHandler<T>): void;
  
  /**
   * Remove a specific handler from an event
   * @param event Event name
   * @param handler Event handler to remove
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void;
  
  /**
   * Remove all handlers for an event (or all events if no event specified)
   * @param event Optional event name
   */
  removeAllListeners(event?: string): void;
  
  /**
   * Get count of listeners for an event
   * @param event Event name
   */
  listenerCount(event: string): number;
}

/**
 * Event handler function type
 */
export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

/**
 * Generator event types
 */
export interface GeneratorEvents {
  // Lifecycle events
  'generator:start': { config: unknown; timestamp: number };
  'generator:complete': { duration: number; result: unknown };
  'generator:error': { error: Error; stage?: string };
  
  // Stage events
  'stage:start': { stage: string; timestamp: number };
  'stage:complete': { stage: string; duration: number; result?: unknown };
  'stage:error': { stage: string; error: Error };
  'stage:skip': { stage: string; reason: string };
  
  // Service events
  'service:registered': { name: string; version: string };
  'service:initialized': { name: string; duration: number };
  'service:disposed': { name: string };
  
  // CSS events
  'css:extracted': { selectors: string[]; classes: string[]; source: string };
  'css:generated': { path: string; size: number };
  
  // HTML events
  'html:generated': { route: string; path: string; size: number };
  
  // View events
  'view:generated': { route: string; path: string };
  
  // Asset events
  'asset:copied': { source: string; destination: string };
}

/**
 * Typed event emitter interface
 * Note: This is a stricter interface that can be used for type-safe event emission
 */
export type ITypedEventBus = {
  emit<K extends keyof GeneratorEvents>(event: K, payload: GeneratorEvents[K]): void;
  on<K extends keyof GeneratorEvents>(event: K, handler: EventHandler<GeneratorEvents[K]>): () => void;
  once<K extends keyof GeneratorEvents>(event: K, handler: EventHandler<GeneratorEvents[K]>): void;
  off<K extends keyof GeneratorEvents>(event: K, handler: EventHandler<GeneratorEvents[K]>): void;
  removeAllListeners(event?: keyof GeneratorEvents): void;
  listenerCount(event: keyof GeneratorEvents): number;
};
