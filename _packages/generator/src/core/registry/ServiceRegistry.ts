import type { IService, IServiceContext, IServiceRegistry } from '../interfaces/IService';

/**
 * Error thrown when a circular dependency is detected
 */
export class CircularDependencyError extends Error {
  constructor(public readonly cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' -> ')}`);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Error thrown when a service is not found
 */
export class ServiceNotFoundError extends Error {
  constructor(public readonly serviceName: string) {
    super(`Service not found: ${serviceName}`);
    this.name = 'ServiceNotFoundError';
  }
}

/**
 * ServiceRegistry implementation for dependency injection.
 * 
 * Features:
 * - Service registration and resolution
 * - Dependency graph management
 * - Topological sorting for initialization order
 * - Circular dependency detection
 * - Lifecycle management (init/dispose)
 */
export class ServiceRegistry implements IServiceRegistry {
  private services = new Map<string, IService>();
  private initializationOrder: string[] | null = null;
  private initialized = false;
  
  /**
   * Register a service
   */
  register<T extends IService>(service: T): void {
    if (this.services.has(service.name)) {
      throw new Error(`Service "${service.name}" is already registered`);
    }
    
    this.services.set(service.name, service);
    
    // Invalidate cached initialization order
    this.initializationOrder = null;
  }
  
  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }
  
  /**
   * Get a service by name
   */
  resolve<T extends IService = IService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new ServiceNotFoundError(name);
    }
    return service as T;
  }
  
  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
  
  /**
   * Get services in initialization order (topological sort)
   */
  getInitializationOrder(): string[] {
    // Return cached order if available
    if (this.initializationOrder) {
      return this.initializationOrder;
    }
    
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (name: string, path: string[] = []): void => {
      if (visited.has(name)) {
        return;
      }
      
      if (visiting.has(name)) {
        // Circular dependency detected
        const cycleStart = path.indexOf(name);
        const cycle = [...path.slice(cycleStart), name];
        throw new CircularDependencyError(cycle);
      }
      
      const service = this.services.get(name);
      if (!service) {
        console.warn(`[ServiceRegistry] Service "${name}" has missing dependency, skipping`);
        return;
      }
      
      visiting.add(name);
      
      // Visit dependencies first
      for (const dep of service.dependencies) {
        if (!this.services.has(dep)) {
          console.warn(`[ServiceRegistry] Service "${name}" depends on "${dep}" which is a missing dependency`);
          continue;
        }
        visit(dep, [...path, name]);
      }
      
      visiting.delete(name);
      visited.add(name);
      result.push(name);
    };
    
    // Visit all services
    for (const name of this.services.keys()) {
      visit(name, []);
    }
    
    // Cache the result
    this.initializationOrder = result;
    
    return result;
  }
  
  /**
   * Initialize all registered services
   */
  async initializeAll(baseContext: Omit<IServiceContext, 'registry'>): Promise<void> {
    const order = this.getInitializationOrder();
    
    // Create full context with registry
    const context: IServiceContext = {
      ...baseContext,
      registry: this,
    };
    
    for (const name of order) {
      const service = this.services.get(name)!;
      const startTime = performance.now();
      
      await service.initialize(context);
      
      const duration = performance.now() - startTime;
      
      // Emit event
      context.eventBus.emit('service:initialized', {
        name,
        duration,
      });
    }
    
    this.initialized = true;
  }
  
  /**
   * Dispose all registered services
   */
  async disposeAll(): Promise<void> {
    if (!this.initializationOrder) {
      return;
    }
    
    // Dispose in reverse initialization order
    const reverseOrder = [...this.initializationOrder].reverse();
    
    for (const name of reverseOrder) {
      const service = this.services.get(name);
      if (!service) continue;
      
      try {
        await service.dispose();
      } catch (error) {
        console.error(`[ServiceRegistry] Error disposing service "${name}":`, error);
        // Continue disposing other services
      }
    }
    
    this.initialized = false;
  }
}
