import type { IServiceContext } from './IService';

/**
 * Pipeline interface for orchestrating generation stages.
 * 
 * The pipeline manages the execution flow of generation stages,
 * handling dependencies, error recovery, and progress tracking.
 */
export interface IPipeline {
  /**
   * Add a stage to the pipeline
   * @param stage Pipeline stage
   */
  addStage(stage: IPipelineStage): void;
  
  /**
   * Remove a stage from the pipeline
   * @param name Stage name
   */
  removeStage(name: string): void;
  
  /**
   * Get a stage by name
   * @param name Stage name
   */
  getStage(name: string): IPipelineStage | undefined;
  
  /**
   * Get all stages in execution order
   */
  getStages(): IPipelineStage[];
  
  /**
   * Execute the pipeline
   * @param context Pipeline context
   */
  execute(context: IPipelineContext): Promise<PipelineResult>;
  
  /**
   * Execute a single stage
   * @param name Stage name
   * @param context Pipeline context
   */
  executeStage(name: string, context: IPipelineContext): Promise<StageResult>;
}

/**
 * Pipeline stage interface.
 * 
 * Each stage represents a discrete step in the generation process.
 */
export interface IPipelineStage<TIn = unknown, TOut = unknown> {
  /**
   * Unique stage identifier
   */
  readonly name: string;
  
  /**
   * Execution order (lower = earlier)
   */
  readonly order: number;
  
  /**
   * Whether the stage is enabled
   */
  readonly enabled: boolean;
  
  /**
   * Dependencies on other stages (names)
   */
  readonly dependencies?: readonly string[];
  
  /**
   * Human-readable description
   */
  readonly description?: string;
  
  /**
   * Check if the stage can execute
   * @param context Pipeline context
   */
  canExecute(context: IPipelineContext): boolean | Promise<boolean>;
  
  /**
   * Execute the stage
   * @param input Stage input
   * @param context Pipeline context
   */
  execute(input: TIn, context: IPipelineContext): Promise<TOut>;
  
  /**
   * Handle stage error (optional)
   * @param error Error that occurred
   * @param context Pipeline context
   */
  onError?(error: Error, context: IPipelineContext): Promise<void>;
}

/**
 * Pipeline context passed to stages
 */
export interface IPipelineContext extends IServiceContext {
  /**
   * Pipeline-level data storage
   */
  readonly data: Map<string, unknown>;
  
  /**
   * Results from previous stages
   */
  readonly results: Map<string, StageResult>;
  
  /**
   * Abort signal for cancellation
   */
  readonly signal?: AbortSignal;
  
  /**
   * Set data for later stages
   */
  setData<T>(key: string, value: T): void;
  
  /**
   * Get data from earlier stages
   */
  getData<T>(key: string): T | undefined;
}

/**
 * Result of a single stage execution
 */
export interface StageResult<T = unknown> {
  /**
   * Stage name
   */
  stage: string;
  
  /**
   * Whether the stage succeeded
   */
  success: boolean;
  
  /**
   * Stage output (if successful)
   */
  output?: T;
  
  /**
   * Error (if failed)
   */
  error?: Error;
  
  /**
   * Execution duration in milliseconds
   */
  duration: number;
  
  /**
   * Whether the stage was skipped
   */
  skipped?: boolean;
  
  /**
   * Skip reason (if skipped)
   */
  skipReason?: string;
}

/**
 * Result of complete pipeline execution
 */
export interface PipelineResult {
  /**
   * Whether the pipeline succeeded
   */
  success: boolean;
  
  /**
   * Results from all stages
   */
  stages: StageResult[];
  
  /**
   * Total execution duration in milliseconds
   */
  duration: number;
  
  /**
   * Errors that occurred during execution
   */
  errors: Array<{ stage: string; error: Error }>;
}

/**
 * Pipeline options
 */
export interface PipelineOptions {
  /**
   * Continue execution on stage failure
   * @default false
   */
  continueOnError?: boolean;
  
  /**
   * Maximum parallel stage execution
   * @default 1 (sequential)
   */
  maxParallel?: number;
  
  /**
   * Stage execution timeout in milliseconds
   * @default 300000 (5 minutes)
   */
  timeout?: number;
}
