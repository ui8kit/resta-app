/**
 * TemplateStage - Pipeline stage for template generation
 *
 * Transforms React components to template files using the transformer
 * and template plugin system.
 */

import type { IPipelineStage, IPipelineContext } from '../core/interfaces';
import { TemplateService, type TemplateServiceInput, type TemplateServiceOutput } from '../services/template';

// =============================================================================
// Stage Options
// =============================================================================

export interface TemplateStageOptions {
  /** Template engine to use */
  engine?: 'react' | 'liquid' | 'handlebars' | 'twig' | 'latte';
  
  /** Source directories (relative to root) */
  sourceDirs?: string[];
  
  /** Output directory (relative to root) */
  outputDir?: string;
  
  /** File patterns to include */
  include?: string[];
  
  /** File patterns to exclude */
  exclude?: string[];
  
  /** Verbose logging */
  verbose?: boolean;
}

// =============================================================================
// Stage Implementation
// =============================================================================

export class TemplateStage implements IPipelineStage<void, TemplateServiceOutput> {
  readonly name = 'template';
  readonly order = 100; // Run after other stages
  readonly enabled: boolean = true;
  readonly dependencies: readonly string[] = [];
  readonly description = 'Generate template files from React components';
  
  private options: TemplateStageOptions;
  private service: TemplateService;
  
  constructor(options: TemplateStageOptions = {}) {
    this.options = options;
    this.service = new TemplateService();
  }
  
  canExecute(context: IPipelineContext): boolean {
    // Check if template generation is enabled in config
    const config = context.config as any;
    const templateConfig = config?.template;
    
    // Enabled if explicitly configured or if options provided
    return !!(
      templateConfig?.enabled ||
      templateConfig?.engine ||
      this.options.engine
    );
  }
  
  async execute(_input: void, context: IPipelineContext): Promise<TemplateServiceOutput> {
    const { config, logger, eventBus } = context;
    const templateConfig = (config as any)?.template ?? {};
    
    // Merge options: stage options < config options
    const engine = templateConfig.engine ?? this.options.engine ?? 'liquid';
    const rootDir = (config as any)?.root ?? process.cwd();
    
    const sourceDirs = (templateConfig.sourceDirs ?? this.options.sourceDirs ?? ['./src/components', './src/blocks', './src/layouts', './src/partials'])
      .map((dir: string) => this.resolvePath(rootDir, dir));
    
    const outputDir = this.resolvePath(
      rootDir,
      templateConfig.outputDir ?? this.options.outputDir ?? './dist/templates'
    );
    
    const include = templateConfig.include ?? this.options.include ?? ['**/*.tsx'];
    const exclude = templateConfig.exclude ?? this.options.exclude ?? [
      '**/*.test.tsx',
      '**/*.spec.tsx',
      '**/node_modules/**',
      '**/__tests__/**',
    ];
    
    const verbose = templateConfig.verbose ?? this.options.verbose ?? false;
    
    logger.info(`Generating ${engine} templates...`);
    logger.debug(`Source dirs: ${sourceDirs.join(', ')}`);
    logger.debug(`Output dir: ${outputDir}`);
    
    // Initialize service
    await this.service.initialize({
      config,
      logger,
      eventBus,
      registry: null as any,
    });
    
    // Execute
    const input: TemplateServiceInput = {
      sourceDirs,
      outputDir,
      engine,
      include,
      exclude,
      verbose,
    };
    
    const result = await this.service.execute(input);
    
    // Store result
    context.setData('template:result', result);
    
    // Log summary
    if (result.errors.length > 0) {
      logger.warn(`Template generation completed with ${result.errors.length} errors`);
      for (const error of result.errors) {
        logger.error(`  ${error}`);
      }
    }
    
    if (result.warnings.length > 0 && verbose) {
      for (const warning of result.warnings) {
        logger.warn(`  ${warning}`);
      }
    }
    
    logger.info(`Generated ${result.files.length} templates in ${result.duration}ms`);
    
    // Emit event
    eventBus.emit('stage:complete', {
      name: this.name,
      result: {
        filesGenerated: result.files.length,
        engine,
        duration: result.duration,
      },
    });
    
    return result;
  }
  
  async onError(error: Error, context: IPipelineContext): Promise<void> {
    context.logger.error(`Template generation failed: ${error.message}`);
    
    // Emit error event
    context.eventBus.emit('stage:error', {
      name: this.name,
      error,
    });
  }
  
  // ===========================================================================
  // Private Methods
  // ===========================================================================
  
  private resolvePath(root: string, relativePath: string): string {
    if (relativePath.startsWith('/') || /^[a-zA-Z]:/.test(relativePath)) {
      return relativePath;
    }
    
    // Simple path join
    const normalized = relativePath.replace(/^\.\//, '');
    return `${root.replace(/\/$/, '')}/${normalized}`;
  }
}
