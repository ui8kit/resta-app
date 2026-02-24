import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManager, createPlugin } from './PluginManager';
import type { IPluginContext, IPipelineStage, IService } from '../core/interfaces';

// Create mock plugin context
function createMockPluginContext(): IPluginContext {
  return {
    registerService: vi.fn(),
    hasService: vi.fn(),
    getService: vi.fn(),
    addStage: vi.fn(),
    hasStage: vi.fn(),
  } as unknown as IPluginContext;
}

describe('PluginManager', () => {
  let manager: PluginManager;
  let mockContext: IPluginContext;
  
  beforeEach(() => {
    manager = new PluginManager();
    mockContext = createMockPluginContext();
  });
  
  describe('register', () => {
    it('should register a plugin', () => {
      const plugin = createPlugin({ name: 'test-plugin' });
      
      manager.register(plugin);
      
      expect(manager.has('test-plugin')).toBe(true);
    });
    
    it('should throw if plugin with same name already exists', () => {
      const plugin = createPlugin({ name: 'test-plugin' });
      
      manager.register(plugin);
      
      expect(() => manager.register(plugin)).toThrow('already registered');
    });
  });
  
  describe('unregister', () => {
    it('should unregister a plugin', () => {
      const plugin = createPlugin({ name: 'test-plugin' });
      
      manager.register(plugin);
      expect(manager.has('test-plugin')).toBe(true);
      
      const result = manager.unregister('test-plugin');
      
      expect(result).toBe(true);
      expect(manager.has('test-plugin')).toBe(false);
    });
    
    it('should return false if plugin not found', () => {
      const result = manager.unregister('nonexistent');
      
      expect(result).toBe(false);
    });
  });
  
  describe('getAll', () => {
    it('should return all registered plugins', () => {
      manager.register(createPlugin({ name: 'plugin-a' }));
      manager.register(createPlugin({ name: 'plugin-b' }));
      
      const plugins = manager.getAll();
      
      expect(plugins).toHaveLength(2);
      expect(plugins.map(p => p.name)).toContain('plugin-a');
      expect(plugins.map(p => p.name)).toContain('plugin-b');
    });
  });
  
  describe('initialize', () => {
    it('should call setup on all plugins', async () => {
      const setupFn = vi.fn();
      const plugin = {
        ...createPlugin({ name: 'test-plugin' }),
        setup: setupFn,
      };
      
      manager.register(plugin);
      await manager.initialize(mockContext);
      
      expect(setupFn).toHaveBeenCalledWith(mockContext);
    });
  });
  
  describe('beforeGenerate', () => {
    it('should call beforeGenerate hooks on all plugins', async () => {
      const beforeFn = vi.fn();
      const plugin = createPlugin({
        name: 'test-plugin',
        hooks: { beforeGenerate: beforeFn },
      });
      
      manager.register(plugin);
      await manager.initialize(mockContext);
      await manager.beforeGenerate();
      
      expect(beforeFn).toHaveBeenCalledWith(mockContext);
    });
    
    it('should throw if not initialized', async () => {
      await expect(manager.beforeGenerate()).rejects.toThrow('not initialized');
    });
  });
  
  describe('afterGenerate', () => {
    it('should call afterGenerate hooks on all plugins', async () => {
      const afterFn = vi.fn();
      const plugin = createPlugin({
        name: 'test-plugin',
        hooks: { afterGenerate: afterFn },
      });
      
      manager.register(plugin);
      await manager.initialize(mockContext);
      await manager.afterGenerate();
      
      expect(afterFn).toHaveBeenCalledWith(mockContext);
    });
  });
  
  describe('onError', () => {
    it('should call onError hooks on all plugins', async () => {
      const errorFn = vi.fn();
      const plugin = createPlugin({
        name: 'test-plugin',
        hooks: { onError: errorFn },
      });
      
      manager.register(plugin);
      await manager.initialize(mockContext);
      
      const error = new Error('Test error');
      await manager.onError(error);
      
      expect(errorFn).toHaveBeenCalledWith(error, mockContext);
    });
    
    it('should not throw if onError hook fails', async () => {
      const plugin = createPlugin({
        name: 'test-plugin',
        hooks: {
          onError: () => {
            throw new Error('Hook error');
          },
        },
      });
      
      manager.register(plugin);
      await manager.initialize(mockContext);
      
      await expect(manager.onError(new Error('Test'))).resolves.not.toThrow();
    });
  });
  
  describe('dispose', () => {
    it('should call teardown on all plugins', async () => {
      const teardownFn = vi.fn();
      const plugin = {
        ...createPlugin({ name: 'test-plugin' }),
        teardown: teardownFn,
      };
      
      manager.register(plugin);
      await manager.initialize(mockContext);
      await manager.dispose();
      
      expect(teardownFn).toHaveBeenCalled();
    });
    
    it('should clear all plugins', async () => {
      manager.register(createPlugin({ name: 'test-plugin' }));
      
      await manager.dispose();
      
      expect(manager.getAll()).toHaveLength(0);
    });
  });
});

describe('createPlugin', () => {
  it('should create a plugin with default values', () => {
    const plugin = createPlugin({ name: 'test' });
    
    expect(plugin.name).toBe('test');
    expect(plugin.version).toBe('1.0.0');
  });
  
  it.skip('should register stages on setup', async () => {
    const mockStage: IPipelineStage = {
      name: 'test-stage',
      order: 0,
      enabled: true,
      dependencies: [],
      canExecute: () => true,
      execute: vi.fn(),
    };
    
    const plugin = createPlugin({
      name: 'test',
      stages: [mockStage],
    });
    
    const context = createMockPluginContext();
    if (plugin.setup) {
      await plugin.setup(context);
    }
    
    expect(context.addStage).toHaveBeenCalledWith(mockStage);
  });
  
  it.skip('should register services on setup', async () => {
    const mockService: IService = {
      name: 'test-service',
      version: '1.0.0',
      dependencies: [],
      initialize: vi.fn(),
      execute: vi.fn(),
      dispose: vi.fn(),
    };
    
    const plugin = createPlugin({
      name: 'test',
      services: [mockService],
    });
    
    const context = createMockPluginContext();
    if (plugin.setup) {
      await plugin.setup(context);
    }
    
    expect(context.registerService).toHaveBeenCalledWith(mockService);
  });
});
