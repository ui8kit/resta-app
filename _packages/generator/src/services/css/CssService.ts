import type { IService, IServiceContext, RouteConfig } from '../../core/interfaces';
import { HtmlConverterService } from '../html-converter';
import { join } from 'node:path';

/**
 * CSS output file names configuration
 */
export interface CssOutputFileNames {
  /** Tailwind @apply CSS file name (default: 'tailwind.apply.css') */
  applyCss?: string;
  /** Pure CSS file name (default: 'ui8kit.local.css') */
  pureCss?: string;
}

/**
 * Default CSS output file names
 */
const DEFAULT_CSS_OUTPUT_FILES: Required<CssOutputFileNames> = {
  applyCss: 'tailwind.apply.css',
  pureCss: 'ui8kit.local.css',
};

/**
 * Input for CssService.execute()
 */
export interface CssServiceInput {
  viewsDir: string;
  outputDir: string;
  routes: Record<string, RouteConfig>;
  pureCss?: boolean;
  mappings?: {
    ui8kitMap?: string;
    shadcnMap?: string;
  };
  /** Output file names configuration */
  outputFiles?: CssOutputFileNames;
}

/**
 * Output from CssService.execute()
 */
export interface CssServiceOutput {
  files: Array<{
    path: string;
    size: number;
    type: 'apply' | 'pure' | 'variants';
  }>;
}

/**
 * File system interface for CssService
 */
export interface CssFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<Array<{ name: string; isFile: () => boolean }>>;
}

/**
 * CssService options
 */
export interface CssServiceOptions {
  fileSystem?: CssFileSystem;
  /** Custom HtmlConverterService instance (for testing) */
  htmlConverter?: HtmlConverterService;
}

/**
 * CssService - Generates CSS from Liquid view files.
 * 
 * Responsibilities:
 * - Extract classes from HTML views using HtmlConverterService
 * - Generate @apply CSS (tailwind.apply.css)
 * - Generate pure CSS3 (ui8kit.local.css)
 * - Merge CSS from multiple routes
 */
export class CssService implements IService<CssServiceInput, CssServiceOutput> {
  readonly name = 'css';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = ['view'];
  
  private context!: IServiceContext;
  private fs: CssFileSystem;
  private htmlConverter: HtmlConverterService;
  private converterInitialized = false;
  
  constructor(options: CssServiceOptions = {}) {
    this.fs = options.fileSystem ?? this.createDefaultFileSystem();
    this.htmlConverter = options.htmlConverter ?? new HtmlConverterService();
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
    
    // Try to get HtmlConverterService from registry first
    try {
      const registry = (context as any).registry;
      if (registry?.has('html-converter')) {
        this.htmlConverter = registry.resolve('html-converter');
        this.converterInitialized = true;
      }
    } catch {
      // Use our own instance
    }
    
    // Initialize our own converter if not from registry
    if (!this.converterInitialized) {
      await this.htmlConverter.initialize(context);
      this.converterInitialized = true;
    }
  }
  
