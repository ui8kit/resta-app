/**
 * PluginRegistry - Registry for Template Plugins
 *
 * Manages registration, discovery, and instantiation of template plugins.
 */

import type {
  ITemplatePlugin,
  TemplatePluginFactory,
  TemplatePluginMetadata,
  TemplatePluginConfig,
  TemplatePluginContext,
} from './ITemplatePlugin';
import type { ILogger } from '../../core/interfaces';

// =============================================================================
// Registry Types
// =============================================================================

/**
 * Registered plugin entry
 */
interface PluginEntry {
  /** Plugin metadata */
  metadata: TemplatePluginMetadata;
  /** Factory function to create plugin instance */
  factory: TemplatePluginFactory;
}

// =============================================================================
// PluginRegistry Class
// =============================================================================

/**
 * Registry for template plugins
 */
export class PluginRegistry {
  private plugins: Map<string, PluginEntry> = new Map();
  private instances: Map<string, ITemplatePlugin> = new Map();
  private logger?: ILogger;

  /**
   * Create a new registry
   */
  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  // ===========================================================================
  // Registration
  // ===========================================================================

  /**
   * Register a plugin factory
   *
   * @param metadata - Plugin metadata
   * @param factory - Factory function to create plugin
   */
  register(metadata: TemplatePluginMetadata, factory: TemplatePluginFactory): void {
    if (this.plugins.has(metadata.name)) {
      throw new Error(`Plugin "${metadata.name}" is already registered`);
    }

    this.plugins.set(metadata.name, { metadata, factory });
    this.logger?.debug(`Registered template plugin: ${metadata.name} v${metadata.version}`);
  }

  /**
   * Register a plugin instance directly
   *
   * @param plugin - Plugin instance
   */
  registerInstance(plugin: ITemplatePlugin): void {
    const metadata: TemplatePluginMetadata = {
      name: plugin.name,
      version: plugin.version,
      runtime: plugin.runtime,
      fileExtension: plugin.fileExtension,
      description: plugin.description,
    };

    this.plugins.set(plugin.name, {
      metadata,
      factory: () => plugin,
    });

    this.instances.set(plugin.name, plugin);
    this.logger?.debug(`Registered template plugin instance: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Unregister a plugin
   *
   * @param name - Plugin name
   * @returns True if plugin was unregistered
   */
  unregister(name: string): boolean {
    this.instances.delete(name);
    return this.plugins.delete(name);
  }

  // ===========================================================================
  // Discovery
  // ===========================================================================

  /**
   * Check if a plugin is registered
   *
   * @param name - Plugin name
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get plugin metadata
   *
   * @param name - Plugin name
   */
  getMetadata(name: string): TemplatePluginMetadata | undefined {
    return this.plugins.get(name)?.metadata;
  }

  /**
   * Get all registered plugin metadata
   */
  getAllMetadata(): TemplatePluginMetadata[] {
    return Array.from(this.plugins.values()).map(entry => entry.metadata);
  }

  /**
   * Get plugins by runtime
   *
   * @param runtime - Target runtime ('js' or 'php')
   */
  getByRuntime(runtime: 'js' | 'php'): TemplatePluginMetadata[] {
    return this.getAllMetadata().filter(m => m.runtime === runtime);
  }

  /**
   * Get plugins by file extension
   *
   * @param extension - File extension (e.g., '.liquid')
   */
  getByExtension(extension: string): TemplatePluginMetadata | undefined {
    return this.getAllMetadata().find(m => m.fileExtension === extension);
  }

  // ===========================================================================
  // Instantiation
  // ===========================================================================

  /**
   * Get or create a plugin instance
   *
   * @param name - Plugin name
   * @param config - Plugin configuration
   */
  get(name: string, config?: Partial<TemplatePluginConfig>): ITemplatePlugin {
    // Return cached instance if available
    const cached = this.instances.get(name);
    if (cached) return cached;

    // Get entry
    const entry = this.plugins.get(name);
    if (!entry) {
      throw new Error(`Plugin "${name}" is not registered. Available: ${this.getAvailableNames().join(', ')}`);
    }

    // Create instance
    const instance = entry.factory(config);
    this.instances.set(name, instance);

    return instance;
  }

  /**
   * Create a new plugin instance (always fresh, not cached)
   *
   * @param name - Plugin name
   * @param config - Plugin configuration
   */
  create(name: string, config?: Partial<TemplatePluginConfig>): ITemplatePlugin {
    const entry = this.plugins.get(name);
    if (!entry) {
      throw new Error(`Plugin "${name}" is not registered. Available: ${this.getAvailableNames().join(', ')}`);
    }

    return entry.factory(config);
  }

  /**
   * Initialize a plugin with context
   *
   * @param name - Plugin name
   * @param context - Plugin context
   */
  async initialize(name: string, context: TemplatePluginContext): Promise<ITemplatePlugin> {
    const plugin = this.get(name, context.config);
    await plugin.initialize(context);
    return plugin;
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  /**
   * Dispose all plugin instances
   */
  async disposeAll(): Promise<void> {
    for (const [name, plugin] of this.instances) {
      try {
        await plugin.dispose();
      } catch (error) {
        this.logger?.error(`Failed to dispose plugin "${name}":`, error);
      }
    }
    this.instances.clear();
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.instances.clear();
    this.plugins.clear();
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  /**
   * Get list of available plugin names
   */
  getAvailableNames(): string[] {
    return Array.from(this.plugins.keys()).sort();
  }

  /**
   * Get count of registered plugins
   */
  get size(): number {
    return this.plugins.size;
  }
}

// =============================================================================
// Default Registry
// =============================================================================

/**
 * Default global registry instance
 */
export const defaultRegistry = new PluginRegistry();

/**
 * Register a plugin in the default registry
 */
export function registerTemplatePlugin(
  metadata: TemplatePluginMetadata,
  factory: TemplatePluginFactory
): void {
  defaultRegistry.register(metadata, factory);
}

/**
 * Get a plugin from the default registry
 */
export function getTemplatePlugin(
  name: string,
  config?: Partial<TemplatePluginConfig>
): ITemplatePlugin {
  return defaultRegistry.get(name, config);
}
