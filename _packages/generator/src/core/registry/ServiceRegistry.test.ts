import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServiceRegistry, CircularDependencyError, ServiceNotFoundError } from './ServiceRegistry';
import type { IService, IServiceContext } from '../interfaces';

// Mock service factory
function createMockService(
  name: string,
  dependencies: string[] = [],
  version = '1.0.0'
): IService {
  return {
    name,
    version,
    dependencies,
    initialize: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn().mockResolvedValue(undefined),
  };
}

// Mock context factory
function createMockContext(): Omit<IServiceContext, 'registry'> {
  return {
    config: {},
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    },
    eventBus: {
      emit: vi.fn(),
      on: vi.fn().mockReturnValue(() => {}),
      once: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn().mockReturnValue(0),
    },
  };
}

describe('ServiceRegistry', () => {
  let registry: ServiceRegistry;
  
  beforeEach(() => {
    registry = new ServiceRegistry();
  });
  
  describe('register', () => {
    it('should register a service', () => {
      const service = createMockService('test-service');
      
      registry.register(service);
      
      expect(registry.has('test-service')).toBe(true);
    });
    
    it('should throw when registering duplicate service name', () => {
      const service1 = createMockService('test-service');
      const service2 = createMockService('test-service');
      
      registry.register(service1);
      
      expect(() => registry.register(service2)).toThrow(/already registered/i);
    });
  });
  
  describe('has', () => {
    it('should return true for registered service', () => {
      registry.register(createMockService('test-service'));
      
      expect(registry.has('test-service')).toBe(true);
    });
    
    it('should return false for unregistered service', () => {
      expect(registry.has('non-existent')).toBe(false);
    });
  });
  
  describe('resolve', () => {
    it('should return registered service', () => {
      const service = createMockService('test-service');
      registry.register(service);
      
      const resolved = registry.resolve('test-service');
      
      expect(resolved).toBe(service);
    });
    
    it('should throw ServiceNotFoundError for unregistered service', () => {
      expect(() => registry.resolve('non-existent')).toThrow(ServiceNotFoundError);
    });
  });
  
  describe('getServiceNames', () => {
    it('should return all registered service names', () => {
      registry.register(createMockService('service-a'));
      registry.register(createMockService('service-b'));
      registry.register(createMockService('service-c'));
      
      const names = registry.getServiceNames();
      
      expect(names).toHaveLength(3);
      expect(names).toContain('service-a');
      expect(names).toContain('service-b');
      expect(names).toContain('service-c');
    });
    
    it('should return empty array when no services registered', () => {
      expect(registry.getServiceNames()).toHaveLength(0);
    });
  });
  
  describe('getInitializationOrder', () => {
    it('should return services in dependency order', () => {
      // C depends on B, B depends on A
      registry.register(createMockService('service-c', ['service-b']));
      registry.register(createMockService('service-a', []));
      registry.register(createMockService('service-b', ['service-a']));
      
      const order = registry.getInitializationOrder();
      
      expect(order).toEqual(['service-a', 'service-b', 'service-c']);
    });
    
    it('should handle services with no dependencies', () => {
      registry.register(createMockService('service-a'));
      registry.register(createMockService('service-b'));
      
      const order = registry.getInitializationOrder();
      
      expect(order).toHaveLength(2);
      expect(order).toContain('service-a');
      expect(order).toContain('service-b');
    });
    
    it('should throw CircularDependencyError for circular dependencies', () => {
      // A depends on B, B depends on A (circular)
      registry.register(createMockService('service-a', ['service-b']));
      registry.register(createMockService('service-b', ['service-a']));
      
      expect(() => registry.getInitializationOrder()).toThrow(CircularDependencyError);
    });
    
    it('should throw CircularDependencyError for transitive circular dependencies', () => {
      // A -> B -> C -> A (circular)
      registry.register(createMockService('service-a', ['service-c']));
      registry.register(createMockService('service-b', ['service-a']));
      registry.register(createMockService('service-c', ['service-b']));
      
      expect(() => registry.getInitializationOrder()).toThrow(CircularDependencyError);
    });
    
    it('should handle complex dependency graphs', () => {
      // D depends on B and C
      // B and C depend on A
      registry.register(createMockService('service-d', ['service-b', 'service-c']));
      registry.register(createMockService('service-b', ['service-a']));
      registry.register(createMockService('service-c', ['service-a']));
      registry.register(createMockService('service-a', []));
      
      const order = registry.getInitializationOrder();
      
      // A must come first
      expect(order[0]).toBe('service-a');
      // D must come last
      expect(order[3]).toBe('service-d');
      // B and C can be in any order between A and D
      expect(order.slice(1, 3).sort()).toEqual(['service-b', 'service-c']);
    });
    
    it('should warn about missing dependencies but continue', () => {
      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // B depends on non-existent service
      registry.register(createMockService('service-a'));
      registry.register(createMockService('service-b', ['non-existent']));
      
      const order = registry.getInitializationOrder();
      
      expect(order).toContain('service-a');
      expect(order).toContain('service-b');
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('missing dependency')
      );
      
      consoleWarn.mockRestore();
    });
  });
  
  describe('initializeAll', () => {
    it('should initialize all services in dependency order', async () => {
      const initOrder: string[] = [];
      
      const serviceA = createMockService('service-a');
      const serviceB = createMockService('service-b', ['service-a']);
      
      (serviceA.initialize as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        initOrder.push('service-a');
      });
      (serviceB.initialize as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        initOrder.push('service-b');
      });
      
      registry.register(serviceB);
      registry.register(serviceA);
      
      await registry.initializeAll(createMockContext());
      
      expect(initOrder).toEqual(['service-a', 'service-b']);
    });
    
    it('should pass context with registry to each service', async () => {
      const service = createMockService('test-service');
      registry.register(service);
      
      const baseContext = createMockContext();
      await registry.initializeAll(baseContext);
      
      expect(service.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          config: baseContext.config,
          logger: baseContext.logger,
          eventBus: baseContext.eventBus,
          registry: registry,
        })
      );
    });
    
    it('should emit service:initialized event after each service', async () => {
      const service = createMockService('test-service');
      registry.register(service);
      
      const context = createMockContext();
      await registry.initializeAll(context);
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'service:initialized',
        expect.objectContaining({
          name: 'test-service',
        })
      );
    });
    
    it('should throw if a service initialization fails', async () => {
      const service = createMockService('failing-service');
      (service.initialize as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Init failed')
      );
      
      registry.register(service);
      
      await expect(registry.initializeAll(createMockContext())).rejects.toThrow('Init failed');
    });
  });
  
  describe('disposeAll', () => {
    it('should dispose all services in reverse initialization order', async () => {
      const disposeOrder: string[] = [];
      
      const serviceA = createMockService('service-a');
      const serviceB = createMockService('service-b', ['service-a']);
      
      (serviceA.dispose as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        disposeOrder.push('service-a');
      });
      (serviceB.dispose as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        disposeOrder.push('service-b');
      });
      
      registry.register(serviceA);
      registry.register(serviceB);
      
      // First initialize
      await registry.initializeAll(createMockContext());
      
      // Then dispose
      await registry.disposeAll();
      
      // Should dispose in reverse order: B before A
      expect(disposeOrder).toEqual(['service-b', 'service-a']);
    });
    
    it('should continue disposing other services if one fails', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const serviceA = createMockService('service-a');
      const serviceB = createMockService('service-b');
      
      (serviceA.dispose as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Dispose failed')
      );
      
      registry.register(serviceA);
      registry.register(serviceB);
      
      await registry.initializeAll(createMockContext());
      await registry.disposeAll();
      
      // Both should have been called despite error
      expect(serviceA.dispose).toHaveBeenCalled();
      expect(serviceB.dispose).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });
});
