/**
 * Built-in Template Plugins
 *
 * Official plugins for common template engines:
 * - ReactPlugin: React JSX runtime
 * - LiquidPlugin: For Shopify, Jekyll, Eleventy (JS runtime)
 * - HandlebarsPlugin: For Express.js, static sites (JS runtime)
 * - TwigPlugin: For Symfony, PHP applications (PHP runtime)
 * - LattePlugin: For Nette Framework (PHP runtime)
 */

export { ReactPlugin } from './ReactPlugin';
export { LiquidPlugin } from './LiquidPlugin';
export { HandlebarsPlugin } from './HandlebarsPlugin';
export { TwigPlugin } from './TwigPlugin';
export { LattePlugin } from './LattePlugin';

// Re-export for convenience
import { ReactPlugin } from './ReactPlugin';
import { LiquidPlugin } from './LiquidPlugin';
import { HandlebarsPlugin } from './HandlebarsPlugin';
import { TwigPlugin } from './TwigPlugin';
import { LattePlugin } from './LattePlugin';
import type { TemplatePluginMetadata, TemplatePluginFactory } from '../ITemplatePlugin';

/**
 * All built-in plugins with their metadata and factories
 */
export const builtInPlugins: Array<{
  metadata: TemplatePluginMetadata;
  factory: TemplatePluginFactory;
}> = [
  {
    metadata: {
      name: 'react',
      version: '1.0.0',
      runtime: 'js',
      fileExtension: '.tsx',
      description: 'React JSX template plugin for UI8Kit',
    },
    factory: (config) => new ReactPlugin(),
  },
  {
    metadata: {
      name: 'liquid',
      version: '1.0.0',
      runtime: 'js',
      fileExtension: '.liquid',
      description: 'Liquid template engine for Shopify, Jekyll, Eleventy',
    },
    factory: (config) => new LiquidPlugin(),
  },
  {
    metadata: {
      name: 'handlebars',
      version: '1.0.0',
      runtime: 'js',
      fileExtension: '.hbs',
      description: 'Handlebars template engine for Express.js and static sites',
    },
    factory: (config) => new HandlebarsPlugin(),
  },
  {
    metadata: {
      name: 'twig',
      version: '1.0.0',
      runtime: 'php',
      fileExtension: '.twig',
      description: 'Twig template engine for Symfony and PHP applications',
    },
    factory: (config) => new TwigPlugin(),
  },
  {
    metadata: {
      name: 'latte',
      version: '1.0.0',
      runtime: 'php',
      fileExtension: '.latte',
      description: 'Latte template engine for Nette Framework',
    },
    factory: (config) => new LattePlugin(),
  },
];

/**
 * Register all built-in plugins in a registry
 */
import { PluginRegistry } from '../PluginRegistry';

export function registerBuiltInPlugins(registry: PluginRegistry): void {
  for (const { metadata, factory } of builtInPlugins) {
    registry.register(metadata, factory);
  }
}
