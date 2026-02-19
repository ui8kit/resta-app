import type { IEventBus } from './IEventBus';
import type { ILogger } from './ILogger';

/**
 * Service interface for generator services.
 * 
 * All services in the generator must implement this interface.
 * This enables:
 * - Dependency injection
 * - Lifecycle management
 * - Plugin architecture
 */
export interface IService<TInput = unknown, TOutput = unknown> {
  /**
   * Unique service identifier
   */
  readonly name: string;
  
  /**
   * Service version (semantic versioning)
   */
  readonly version: string;
  
  /**
   * List of service names this service depends on.
   * Used for initialization order calculation.
   */
  readonly dependencies: readonly string[];
  
  /**
   * Initialize the service with context.
   * Called once before any execute() calls.
   * 
   * @param context Service context with shared resources
   */
  initialize(context: IServiceContext): Promise<void>;
  
  /**
   * Execute the service's main functionality.
   * 
   * @param input Service-specific input
   * @returns Service-specific output
   */
  execute(input: TInput): Promise<TOutput>;
  
  /**
   * Dispose the service and release resources.
   * Called during shutdown.
   */
  dispose(): Promise<void>;
}

/**
 * Service context provided during initialization.
 * Contains shared resources available to all services.
 */
export interface IServiceContext {
  /**
   * Generator configuration
   */
  readonly config: unknown;
  
  /**
   * Logger instance
   */
  readonly logger: ILogger;
  
  /**
   * Event bus for inter-service communication
   */
  readonly eventBus: IEventBus;
  
  /**
   * Service registry for accessing other services
   */
  readonly registry: IServiceRegistry;
}

/**
 * Service registry interface for dependency injection.
 */
export interface IServiceRegistry {
  /**
   * Register a service
   * @param service Service instance
   */
  register<T extends IService>(service: T): void;
  
  /**
   * Check if a service is registered
   * @param name Service name
   */
  has(name: string): boolean;
  
  /**
   * Get a service by name
   * @param name Service name
   * @throws Error if service not found
   */
  resolve<T extends IService = IService>(name: string): T;
  
  /**
   * Get all registered service names
   */
  getServiceNames(): string[];
  
  /**
   * Get services in initialization order (topological sort)
   */
  getInitializationOrder(): string[];
  
  /**
   * Initialize all registered services
   * @param context Service context
   */
  initializeAll(context: Omit<IServiceContext, 'registry'>): Promise<void>;
  
  /**
   * Dispose all registered services
   */
  disposeAll(): Promise<void>;
}

/**
 * Service metadata for registration
 */
export interface ServiceMetadata {
  name: string;
  version: string;
  dependencies: readonly string[];
  description?: string;
}

/**
 * Base class for services (optional, for convenience)
 */
export abstract class BaseService<TInput = unknown, TOutput = unknown> implements IService<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly version: string;
  readonly dependencies: readonly string[] = [];
  
  protected context!: IServiceContext;
  protected logger!: ILogger;
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
    this.logger = context.logger.child(this.name);
    await this.onInitialize();
  }
  
  /**
   * Override this method for custom initialization logic
   */
  protected async onInitialize(): Promise<void> {
    // Default: no-op
  }
  
  abstract execute(input: TInput): Promise<TOutput>;
  
  async dispose(): Promise<void> {
    await this.onDispose();
  }
  
  /**
   * Override this method for custom cleanup logic
   */
  protected async onDispose(): Promise<void> {
    // Default: no-op
  }
}
