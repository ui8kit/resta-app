import type {
  IPipeline,
  IPipelineStage,
  IPipelineContext,
  PipelineResult,
  StageResult,
  PipelineOptions,
} from '../interfaces/IPipeline';
import type { IServiceContext } from '../interfaces/IService';

/**
 * Create a pipeline context from a service context
 */
export function createPipelineContext(
  baseContext: IServiceContext,
  signal?: AbortSignal
): IPipelineContext {
  const data = new Map<string, unknown>();
  const results = new Map<string, StageResult>();
  
  return {
    config: baseContext.config,
    logger: baseContext.logger,
    eventBus: baseContext.eventBus,
    registry: baseContext.registry,
    data,
    results,
    signal,
    setData: <T>(key: string, value: T) => data.set(key, value),
    getData: <T>(key: string) => data.get(key) as T | undefined,
  };
}

/**
 * PipelineContext class for backward compatibility
 */
export class PipelineContext implements IPipelineContext {
  readonly data = new Map<string, unknown>();
  readonly results = new Map<string, StageResult>();
  readonly config: unknown;
  readonly logger: IServiceContext['logger'];
  readonly eventBus: IServiceContext['eventBus'];
  readonly registry: IServiceContext['registry'];
  
  constructor(
    baseContext: IServiceContext,
    readonly signal?: AbortSignal
  ) {
    this.config = baseContext.config;
    this.logger = baseContext.logger;
    this.eventBus = baseContext.eventBus;
    this.registry = baseContext.registry;
  }
  
  setData<T>(key: string, value: T): void {
    this.data.set(key, value);
  }
  
  getData<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }
}

/**
 * Pipeline implementation for orchestrating generation stages.
 * 
 * Features:
 * - Stage management (add, remove, get)
 * - Ordered execution based on stage.order
 * - Conditional execution via canExecute
 * - Error handling with optional continue-on-error
 * - Event emission for monitoring
 * - Data sharing between stages
 */
export class Pipeline implements IPipeline {
  private stages = new Map<string, IPipelineStage>();
  private readonly options: Required<PipelineOptions>;
  
  constructor(options: PipelineOptions = {}) {
    this.options = {
      continueOnError: options.continueOnError ?? false,
      maxParallel: options.maxParallel ?? 1,
      timeout: options.timeout ?? 300000, // 5 minutes
    };
  }
  
  /**
   * Add a stage to the pipeline
   */
  addStage(stage: IPipelineStage): void {
    this.stages.set(stage.name, stage);
  }
  
  /**
   * Remove a stage from the pipeline
   */
  removeStage(name: string): void {
    this.stages.delete(name);
  }
  
  /**
   * Get a stage by name
   */
  getStage(name: string): IPipelineStage | undefined {
    return this.stages.get(name);
  }
  
  /**
   * Get all enabled stages in execution order
   */
  getStages(): IPipelineStage[] {
    return Array.from(this.stages.values())
      .filter(stage => stage.enabled)
      .sort((a, b) => a.order - b.order);
  }
  
  /**
   * Execute the pipeline
   */
  async execute(context: IPipelineContext): Promise<PipelineResult> {
    const startTime = performance.now();
    const stages = this.getStages();
    const stageResults: StageResult[] = [];
    const errors: Array<{ stage: string; error: Error }> = [];
    
    let previousOutput: unknown = undefined;
    
    for (const stage of stages) {
      const result = await this.runStage(stage, previousOutput, context);
      stageResults.push(result);
      context.results.set(stage.name, result);
      
      if (!result.success && !result.skipped) {
        errors.push({ stage: stage.name, error: result.error! });
        
        if (!this.options.continueOnError) {
          break;
        }
      }
      
      if (result.success && result.output !== undefined) {
        previousOutput = result.output;
      }
    }
    
    const duration = performance.now() - startTime;
    
    return {
      success: errors.length === 0,
      stages: stageResults,
      duration,
      errors,
    };
  }
  
  /**
   * Execute a single stage
   */
  async executeStage(name: string, context: IPipelineContext): Promise<StageResult> {
    const stage = this.stages.get(name);
    if (!stage) {
      throw new Error(`Stage "${name}" not found`);
    }
    
    return this.runStage(stage, undefined, context);
  }
  
  /**
   * Run a single stage with error handling
   */
  private async runStage(
    stage: IPipelineStage,
    input: unknown,
    context: IPipelineContext
  ): Promise<StageResult> {
    const startTime = performance.now();
    
    // Check if stage can execute
    const canExecute = await Promise.resolve(stage.canExecute(context));
    if (!canExecute) {
      return {
        stage: stage.name,
        success: true,
        duration: performance.now() - startTime,
        skipped: true,
        skipReason: 'canExecute returned false',
      };
    }
    
    // Emit start event
    context.eventBus.emit('stage:start', {
      stage: stage.name,
      timestamp: Date.now(),
    });
    
    try {
      const output = await stage.execute(input, context);
      const duration = performance.now() - startTime;
      
      // Emit complete event
      context.eventBus.emit('stage:complete', {
        stage: stage.name,
        duration,
        result: output,
      });
      
      return {
        stage: stage.name,
        success: true,
        output,
        duration,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Emit error event
      context.eventBus.emit('stage:error', {
        stage: stage.name,
        error: err,
      });
      
      // Call error handler if available
      if (stage.onError) {
        try {
          await stage.onError(err, context);
        } catch (handlerError) {
          console.error(`[Pipeline] Error in onError handler for "${stage.name}":`, handlerError);
        }
      }
      
      return {
        stage: stage.name,
        success: false,
        error: err,
        duration,
      };
    }
  }
}
