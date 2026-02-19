import type {
  IOrchestrator,
  OrchestratorOptions,
  GeneratorResult,
  IPlugin,
  IService,
  IPipelineStage,
  IPipelineContext,
  IEventBus,
  EventHandler,
  ILogger,
  GeneratorConfig,
} from '../interfaces';

import { EventBus } from '../events';
import { ServiceRegistry } from '../registry';
import { Pipeline, createPipelineContext } from '../pipeline';
import { Logger } from '../logger';

/**
 * Orchestrator - The main coordinator for the generator.
 * 
 * Responsibilities:
 * - Plugin management
 * - Service registration and lifecycle
 * - Pipeline configuration and execution
 * - Event coordination
 * 
 * @example
 * ```typescript
 * const orchestrator = new Orchestrator()
 *   .use(cssPlugin)
 *   .use(htmlPlugin);
 * 
 * const result = await orchestrator.generate(config);
 * ```
 */
export class Orchestrator implements IOrchestrator {
  private readonly logger: ILogger;
  private readonly eventBus: EventBus;
  private readonly registry: ServiceRegistry;
  private readonly pipeline: Pipeline;
  private readonly plugins: IPlugin[] = [];
  private readonly options: Required<OrchestratorOptions>;
  
  constructor(options: OrchestratorOptions = {}) {
    this.options = {
      logger: options.logger ?? new Logger({ level: options.logLevel ?? 'info' }),
      logLevel: options.logLevel ?? 'info',
      continueOnError: options.continueOnError ?? false,
    };
    
    this.logger = this.options.logger;
    this.eventBus = new EventBus();
    this.registry = new ServiceRegistry();
    this.pipeline = new Pipeline({ continueOnError: this.options.continueOnError });
  }
  
  // ===========================================================================
  // Plugin Management
  // ===========================================================================
  
  /**
   * Register a plugin
   */
  use(plugin: IPlugin): this {
    this.logger.debug(`Registering plugin: ${plugin.name}@${plugin.version}`);
    
    this.plugins.push(plugin);
    
    // Register plugin services
    const services = plugin.getServices?.() ?? [];
    for (const service of services) {
      this.registerService(service);
    }
    
    // Register plugin stages
    const stages = plugin.getStages?.() ?? [];
    for (const stage of stages) {
      this.addStage(stage);
    }
    
    return this;
  }
  
  // ===========================================================================
  // Service Management
  // ===========================================================================
  
  /**
   * Register a service
   */
  registerService(service: IService): void {
    this.logger.debug(`Registering service: ${service.name}@${service.version}`);
    this.registry.register(service);
    
    this.eventBus.emit('service:registered', {
      name: service.name,
      version: service.version,
    });
  }
  
  /**
   * Check if a service exists
   */
  hasService(name: string): boolean {
    return this.registry.has(name);
  }
  
  /**
   * Get a service by name
   */
  getService<T extends IService>(name: string): T {
    return this.registry.resolve<T>(name);
  }
  
  // ===========================================================================
  // Pipeline Management
  // ===========================================================================
  
  /**
   * Add a pipeline stage
   */
  addStage(stage: IPipelineStage): void {
    this.logger.debug(`Adding stage: ${stage.name} (order: ${stage.order})`);
    this.pipeline.addStage(stage);
  }
  
  /**
   * Check if a stage exists
   */
  hasStage(name: string): boolean {
    return this.pipeline.getStage(name) !== undefined;
  }
  
  // ===========================================================================
  // Event Handling
  // ===========================================================================
  
  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    return this.eventBus.on(event, handler);
  }
  
  /**
   * Get the event bus for advanced event handling
   */
  getEventBus(): IEventBus {
    return this.eventBus;
  }
  
  // ===========================================================================
  // Generation
  // ===========================================================================
  
  /**
   * Run the generation process
   */
  async generate(config: GeneratorConfig): Promise<GeneratorResult> {
    const startTime = performance.now();
    
    this.logger.info(`🚀 Starting generation for ${config.app.name}`);
    
    // Emit start event
    this.eventBus.emit('generator:start', {
      config,
      timestamp: Date.now(),
    });
    
    try {
      // 1. Run plugin onBeforeGenerate hooks (can modify config)
      let processedConfig = config;
      for (const plugin of this.plugins) {
        if (plugin.onBeforeGenerate) {
          this.logger.debug(`Running onBeforeGenerate for plugin: ${plugin.name}`);
          processedConfig = await plugin.onBeforeGenerate(processedConfig);
        }
      }
      
      // 2. Initialize all services
      await this.initializeServices(processedConfig);
      
      // 3. Create pipeline context
      const context = createPipelineContext({
        config: processedConfig,
        logger: this.logger,
        eventBus: this.eventBus,
        registry: this.registry,
      });
      
      // 4. Execute pipeline
      const pipelineResult = await this.pipeline.execute(context);
      
      // 5. Dispose all services
      await this.disposeServices();
      
      // 6. Run plugin onAfterGenerate hooks
      const result: GeneratorResult = {
        ...pipelineResult,
        config: processedConfig,
      };
      
      for (const plugin of this.plugins) {
        if (plugin.onAfterGenerate) {
          this.logger.debug(`Running onAfterGenerate for plugin: ${plugin.name}`);
          await plugin.onAfterGenerate(result);
        }
      }
      
      const duration = performance.now() - startTime;
      result.duration = duration;
      
      // Emit complete event
      this.eventBus.emit('generator:complete', {
        duration,
        result,
      });
      
      if (result.success) {
        this.logger.info(`✅ Generation completed in ${Math.round(duration)}ms`);
      } else {
        this.logger.warn(`⚠️ Generation completed with errors in ${Math.round(duration)}ms`);
      }
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      
      this.logger.error(`❌ Generation failed: ${err.message}`);
      
      // Emit error event
      this.eventBus.emit('generator:error', {
        error: err,
      });
      
      // Try to dispose services even on error
      try {
        await this.disposeServices();
      } catch (disposeError) {
        this.logger.error('Error during service disposal:', disposeError);
      }
      
      return {
        success: false,
        stages: [],
        duration,
        errors: [{ stage: 'orchestrator', error: err }],
        config,
      };
    }
  }
  
  // ===========================================================================
  // Private Methods
  // ===========================================================================
  
  /**
   * Initialize all registered services
   */
  private async initializeServices(config: GeneratorConfig): Promise<void> {
    this.logger.debug('Initializing services...');
    
    await this.registry.initializeAll({
      config,
      logger: this.logger,
      eventBus: this.eventBus,
    });
    
    this.logger.debug('Services initialized');
  }
  
  /**
   * Dispose all registered services
   */
  private async disposeServices(): Promise<void> {
    this.logger.debug('Disposing services...');
    
    await this.registry.disposeAll();
    
    this.logger.debug('Services disposed');
  }
}
