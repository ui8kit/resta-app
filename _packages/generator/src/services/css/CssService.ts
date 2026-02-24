import type { IService, IServiceContext, RouteConfig } from '../../core/interfaces';
import { HtmlConverterService } from '../html-converter';
import { join } from 'node:path';
import { emitVariantsApplyCss } from '../../scripts/emit-variants-apply.js';
import { createNodeFileSystem } from '../../core/filesystem';

export interface CssOutputFileNames {
  applyCss?: string;
  pureCss?: string;
  variantsCss?: string;
}

const DEFAULT_CSS_OUTPUT_FILES: Required<CssOutputFileNames> = {
  applyCss: 'tailwind.apply.css',
  pureCss: 'ui8kit.local.css',
  variantsCss: 'variants.apply.css',
};

export interface CssServiceInput {
  htmlDir: string;
  outputDir: string;
  routes: Record<string, RouteConfig>;
  pureCss?: boolean;
  mappings?: {
    ui8kitMap?: string;
    shadcnMap?: string;
  };
  outputFiles?: CssOutputFileNames;
}

export interface CssServiceOutput {
  files: Array<{
    path: string;
    size: number;
    type: 'apply' | 'pure' | 'variants';
  }>;
}

export interface CssFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

export interface CssServiceOptions {
  fileSystem?: CssFileSystem;
}

/**
 * CssService - Generates CSS from HTML files.
 *
 * Reads rendered HTML from htmlDir (output of ReactSsrStage or HtmlStage),
 * extracts classes via HtmlConverterService, and produces:
 *   - tailwind.apply.css
 *   - ui8kit.local.css (if pureCss enabled)
 *   - variants.apply.css
 */
export class CssService implements IService<CssServiceInput, CssServiceOutput> {
  readonly name = 'css';
  readonly version = '2.0.0';
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
    const { htmlDir, outputDir, routes, pureCss = false, outputFiles = {} } = input;

    const cssFileNames: Required<CssOutputFileNames> = { ...DEFAULT_CSS_OUTPUT_FILES, ...outputFiles };

    try {
      await this.fs.mkdir(outputDir);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EEXIST') throw error;
    }

    const allApplyCss: string[] = [];
    const allPureCss: string[] = [];
    const generatedFiles: CssServiceOutput['files'] = [];

    let variantsCss = '';
    try {
      variantsCss = await emitVariantsApplyCss({
        variantsDir: './src/variants',
      });
    } catch {
      this.context.logger.warn('Failed to generate variants.apply.css, using empty output.');
    }
    const variantsPath = join(outputDir, cssFileNames.variantsCss);
    await this.fs.writeFile(variantsPath, variantsCss);
    generatedFiles.push({ path: variantsPath, size: variantsCss.length, type: 'variants' });
    this.context.eventBus.emit('css:generated', { path: variantsPath, size: variantsCss.length });
    this.context.logger.info(`Generated ${variantsPath} (${variantsCss.length} bytes)`);

    for (const routePath of Object.keys(routes)) {
      const htmlFileName = this.routeToHtmlFileName(routePath);
      const htmlPath = join(htmlDir, htmlFileName);

      try {
        const result = await this.htmlConverter.execute({
          htmlPath,
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

    const mergedApplyCss = this.mergeCssFiles(allApplyCss.filter(Boolean));
    const applyCssPath = join(outputDir, cssFileNames.applyCss);
    await this.fs.writeFile(applyCssPath, mergedApplyCss);
    generatedFiles.push({ path: applyCssPath, size: mergedApplyCss.length, type: 'apply' });
    this.context.eventBus.emit('css:generated', { path: applyCssPath, size: mergedApplyCss.length });
    this.context.logger.info(`Generated ${applyCssPath} (${mergedApplyCss.length} bytes)`);

    if (pureCss) {
      const mergedPureCss = this.mergeCssFiles(allPureCss.filter(Boolean));
      const pureCssPath = join(outputDir, cssFileNames.pureCss);
      await this.fs.writeFile(pureCssPath, mergedPureCss);
      generatedFiles.push({ path: pureCssPath, size: mergedPureCss.length, type: 'pure' });
      this.context.eventBus.emit('css:generated', { path: pureCssPath, size: mergedPureCss.length });
      this.context.logger.info(`Generated ${pureCssPath} (${mergedPureCss.length} bytes)`);
    }

    return { files: generatedFiles };
  }

  async dispose(): Promise<void> {}

  private routeToHtmlFileName(routePath: string): string {
    if (routePath === '/') return 'index.html';
    return `${routePath.slice(1)}/index.html`;
  }

  private mergeCssFiles(cssFiles: string[]): string {
    if (cssFiles.length === 0) return '';
    if (cssFiles.length === 1) return cssFiles[0];

    const merged = cssFiles.join('\n\n/* === Next Source === */\n\n');
    return merged.replace(
      /Generated on: .*/,
      `Generated on: ${new Date().toISOString()}`
    );
  }
}
