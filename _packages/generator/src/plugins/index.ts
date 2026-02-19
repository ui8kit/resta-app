export { PluginManager, createPlugin } from './PluginManager';
export type { PluginDefinition, PluginHooks } from './PluginManager';

// Template Plugin System
export {
  // Base
  BasePlugin,
  // Registry
  PluginRegistry,
  defaultRegistry,
  registerTemplatePlugin,
  getTemplatePlugin,
  // Built-in Plugins
  LiquidPlugin,
  HandlebarsPlugin,
  TwigPlugin,
  LattePlugin,
  ReactPlugin,
  builtInPlugins,
  registerBuiltInPlugins,
} from './template';

export type {
  ITemplatePlugin,
  TemplatePluginFeatures,
  TemplatePluginContext,
  TemplatePluginConfig,
  TransformResult,
  FilterDefinition,
  StandardFilter,
  TemplatePluginFactory,
  TemplatePluginMetadata,
} from './template';
