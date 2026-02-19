import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pipeline, PipelineContext } from './Pipeline';
import type { IPipelineStage, StageResult } from '../interfaces';

// Mock stage factory
function createMockStage(
  name: string,
  options: Partial<{
    order: number;
    enabled: boolean;
    dependencies: string[];
    canExecute: boolean | (() => boolean);
    executeResult: unknown;
    executeFn: (input: unknown, context: PipelineContext) => Promise<unknown>;
    onError: (error: Error, context: PipelineContext) => Promise<void>;
  }> = {}
): IPipelineStage {
  const {
    order = 10,
    enabled = true,
    dependencies = [],
    canExecute = true,
    executeResult = { success: true },
    executeFn,
    onError,
  } = options;
  
  return {
    name,
    order,
    enabled,
    dependencies,
    canExecute: typeof canExecute === 'function' 
      ? canExecute 
      : vi.fn().mockReturnValue(canExecute),
    execute: executeFn ?? vi.fn().mockResolvedValue(executeResult),
    onError,
  };
}

// Mock context factory
function createMockContext(): PipelineContext {
  const data = new Map<string, unknown>();
  const results = new Map<string, StageResult>();
  
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
    registry: {
      has: vi.fn().mockReturnValue(false),
      resolve: vi.fn(),
      register: vi.fn(),
      getServiceNames: vi.fn().mockReturnValue([]),
      getInitializationOrder: vi.fn().mockReturnValue([]),
      initializeAll: vi.fn().mockResolvedValue(undefined),
      disposeAll: vi.fn().mockResolvedValue(undefined),
    },
    data,
    results,
    setData: <T>(key: string, value: T) => data.set(key, value),
    getData: <T>(key: string) => data.get(key) as T | undefined,
  };
}

