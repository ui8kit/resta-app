/**
 * Template Plugin System
 *
 * Provides infrastructure for template engine plugins that transform
 * GenHAST trees into various template formats (Liquid, Twig, Handlebars, Latte).
 *
 * @example
 * ```ts
 * import {
 *   PluginRegistry,
 *   LiquidPlugin,
 *   registerTemplatePlugin,
 * } from '@ui8kit/generator/plugins/template';
 *
 * // Register plugin
 * const registry = new PluginRegistry();
 * registry.registerInstance(new LiquidPlugin());
 *
 * // Use plugin
 * const plugin = registry.get('liquid');
 * const output = await plugin.transform(hastTree);
 * ```
 */

// Interface and types
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
} from './ITemplatePlugin';

// Base class
export { BasePlugin } from './BasePlugin';

// Registry
export {
  PluginRegistry,
  defaultRegistry,
  registerTemplatePlugin,
  getTemplatePlugin,
} from './PluginRegistry';

// Built-in plugins
export {
  LiquidPlugin,
  HandlebarsPlugin,
  TwigPlugin,
  LattePlugin,
  ReactPlugin,
  builtInPlugins,
  registerBuiltInPlugins,
} from './built-in';
