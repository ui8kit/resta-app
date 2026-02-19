/**
 * TemplateService - Generates templates from React components
 *
 * Orchestrates the transformation of React components to template files
 * using the transformer and plugin system.
 *
 * Modes:
 * - sourceDirTargets: scan dirs, transform each file, write to outputDir/target/Name.ext
 * - registryPath: read registry (e.g. dist/react/registry.json); for each item with
 *   sourcePath, transform and write to outputDir/item.files[0].path (explicit contract).
 */

import type { IService, IServiceContext } from '../../core/interfaces';
import { transformJsxFile } from '../../transformer';
import type { TransformResult } from '../../transformer';
import {
  PluginRegistry,
  registerBuiltInPlugins,
  type ITemplatePlugin,
  type TemplatePluginConfig,
} from '../../plugins/template';
import type { TemplateOutput } from '../../hast';
import type { IFileSystem } from '../../core/filesystem';
import { createNodeFileSystem } from '../../core/filesystem';
import type { Registry, RegistryItem } from '../../scripts';

// =============================================================================
// Service Types
// =============================================================================

/**
 * Source directory with target subfolder for structural output (e.g. blocks/, layouts/).
 * Same concept as registry sourceDirs: path → target.
 */
export interface SourceDirTarget {
  /** Absolute path to source directory */
  path: string;
  /** Subfolder name under outputDir (e.g. "blocks", "layouts", "partials", "routes") */
  target: string;
}

/**
 * Input for TemplateService.execute()
 */
export interface TemplateServiceInput {
  /** Source directories to scan for components (flat output under outputDir) */
  sourceDirs?: string[];
  
  /**
   * Source directories with target subfolders for structural output.
   * When set, files are written to outputDir/{target}/{ComponentName}.{ext}.
   * Same source of truth as registry (blocks, layouts, partials, routes).
   */
  sourceDirTargets?: SourceDirTarget[];
  
  /** Output directory for generated templates */
  outputDir: string;
  
  /** Template engine to use */
  engine: 'react' | 'liquid' | 'handlebars' | 'twig' | 'latte';
  
  /** File patterns to include (default: all .tsx files) */
  include?: string[];
  
  /** File patterns to exclude */
  exclude?: string[];
  
  /** Plugin configuration */
  pluginConfig?: Partial<TemplatePluginConfig>;
  
  /** Verbose logging */
  verbose?: boolean;

  /**
   * Component names to preserve as elements (not converted to includes).
   * Useful for UI primitives that should remain as component references
   * with their children intact in the generated output.
   */
  passthroughComponents?: string[];

  /**
   * Module specifiers to exclude from generated template imports.
   * Imports from these sources are stripped from tree.meta.imports before
   * the plugin runs (e.g. React plugin will not emit them).
   * Use for DSL packages like @ui8kit/dsl whose components are
   * compiled away and must not appear in the output.
   */
  excludeDependencies?: string[];

  /**
   * Path to registry.json (e.g. dist/react/registry.json).
   * When set, the service reads the registry and generates templates only for
   * items that have sourcePath; each output is written to outputDir + item.files[0].path.
   * This is the "registry → dist" pipeline: one source of truth, explicit unpack paths.
   */
  registryPath?: string;
}

/**
 * Output from TemplateService.execute()
 */
export interface TemplateServiceOutput {
  /** Generated template files */
  files: GeneratedFile[];
  
  /** Total components processed */
  componentsProcessed: number;
  
  /** Warnings during generation */
  warnings: string[];
  
  /** Errors during generation */
  errors: string[];
  
  /** Processing duration in ms */
  duration: number;
}

/**
 * Generated file info
 */
export interface GeneratedFile {
  /** Source file path */
  source: string;
  
  /** Output file path */
  output: string;
  
  /** Component name */
  componentName: string;
  
  /** Variables used */
  variables: string[];
  
  /** Dependencies */
  dependencies: string[];
}

// =============================================================================
// Service Implementation
// =============================================================================

export class TemplateService implements IService<TemplateServiceInput, TemplateServiceOutput> {
  readonly name = 'template';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = [];
  
  private context!: IServiceContext;
  private registry: PluginRegistry;
  private plugin: ITemplatePlugin | null = null;
  private fs: IFileSystem;
  
  constructor(fs?: IFileSystem) {
    this.registry = new PluginRegistry();
    registerBuiltInPlugins(this.registry);
    this.fs = fs || createNodeFileSystem();
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
    this.context.logger.debug('TemplateService initialized');
  }
  
