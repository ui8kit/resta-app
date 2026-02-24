import type { IPlugin, IPluginContext } from './IPlugin';
import type { IService } from './IService';
import type { IPipelineStage, PipelineResult } from './IPipeline';
import type { IEventBus, EventHandler } from './IEventBus';
import type { GeneratorConfig } from './IConfig';

/**
 * Orchestrator interface - the main entry point for the generator.
 * 
 * The orchestrator coordinates:
 * - Service registration and lifecycle
 * - Plugin management
 * - Pipeline execution
 * - Event handling
 */
export interface IOrchestrator extends IPluginContext {
  /**
   * Register a plugin
   * @returns this for fluent API
   */
  use(plugin: IPlugin): this;
  
  /**
   * Run the generation process
   * @param config Generator configuration
   */
  generate(config: GeneratorConfig): Promise<GeneratorResult>;
  
  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  
  /**
   * Get the event bus for advanced event handling
   */
  getEventBus(): IEventBus;
}

/**
 * Result of a generation run
 */
export interface GeneratorResult extends PipelineResult {
  /**
   * Configuration used for generation
   */
  config: GeneratorConfig;
  
  /**
   * Generated files
   */
  files?: GeneratedFile[];
  
  /**
   * Warnings during generation
   */
  warnings?: string[];
}

/**
 * Information about a generated file
 */
export interface GeneratedFile {
  /**
   * File path (relative to output directory)
   */
  path: string;
  
  /**
   * File type
   */
  type: 'html' | 'css' | 'js' | 'json' | 'liquid' | 'other';
  
  /**
   * File size in bytes
   */
  size: number;
}

/**
 * Orchestrator options
 */
export interface OrchestratorOptions {
  /**
   * Custom logger
   */
  logger?: import('./ILogger').ILogger;
  
  /**
   * Log level
   */
  logLevel?: import('./ILogger').LogLevel;
  
  /**
   * Continue on stage failure
   */
  continueOnError?: boolean;
}
