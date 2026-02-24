import type { 
  IPlugin, 
  IPluginContext, 
  IPipelineStage, 
  IService,
  ITypedEventBus,
  GeneratorConfig,
  ILogger,
  IServiceRegistry,
} from '../core/interfaces';
import { Pipeline } from '../core/pipeline';

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /** Called before pipeline execution */
  beforeGenerate?: (context: IPluginContext) => Promise<void> | void;
  /** Called after pipeline execution */
  afterGenerate?: (context: IPluginContext) => Promise<void> | void;
  /** Called on error */
  onError?: (error: Error, context: IPluginContext) => Promise<void> | void;
  /** Called during plugin initialization */
  setup?: (context: IPluginContext) => Promise<void> | void;
  /** Called during plugin cleanup */
  teardown?: () => Promise<void> | void;
}

/**
 * Plugin definition with hooks
 */
export interface PluginDefinition extends IPlugin, PluginHooks {}

/**
 * PluginManager - Manages plugin registration and lifecycle.
 * 
 * Responsibilities:
 * - Register plugins
 * - Execute lifecycle hooks
 * - Manage plugin dependencies
 */
export class PluginManager {
  private plugins: Map<string, PluginDefinition> = new Map();
  private context: IPluginContext | null = null;
  
  /**
   * Register a plugin
   */
  register(plugin: PluginDefinition): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    
    this.plugins.set(plugin.name, plugin);
  }
  
  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }
  
  /**
   * Check if a plugin is registered
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }
  
  /**
   * Get all registered plugins
   */
  getAll(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Initialize all plugins with context
   */
  async initialize(context: IPluginContext): Promise<void> {
    this.context = context;
    
    for (const plugin of this.plugins.values()) {
      if (plugin.setup) {
        await plugin.setup(context);
      }
    }
  }
  
  /**
   * Execute beforeGenerate hooks
   */
  async beforeGenerate(): Promise<void> {
    if (!this.context) {
      throw new Error('PluginManager not initialized');
    }
    
    for (const plugin of this.plugins.values()) {
      if (plugin.beforeGenerate) {
        await plugin.beforeGenerate(this.context);
      }
    }
  }
  
  /**
   * Execute afterGenerate hooks
   */
  async afterGenerate(): Promise<void> {
    if (!this.context) {
      throw new Error('PluginManager not initialized');
    }
    
    for (const plugin of this.plugins.values()) {
      if (plugin.afterGenerate) {
        await plugin.afterGenerate(this.context);
      }
    }
  }
  
  /**
   * Execute onError hooks
   */
  async onError(error: Error): Promise<void> {
    if (!this.context) return;
    
    for (const plugin of this.plugins.values()) {
      if (plugin.onError) {
        try {
          await plugin.onError(error, this.context);
        } catch (hookError) {
          // Log but don't propagate hook errors
          console.error(`Plugin "${plugin.name}" onError hook failed:`, hookError);
        }
      }
    }
  }
  
  /**
   * Dispose all plugins
   */
  async dispose(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if (plugin.teardown) {
        await plugin.teardown();
      }
    }
    
    this.plugins.clear();
    this.context = null;
  }
}

/**
 * Create a plugin from a simple configuration
 */
export function createPlugin(options: {
  name: string;
  version?: string;
  stages?: IPipelineStage[];
  services?: IService[];
  hooks?: PluginHooks;
}): PluginDefinition {
  const { name, version = '1.0.0', stages = [], services = [], hooks = {} } = options;
  
  return {
    name,
    version,
    
    setup: async (context: IPluginContext) => {
      // Register stages
      for (const stage of stages) {
        context.addStage(stage);
      }
      
      // Register services
      for (const service of services) {
        context.registerService(service);
      }
    },
    
    teardown: async () => {
      // Cleanup if needed
    },
    
    ...hooks,
  };
}
