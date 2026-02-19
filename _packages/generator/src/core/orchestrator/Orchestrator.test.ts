import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from './Orchestrator';
import type { IService, IPlugin, GeneratorConfig } from '../interfaces';

// Mock service factory
function createMockService(name: string, deps: string[] = []): IService {
  return {
    name,
    version: '1.0.0',
    dependencies: deps,
    initialize: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue({ success: true }),
    dispose: vi.fn().mockResolvedValue(undefined),
  };
}

// Mock plugin factory
function createMockPlugin(
  name: string,
  options: Partial<{
    services: IService[];
    stages: any[];
    onBeforeInit: () => Promise<void>;
    onAfterInit: () => Promise<void>;
    onBeforeGenerate: (config: GeneratorConfig) => Promise<GeneratorConfig>;
    onAfterGenerate: () => Promise<void>;
  }> = {}
): IPlugin {
  return {
    name,
    version: '1.0.0',
    getServices: options.services ? () => options.services! : undefined,
    getStages: options.stages ? () => options.stages! : undefined,
    onBeforeInit: options.onBeforeInit,
    onAfterInit: options.onAfterInit,
    onBeforeGenerate: options.onBeforeGenerate,
    onAfterGenerate: options.onAfterGenerate,
  };
}

// Minimal config for testing
const minimalConfig: GeneratorConfig = {
  app: { name: 'Test App', lang: 'en' },
  css: {
    entryPath: './src/main.tsx',
    routes: ['/'],
    outputDir: './dist/css',
  },
  html: {
    viewsDir: './views',
    routes: { '/': { title: 'Home' } },
    outputDir: './dist/html',
  },
};

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;
  
  beforeEach(() => {
    orchestrator = new Orchestrator();
  });
  
  describe('constructor', () => {
    it('should create orchestrator with default options', () => {
      expect(orchestrator).toBeDefined();
    });
    
    it('should accept custom logger', () => {
      const customLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis(),
      };
      
      const orch = new Orchestrator({ logger: customLogger });
      expect(orch).toBeDefined();
    });
  });
  
  describe('use (plugins)', () => {
    it('should register a plugin', () => {
      const plugin = createMockPlugin('test-plugin');
      
      const result = orchestrator.use(plugin);
      
      expect(result).toBe(orchestrator); // Fluent API
    });
    
    it('should register multiple plugins', () => {
      const plugin1 = createMockPlugin('plugin-1');
      const plugin2 = createMockPlugin('plugin-2');
      
      orchestrator.use(plugin1).use(plugin2);
      
      // Should not throw
      expect(true).toBe(true);
    });
    
    it('should register services from plugins', () => {
      const service = createMockService('plugin-service');
      const plugin = createMockPlugin('test-plugin', {
        services: [service],
      });
      
      orchestrator.use(plugin);
      
      expect(orchestrator.hasService('plugin-service')).toBe(true);
    });
  });
  
  describe('registerService', () => {
    it('should register a service', () => {
      const service = createMockService('my-service');
      
      orchestrator.registerService(service);
      
      expect(orchestrator.hasService('my-service')).toBe(true);
    });
    
    it('should retrieve registered service', () => {
      const service = createMockService('my-service');
      orchestrator.registerService(service);
      
      const resolved = orchestrator.getService('my-service');
      
      expect(resolved).toBe(service);
    });
  });
  
  describe('addStage', () => {
    it('should add a pipeline stage', () => {
      const stage = {
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockResolvedValue({}),
      };
      
      orchestrator.addStage(stage);
      
      expect(orchestrator.hasStage('test-stage')).toBe(true);
    });
  });
  
  describe('generate', () => {
    it('should initialize all services before generation', async () => {
      const service = createMockService('test-service');
      orchestrator.registerService(service);
      
      // Add a simple stage so pipeline runs
      orchestrator.addStage({
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockResolvedValue({}),
      });
      
      await orchestrator.generate(minimalConfig);
      
      expect(service.initialize).toHaveBeenCalled();
    });
    
    it('should call plugin onBeforeGenerate hook', async () => {
      const onBeforeGenerate = vi.fn().mockImplementation(async (config) => config);
      const plugin = createMockPlugin('test-plugin', { onBeforeGenerate });
      
      orchestrator.use(plugin);
      orchestrator.addStage({
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockResolvedValue({}),
      });
      
      await orchestrator.generate(minimalConfig);
      
      expect(onBeforeGenerate).toHaveBeenCalledWith(expect.objectContaining({
        app: expect.any(Object),
      }));
    });
    
    it('should call plugin onAfterGenerate hook', async () => {
      const onAfterGenerate = vi.fn();
      const plugin = createMockPlugin('test-plugin', { onAfterGenerate });
      
      orchestrator.use(plugin);
      orchestrator.addStage({
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockResolvedValue({}),
      });
      
      await orchestrator.generate(minimalConfig);
      
      expect(onAfterGenerate).toHaveBeenCalled();
    });
    
    it('should execute pipeline stages', async () => {
      const stageExecute = vi.fn().mockResolvedValue({ data: 'test' });
      
      orchestrator.addStage({
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: stageExecute,
      });
      
      await orchestrator.generate(minimalConfig);
      
      expect(stageExecute).toHaveBeenCalled();
    });
    
    it('should return generation result', async () => {
      orchestrator.addStage({
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockResolvedValue({}),
      });
      
      const result = await orchestrator.generate(minimalConfig);
      
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        duration: expect.any(Number),
      });
    });
    
    it('should dispose services after generation', async () => {
      const service = createMockService('test-service');
      orchestrator.registerService(service);
      
      orchestrator.addStage({
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockResolvedValue({}),
      });
      
      await orchestrator.generate(minimalConfig);
      
      expect(service.dispose).toHaveBeenCalled();
    });
    
    it('should emit generator:start event', async () => {
      const eventHandler = vi.fn();
      orchestrator.on('generator:start', eventHandler);
      
      orchestrator.addStage({
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockResolvedValue({}),
      });
      
      await orchestrator.generate(minimalConfig);
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
        })
      );
    });
    
    it('should emit generator:complete event on success', async () => {
      const eventHandler = vi.fn();
      orchestrator.on('generator:complete', eventHandler);
      
      orchestrator.addStage({
        name: 'test-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockResolvedValue({}),
      });
      
      await orchestrator.generate(minimalConfig);
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });
    
    it('should handle generation errors gracefully', async () => {
      orchestrator.addStage({
        name: 'failing-stage',
        order: 10,
        enabled: true,
        canExecute: () => true,
        execute: vi.fn().mockRejectedValue(new Error('Stage failed')),
      });
      
      const result = await orchestrator.generate(minimalConfig);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
  
  describe('event handling', () => {
    it('should allow subscribing to events', () => {
      const handler = vi.fn();
      
      const unsubscribe = orchestrator.on('generator:start', handler);
      
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('should allow unsubscribing from events', () => {
      const handler = vi.fn();
      
      const unsubscribe = orchestrator.on('generator:start', handler);
      unsubscribe();
      
      // No error should occur
      expect(true).toBe(true);
    });
  });
});