describe('Pipeline', () => {
  let pipeline: Pipeline;
  
  beforeEach(() => {
    pipeline = new Pipeline();
  });
  
  describe('addStage', () => {
    it('should add a stage to the pipeline', () => {
      const stage = createMockStage('test-stage');
      
      pipeline.addStage(stage);
      
      expect(pipeline.getStage('test-stage')).toBe(stage);
    });
    
    it('should replace stage with same name', () => {
      const stage1 = createMockStage('test-stage', { order: 10 });
      const stage2 = createMockStage('test-stage', { order: 20 });
      
      pipeline.addStage(stage1);
      pipeline.addStage(stage2);
      
      expect(pipeline.getStage('test-stage')).toBe(stage2);
      expect(pipeline.getStages()).toHaveLength(1);
    });
  });
  
  describe('removeStage', () => {
    it('should remove a stage from the pipeline', () => {
      const stage = createMockStage('test-stage');
      pipeline.addStage(stage);
      
      pipeline.removeStage('test-stage');
      
      expect(pipeline.getStage('test-stage')).toBeUndefined();
    });
    
    it('should not throw when removing non-existent stage', () => {
      expect(() => pipeline.removeStage('non-existent')).not.toThrow();
    });
  });
  
  describe('getStages', () => {
    it('should return stages sorted by order', () => {
      pipeline.addStage(createMockStage('stage-c', { order: 30 }));
      pipeline.addStage(createMockStage('stage-a', { order: 10 }));
      pipeline.addStage(createMockStage('stage-b', { order: 20 }));
      
      const stages = pipeline.getStages();
      
      expect(stages.map(s => s.name)).toEqual(['stage-a', 'stage-b', 'stage-c']);
    });
    
    it('should filter out disabled stages', () => {
      pipeline.addStage(createMockStage('enabled', { order: 10, enabled: true }));
      pipeline.addStage(createMockStage('disabled', { order: 20, enabled: false }));
      
      const stages = pipeline.getStages();
      
      expect(stages).toHaveLength(1);
      expect(stages[0].name).toBe('enabled');
    });
  });
  
  describe('execute', () => {
    it('should execute all stages in order', async () => {
      const executionOrder: string[] = [];
      
      pipeline.addStage(createMockStage('stage-b', {
        order: 20,
        executeFn: async () => { executionOrder.push('stage-b'); return {}; },
      }));
      pipeline.addStage(createMockStage('stage-a', {
        order: 10,
        executeFn: async () => { executionOrder.push('stage-a'); return {}; },
      }));
      
      await pipeline.execute(createMockContext());
      
      expect(executionOrder).toEqual(['stage-a', 'stage-b']);
    });
    
    it('should pass context to each stage', async () => {
      const stage = createMockStage('test-stage');
      pipeline.addStage(stage);
      
      const context = createMockContext();
      await pipeline.execute(context);
      
      expect(stage.execute).toHaveBeenCalledWith(
        undefined, // First stage has no input
        expect.objectContaining({
          config: context.config,
          logger: context.logger,
        })
      );
    });
    
    it('should return success result when all stages pass', async () => {
      pipeline.addStage(createMockStage('stage-a', { order: 10 }));
      pipeline.addStage(createMockStage('stage-b', { order: 20 }));
      
      const result = await pipeline.execute(createMockContext());
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stages).toHaveLength(2);
    });
    
    it('should skip stages that return false from canExecute', async () => {
      const executedStages: string[] = [];
      
      pipeline.addStage(createMockStage('stage-a', {
        order: 10,
        canExecute: false,
        executeFn: async () => { executedStages.push('stage-a'); return {}; },
      }));
      pipeline.addStage(createMockStage('stage-b', {
        order: 20,
        canExecute: true,
        executeFn: async () => { executedStages.push('stage-b'); return {}; },
      }));
      
      const result = await pipeline.execute(createMockContext());
      
      expect(executedStages).toEqual(['stage-b']);
      expect(result.stages[0].skipped).toBe(true);
      expect(result.stages[1].skipped).toBeFalsy();
    });
    
    it('should stop execution on stage failure by default', async () => {
      const executedStages: string[] = [];
      
      pipeline.addStage(createMockStage('stage-a', {
        order: 10,
        executeFn: async () => {
          executedStages.push('stage-a');
          throw new Error('Stage A failed');
        },
      }));
      pipeline.addStage(createMockStage('stage-b', {
        order: 20,
        executeFn: async () => { executedStages.push('stage-b'); return {}; },
      }));
      
      const result = await pipeline.execute(createMockContext());
      
      expect(result.success).toBe(false);
      expect(executedStages).toEqual(['stage-a']);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].stage).toBe('stage-a');
    });
    
    it('should continue on failure when continueOnError is true', async () => {
      const executedStages: string[] = [];
      
      pipeline = new Pipeline({ continueOnError: true });
      
      pipeline.addStage(createMockStage('stage-a', {
        order: 10,
        executeFn: async () => {
          executedStages.push('stage-a');
          throw new Error('Stage A failed');
        },
      }));
      pipeline.addStage(createMockStage('stage-b', {
        order: 20,
        executeFn: async () => { executedStages.push('stage-b'); return {}; },
      }));
      
      const result = await pipeline.execute(createMockContext());
      
      expect(result.success).toBe(false);
      expect(executedStages).toEqual(['stage-a', 'stage-b']);
      expect(result.errors).toHaveLength(1);
    });
    
    it('should call onError handler when stage fails', async () => {
      const onError = vi.fn();
      
      pipeline.addStage(createMockStage('failing-stage', {
        order: 10,
        executeFn: async () => { throw new Error('Test error'); },
        onError,
      }));
      
      await pipeline.execute(createMockContext());
      
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );
    });
    
    it('should emit stage:start and stage:complete events', async () => {
      const context = createMockContext();
      pipeline.addStage(createMockStage('test-stage', { order: 10 }));
      
      await pipeline.execute(context);
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'stage:start',
        expect.objectContaining({ stage: 'test-stage' })
      );
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'stage:complete',
        expect.objectContaining({ stage: 'test-stage' })
      );
    });
    
    it('should emit stage:error event on failure', async () => {
      const context = createMockContext();
      const testError = new Error('Test error');
      
      pipeline.addStage(createMockStage('failing-stage', {
        order: 10,
        executeFn: async () => { throw testError; },
      }));
      
      await pipeline.execute(context);
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'stage:error',
        expect.objectContaining({
          stage: 'failing-stage',
          error: testError,
        })
      );
    });
    
    it('should store stage results in context', async () => {
      const context = createMockContext();
      
      pipeline.addStage(createMockStage('stage-a', {
        order: 10,
        executeResult: { value: 42 },
      }));
      
      await pipeline.execute(context);
      
      const result = context.results.get('stage-a');
      expect(result).toBeDefined();
      expect(result?.success).toBe(true);
      expect(result?.output).toEqual({ value: 42 });
    });
    
    it('should allow data sharing between stages', async () => {
      const context = createMockContext();
      
      pipeline.addStage(createMockStage('producer', {
        order: 10,
        executeFn: async (_, ctx) => {
          ctx.setData('sharedValue', 42);
          return {};
        },
      }));
      
      let receivedValue: number | undefined;
      pipeline.addStage(createMockStage('consumer', {
        order: 20,
        executeFn: async (_, ctx) => {
          receivedValue = ctx.getData('sharedValue');
          return {};
        },
      }));
      
      await pipeline.execute(context);
      
      expect(receivedValue).toBe(42);
    });
  });
  
  describe('executeStage', () => {
    it('should execute a single stage by name', async () => {
      const stage = createMockStage('test-stage');
      pipeline.addStage(stage);
      
      const result = await pipeline.executeStage('test-stage', createMockContext());
      
      expect(result.success).toBe(true);
      expect(result.stage).toBe('test-stage');
    });
    
    it('should throw when stage not found', async () => {
      await expect(
        pipeline.executeStage('non-existent', createMockContext())
      ).rejects.toThrow(/not found/i);
    });
  });
});