  async execute(input: TemplateServiceInput): Promise<TemplateServiceOutput> {
    const startTime = Date.now();
    const {
      sourceDirs,
      sourceDirTargets,
      outputDir,
      engine,
      include = ['**/*.tsx'],
      exclude = ['**/*.test.tsx', '**/*.spec.tsx', '**/node_modules/**'],
      pluginConfig = {},
      verbose = false,
      passthroughComponents,
      excludeDependencies,
      registryPath,
    } = input;

    if (!registryPath && !sourceDirTargets?.length && !sourceDirs?.length) {
      throw new Error('TemplateService: provide registryPath or sourceDirs/sourceDirTargets');
    }

    const files: GeneratedFile[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let componentsProcessed = 0;

    const config: TemplatePluginConfig = {
      fileExtension: this.getFileExtension(engine),
      outputDir,
      prettyPrint: true,
      ...pluginConfig,
    };
    
    this.plugin = this.registry.get(engine, config);
    await this.plugin.initialize({
      logger: this.context.logger as any,
      config,
      outputDir,
    });
    
    await this.fs.mkdir(outputDir, { recursive: true });

    if (registryPath) {
      // Registry → dist pipeline: read registry, for each item with sourcePath transform and write to outputDir/item.files[0].path
      const registry: Registry = JSON.parse(await this.fs.readFile(registryPath, 'utf-8'));
      if (!registry.items || !Array.isArray(registry.items)) {
        throw new Error(`TemplateService: invalid registry at ${registryPath} (missing items)`);
      }
      for (const item of registry.items as RegistryItem[]) {
        const sourcePath = item.sourcePath;
        const outRelPath = item.files?.[0]?.path;
        if (!sourcePath || !outRelPath) continue;
        try {
          if (verbose) this.context.logger.info(`Processing: ${item.name} → ${outRelPath}`);
          const transformResult = await transformJsxFile(sourcePath, { passthroughComponents });
          if (transformResult.errors.length > 0) {
            errors.push(...transformResult.errors.map((e) => `${sourcePath}: ${e}`));
            continue;
          }
          warnings.push(...transformResult.warnings.map((w) => `${sourcePath}: ${w}`));
          if (transformResult.tree.children.length === 0) {
            if (verbose) this.context.logger.debug(`Skipping empty: ${item.name}`);
            continue;
          }
          if (excludeDependencies?.length && transformResult.tree.meta?.imports?.length) {
            transformResult.tree.meta.imports = transformResult.tree.meta.imports.filter(
              (imp) => !excludeDependencies.includes(imp.source)
            );
          }
          const templateOutput = await this.plugin.transform(transformResult.tree);
          const outputPath = this.fs.join(outputDir, outRelPath);
          await this.writeTemplateFile(outputPath, templateOutput.content);
          files.push({
            source: sourcePath,
            output: outputPath,
            componentName: item.name,
            variables: templateOutput.variables,
            dependencies: templateOutput.dependencies,
          });
          componentsProcessed++;
          if (verbose) this.context.logger.info(`Generated: ${outputPath}`);
        } catch (error) {
          errors.push(`${sourcePath}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } else {
      const dirs: { sourceDir: string; target?: string }[] = sourceDirTargets?.length
        ? sourceDirTargets.map(({ path, target }) => ({ sourceDir: path, target }))
        : (sourceDirs!.map((sourceDir) => ({ sourceDir, target: undefined })));

      for (const { sourceDir, target } of dirs) {
      try {
        if (verbose) {
          this.context.logger.info(`Scanning: ${sourceDir}`);
        }
        
        const componentFiles = await this.findComponentFiles(sourceDir, include, exclude);
        
        if (verbose) {
          this.context.logger.info(`  Found ${componentFiles.length} files`);
        }
        
        for (const filePath of componentFiles) {
          try {
            if (verbose) {
              this.context.logger.info(`Processing: ${filePath}`);
            }
            
            const transformResult = await transformJsxFile(filePath, {
              passthroughComponents,
            });
            
            if (transformResult.errors.length > 0) {
              errors.push(...transformResult.errors.map(e => `${filePath}: ${e}`));
              continue;
            }
            
            warnings.push(...transformResult.warnings.map(w => `${filePath}: ${w}`));
            
            if (transformResult.tree.children.length === 0) {
              if (verbose) {
                this.context.logger.debug(`Skipping empty component: ${filePath}`);
              }
              continue;
            }

            // Strip imports from excluded dependencies (e.g. @ui8kit/dsl)
            // so the plugin does not emit them in generated templates.
            if (excludeDependencies?.length && transformResult.tree.meta?.imports?.length) {
              transformResult.tree.meta.imports = transformResult.tree.meta.imports.filter(
                (imp) => !excludeDependencies.includes(imp.source)
              );
            }

            const templateOutput = await this.plugin.transform(transformResult.tree);
            const componentName = transformResult.tree.meta?.componentName || 'Unknown';
            const outputPath = target
              ? this.fs.join(outputDir, target, componentName + config.fileExtension)
              : this.getOutputPath(filePath, sourceDir, outputDir, config.fileExtension);
            await this.writeTemplateFile(outputPath, templateOutput.content);
            
            files.push({
              source: filePath,
              output: outputPath,
              componentName,
              variables: templateOutput.variables,
              dependencies: templateOutput.dependencies,
            });
            
            componentsProcessed++;
            
            if (verbose) {
              this.context.logger.info(`Generated: ${outputPath}`);
            }
          } catch (error) {
            errors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      } catch (error) {
        errors.push(`${sourceDir}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    }

    // Emit event (if eventBus is available)
    if (this.context.eventBus) {
      this.context.eventBus.emit('template:complete', {
        filesGenerated: files.length,
        engine,
        outputDir,
      });
    }
    
    const duration = Date.now() - startTime;
    
    return {
      files,
      componentsProcessed,
      warnings,
      errors,
      duration,
    };
  }
  
  async dispose(): Promise<void> {
    if (this.plugin) {
      await this.plugin.dispose();
      this.plugin = null;
    }
  }
  
  // ===========================================================================
  // Private Methods
  // ===========================================================================
  
  /**
   * Get file extension for engine
   */
  private getFileExtension(engine: string): string {
    const extensions: Record<string, string> = {
      react: '.tsx',
      liquid: '.liquid',
      handlebars: '.hbs',
      twig: '.twig',
      latte: '.latte',
    };
    return extensions[engine] || '.html';
  }
  
  /**
   * Find component files matching patterns
   */
  private async findComponentFiles(
    dir: string,
    include: string[],
    exclude: string[]
  ): Promise<string[]> {
    const files: string[] = [];
    
    const walk = async (currentDir: string): Promise<void> => {
      const entries = await this.fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = this.fs.join(currentDir, entry.name);
        const relativePath = this.fs.relative(dir, fullPath);
        
        if (entry.isDirectory()) {
          // Check if excluded
          if (!this.matchesPattern(relativePath, exclude)) {
            await walk(fullPath);
          }
        } else if (entry.isFile()) {
          // Check if included and not excluded
          if (
            this.matchesPattern(relativePath, include) &&
            !this.matchesPattern(relativePath, exclude)
          ) {
            files.push(fullPath);
          }
        }
      }
    };
    
    await walk(dir);
    return files;
  }
  
  /**
   * Check if path matches any pattern
   */
  private matchesPattern(path: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      if (this.simpleMatch(path, pattern)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Simple glob-like pattern matching
   */
  private simpleMatch(path: string, pattern: string): boolean {
    // Normalize path separators
    const normalizedPath = path.replace(/\\/g, '/');
    
    // Handle **/ at start - matches any path prefix including none
    let regexPattern = pattern
      .replace(/\\/g, '/')
      .replace(/\./g, '\\.')
      .replace(/\*\*\//g, '(?:.*/)?')  // **/ matches zero or more directories
      .replace(/\*\*/g, '.*')           // ** matches anything
      .replace(/\*/g, '[^/]*');         // * matches non-slash chars
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedPath);
  }
  
  /**
   * Get output path for a source file
   */
  private getOutputPath(
    sourcePath: string,
    sourceDir: string,
    outputDir: string,
    extension: string
  ): string {
    const relativePath = this.fs.relative(sourceDir, sourcePath);
    const baseName = this.fs.basename(relativePath, this.fs.extname(relativePath));
    const dir = this.fs.join(outputDir, this.fs.dirname(relativePath));
    return this.fs.join(dir, baseName + extension);
  }
  
  /**
   * Write template file
   */
  private async writeTemplateFile(filePath: string, content: string): Promise<void> {
    const dir = this.fs.dirname(filePath);
    await this.fs.mkdir(dir, { recursive: true });
    await this.fs.writeFile(filePath, content);
  }
}
