import type { IService } from './IService';
import type { IPipelineStage } from './IPipeline';
import type { GeneratorConfig } from './IConfig';
import type { GeneratorResult } from './IOrchestrator';

/**
 * Plugin interface for extending the generator.
 * 
 * Plugins can:
 * - Register additional services
 * - Add pipeline stages
 * - Hook into lifecycle events
 * - Modify configuration
 */
export interface IPlugin {
  /**
   * Unique plugin identifier
   */
  readonly name: string;
  
  /**
   * Plugin version (semantic versioning)
   */
  readonly version: string;
  
  /**
   * Human-readable description
   */
  readonly description?: string;
  
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------
  
  /**
   * Called before orchestrator initialization
   */
  onBeforeInit?(orchestrator: IPluginContext): Promise<void>;
  
  /**
   * Called after orchestrator initialization
   */
  onAfterInit?(orchestrator: IPluginContext): Promise<void>;
  
  /**
   * Called before generation starts.
   * Can modify the configuration.
   */
  onBeforeGenerate?(config: GeneratorConfig): Promise<GeneratorConfig>;
  
  /**
   * Called after generation completes
   */
  onAfterGenerate?(result: GeneratorResult): Promise<void>;
  
  // ---------------------------------------------------------------------------
  // Registration Methods
  // ---------------------------------------------------------------------------
  
  /**
   * Return services to register
   */
  getServices?(): IService[];
  
  /**
   * Return pipeline stages to add
   */
  getStages?(): IPipelineStage[];
}

/**
 * Context provided to plugins during lifecycle hooks
 */
export interface IPluginContext {
  /**
   * Register a service
   */
  registerService(service: IService): void;
  
  /**
   * Check if a service exists
   */
  hasService(name: string): boolean;
  
  /**
   * Get a service by name
   */
  getService<T extends IService>(name: string): T;
  
  /**
   * Add a pipeline stage
   */
  addStage(stage: IPipelineStage): void;
  
  /**
   * Check if a stage exists
   */
  hasStage(name: string): boolean;
}

/**
 * Plugin metadata for registration
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
}