  async execute(input: CssServiceInput): Promise<CssServiceOutput> {
    const { viewsDir, outputDir, routes, pureCss = false, outputFiles = {} } = input;
    
    // Merge with defaults
    const cssFileNames: Required<CssOutputFileNames> = { ...DEFAULT_CSS_OUTPUT_FILES, ...outputFiles };
    
    // Ensure output directory exists
    await this.fs.mkdir(outputDir);
    
    const allApplyCss: string[] = [];
    const allPureCss: string[] = [];
    const generatedFiles: CssServiceOutput['files'] = [];
    
    // Process page views for each route
    for (const routePath of Object.keys(routes)) {
      const viewFileName = this.routeToViewFileName(routePath);
      const viewPath = join(viewsDir, 'pages', viewFileName);
      
      try {
        const result = await this.htmlConverter.execute({
          htmlPath: viewPath,
          verbose: false,
        });
        
        allApplyCss.push(result.applyCss);
        if (pureCss) {
          allPureCss.push(result.pureCss);
        }
        
        this.context.logger.debug(`Processed CSS for route: ${routePath}`);
      } catch (error) {
        this.context.logger.warn(`Failed to process CSS for ${routePath}:`, error);
      }
    }
    
    // Process partials and layouts directories
    const extraDirs = [
      join(viewsDir, 'partials'),
      join(viewsDir, 'layouts'),
    ];
    
    for (const dirPath of extraDirs) {
      try {
        const entries = await this.fs.readdir(dirPath);
        
        for (const entry of entries) {
          if (!entry.isFile()) continue;
          if (!entry.name.toLowerCase().endsWith('.liquid')) continue;
          
          const filePath = join(dirPath, entry.name);
          
          try {
            const result = await this.htmlConverter.execute({
              htmlPath: filePath,
              verbose: false,
            });
            
            allApplyCss.push(result.applyCss);
            if (pureCss) {
              allPureCss.push(result.pureCss);
            }
            
            this.context.logger.debug(`Processed CSS for template: ${filePath}`);
          } catch (error) {
            this.context.logger.warn(`Failed to process CSS for ${filePath}:`, error);
          }
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }
    
    // Merge and write apply CSS
    const mergedApplyCss = this.mergeCssFiles(allApplyCss.filter(Boolean));
    const applyCssPath = join(outputDir, cssFileNames.applyCss);
    await this.fs.writeFile(applyCssPath, mergedApplyCss);
    
    generatedFiles.push({
      path: applyCssPath,
      size: mergedApplyCss.length,
      type: 'apply',
    });
    
    this.context.eventBus.emit('css:generated', {
      path: applyCssPath,
      size: mergedApplyCss.length,
    });
    
    this.context.logger.info(`Generated ${applyCssPath} (${mergedApplyCss.length} bytes)`);
    
    // Write pure CSS if enabled
    if (pureCss) {
      const mergedPureCss = this.mergeCssFiles(allPureCss.filter(Boolean));
      const pureCssPath = join(outputDir, cssFileNames.pureCss);
      await this.fs.writeFile(pureCssPath, mergedPureCss);
      
      generatedFiles.push({
        path: pureCssPath,
        size: mergedPureCss.length,
        type: 'pure',
      });
      
      this.context.eventBus.emit('css:generated', {
        path: pureCssPath,
        size: mergedPureCss.length,
      });
      
      this.context.logger.info(`Generated ${pureCssPath} (${mergedPureCss.length} bytes)`);
    }
    
    return { files: generatedFiles };
  }
  
  async dispose(): Promise<void> {
    // Dispose our own converter if we created it
    if (this.converterInitialized && this.htmlConverter) {
      await this.htmlConverter.dispose();
    }
  }
  
  /**
   * Convert route path to view file name
   */
  private routeToViewFileName(routePath: string): string {
    if (routePath === '/') {
      return 'index.liquid';
    }
    return `${routePath.slice(1)}.liquid`;
  }
  
  /**
   * Merge multiple CSS files
   */
  private mergeCssFiles(cssFiles: string[]): string {
    if (cssFiles.length === 0) return '';
    if (cssFiles.length === 1) return cssFiles[0];
    
    // Concatenate with route separators
    const merged = cssFiles.join('\n\n/* === Next Source === */\n\n');
    
    // Update timestamp in header
    return merged.replace(
      /Generated on: .*/,
      `Generated on: ${new Date().toISOString()}`
    );
  }
  
  /**
   * Create default file system using Node.js fs
   */
  private createDefaultFileSystem(): CssFileSystem {
    return {
      readFile: async (path: string) => {
        const { readFile } = await import('node:fs/promises');
        return readFile(path, 'utf-8');
      },
      writeFile: async (path: string, content: string) => {
        const { writeFile } = await import('node:fs/promises');
        await writeFile(path, content, 'utf-8');
      },
      mkdir: async (path: string) => {
        const { mkdir } = await import('node:fs/promises');
        await mkdir(path, { recursive: true });
      },
      readdir: async (path: string) => {
        const { readdir } = await import('node:fs/promises');
        const entries = await readdir(path, { withFileTypes: true });
        return entries.map(e => ({
          name: e.name,
          isFile: () => e.isFile(),
        }));
      },
    };
  }
}
