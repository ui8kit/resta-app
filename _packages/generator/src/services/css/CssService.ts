import type { IService, IServiceContext, RouteConfig } from '../../core/interfaces';
import { HtmlConverterService } from '../html-converter';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { emitVariantsApplyCss } from '../../scripts/emit-variants-apply.js';
import { createNodeFileSystem } from '../../core/filesystem';
import { routeToViewFileName } from '../../core/utils/routes';

/**
 * CSS output file names configuration
 */
export interface CssOutputFileNames {
  /** Tailwind @apply CSS file name (default: 'tailwind.apply.css') */
  applyCss?: string;
  /** Pure CSS file name (default: 'ui8kit.local.css') */
  pureCss?: string;
  /** Variants CSS file name (default: 'variants.apply.css') */
  variantsCss?: string;
}

/**
 * Default CSS output file names
 */
const DEFAULT_CSS_OUTPUT_FILES: Required<CssOutputFileNames> = {
  applyCss: 'tailwind.apply.css',
  pureCss: 'ui8kit.local.css',
  variantsCss: 'variants.apply.css',
};

async function debugLog(runId: string, hypothesisId: string, location: string, message: string, data: Record<string, unknown>): Promise<void> {
  try {
    await fetch('http://127.0.0.1:7618/ingest/1a743e9b-8a63-4e35-95d4-015cb5a878d0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '4cbe3d',
      },
      body: JSON.stringify({
        sessionId: '4cbe3d',
        runId,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    });
  } catch {
    // ignore logging transport failures
  }
}

/**
 * Input for CssService.execute()
 */
export interface CssServiceInput {
  viewsDir: string;
  viewsPagesSubdir?: string;
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
}

/**
 * CssService options
 */
export interface CssServiceOptions {
  fileSystem?: CssFileSystem;
}

/**
 * CssService - Generates CSS from HTML view files.
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
  readonly dependencies: readonly string[] = ['html-converter'];
  
  private context!: IServiceContext;
  private fs: CssFileSystem;
  private htmlConverter!: HtmlConverterService;
  
  constructor(options: CssServiceOptions = {}) {
    this.fs = options.fileSystem ?? createNodeFileSystem();
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
    this.htmlConverter = context.registry.resolve<HtmlConverterService>('html-converter');
  }
  
  async execute(input: CssServiceInput): Promise<CssServiceOutput> {
    const { viewsDir, viewsPagesSubdir = 'pages', outputDir, routes, pureCss = false, outputFiles = {} } = input;
    // #region agent log
    await debugLog('pre-fix', 'H1', 'src/services/css/CssService.ts:127', 'CssService execute entered', {
      outputDir,
      outputDirExists: existsSync(outputDir),
      routesCount: Object.keys(routes).length,
      pureCss,
    });
    // #endregion
    
    // Merge with defaults
    const cssFileNames: Required<CssOutputFileNames> = { ...DEFAULT_CSS_OUTPUT_FILES, ...outputFiles };
    
    // Ensure output directory exists
    try {
      // #region agent log
      await debugLog('pre-fix', 'H1', 'src/services/css/CssService.ts:139', 'About to mkdir outputDir', {
        outputDir,
      });
      // #endregion
      await this.fs.mkdir(outputDir);
      // #region agent log
      await debugLog('pre-fix', 'H1', 'src/services/css/CssService.ts:145', 'mkdir outputDir succeeded', {
        outputDir,
      });
      // #endregion
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'EEXIST') {
        // #region agent log
        await debugLog('post-fix', 'H1', 'src/services/css/CssService.ts:153', 'mkdir outputDir already exists; continuing', {
          outputDir,
        });
        // #endregion
        this.context.logger.debug(`Output directory already exists: ${outputDir}`);
      } else {
      // #region agent log
        await debugLog('post-fix', 'H1', 'src/services/css/CssService.ts:159', 'mkdir outputDir failed', {
        outputDir,
        code: err.code,
        message: err.message,
      });
      // #endregion
        throw error;
      }
    }
    
    const allApplyCss: string[] = [];
    const allPureCss: string[] = [];
    const generatedFiles: CssServiceOutput['files'] = [];

    // Emit variants.apply.css first. In package-local runs this directory may not exist.
    let variantsCss = '';
    try {
      variantsCss = await emitVariantsApplyCss({
        variantsDir: './src/variants',
      });
    } catch (error) {
      this.context.logger.warn('Failed to generate variants.apply.css, using empty output.', error);
    }
    const variantsPath = join(outputDir, cssFileNames.variantsCss);
    await this.fs.writeFile(variantsPath, variantsCss);
    generatedFiles.push({
      path: variantsPath,
      size: variantsCss.length,
      type: 'variants',
    });
    this.context.eventBus.emit('css:generated', { path: variantsPath, size: variantsCss.length });
    this.context.logger.info(`Generated ${variantsPath} (${variantsCss.length} bytes)`);
    
    // Process page views for each route
    let routeReadFailures = 0;
    for (const routePath of Object.keys(routes)) {
      const viewFileName = routeToViewFileName(routePath);
      const viewPath = join(viewsDir, viewsPagesSubdir, viewFileName);
      
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
        routeReadFailures += 1;
        if (routeReadFailures <= 5) {
          const err = error as NodeJS.ErrnoException;
          // #region agent log
          await debugLog('pre-fix', 'H7', 'src/services/css/CssService.ts:225', 'Failed route view conversion for CSS', {
            routePath,
            viewPath,
            code: err.code,
            message: err.message,
          });
          // #endregion
        }
        this.context.logger.warn(`Failed to process CSS for ${routePath}:`, error);
      }
    }
    // #region agent log
    await debugLog('pre-fix', 'H7', 'src/services/css/CssService.ts:235', 'CSS route conversion summary', {
      totalRoutes: Object.keys(routes).length,
      routeReadFailures,
    });
    // #endregion
    
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
    // #region agent log
    await debugLog('post-fix', 'H1', 'src/services/css/CssService.ts:257', 'CssService execute completed', {
      generatedFiles: generatedFiles.map((f) => f.path),
      generatedCount: generatedFiles.length,
    });
    // #endregion
    
    return { files: generatedFiles };
  }
  
  async dispose(): Promise<void> {
    // No cleanup required
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
  
}
