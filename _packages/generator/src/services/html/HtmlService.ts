import type { IService, IServiceContext, RouteConfig } from '../../core/interfaces';
import { join, dirname } from 'node:path';

/**
 * Input for HtmlService.execute()
 */
export interface HtmlServiceInput {
  viewsDir: string;
  outputDir: string;
  routes: Record<string, RouteConfig>;
  mode?: 'tailwind' | 'semantic' | 'inline';
  stripDataClassInTailwind?: boolean;
  cssOutputDir?: string;
  appConfig: {
    name: string;
    lang?: string;
  };
}

/**
 * Output from HtmlService.execute()
 */
export interface HtmlServiceOutput {
  pages: Array<{
    route: string;
    path: string;
    size: number;
  }>;
}

/**
 * File system interface for HtmlService
 */
export interface HtmlFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

/**
 * Liquid engine interface
 */
export interface LiquidEngine {
  renderFile(template: string, data: Record<string, unknown>): Promise<string>;
  setRoot(root: string): void;
}

/**
 * HtmlService options
 */
export interface HtmlServiceOptions {
  fileSystem?: HtmlFileSystem;
  liquidEngine?: LiquidEngine;
}

/**
 * HtmlService - Generates final HTML pages from Liquid views.
 * 
 * Responsibilities:
 * - Render Liquid views through layout templates
 * - Apply route metadata (title, SEO)
 * - Process HTML based on mode (tailwind/semantic/inline)
 * - Generate final HTML files
 */
export class HtmlService implements IService<HtmlServiceInput, HtmlServiceOutput> {
  readonly name = 'html';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = ['css'];
  
  private context!: IServiceContext;
  private fs: HtmlFileSystem;
  private liquid: LiquidEngine | null = null;
  
  constructor(options: HtmlServiceOptions = {}) {
    this.fs = options.fileSystem ?? this.createDefaultFileSystem();
    if (options.liquidEngine) {
      this.liquid = options.liquidEngine;
    }
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
    
    // Initialize Liquid engine if not provided
    if (!this.liquid) {
      this.liquid = await this.createDefaultLiquidEngine();
    }
  }
  
  async execute(input: HtmlServiceInput): Promise<HtmlServiceOutput> {
    const {
      viewsDir,
      outputDir,
      routes,
      mode = 'tailwind',
      stripDataClassInTailwind = false,
      cssOutputDir,
      appConfig,
    } = input;
    
    // Set Liquid root to views directory
    this.liquid!.setRoot(viewsDir);
    
    // Load CSS for inline mode
    let cssContent: string | undefined;
    if (mode === 'inline' && cssOutputDir) {
      try {
        // Use configured CSS file name or default
        const pureCssFileName = this.context.config ? (this.context.config as any)?.css?.outputFiles?.pureCss ?? 'ui8kit.local.css' : 'ui8kit.local.css';
        const cssPath = join(cssOutputDir, pureCssFileName);
        cssContent = await this.fs.readFile(cssPath);
        this.context.logger.debug(`Loaded CSS for inline mode (${cssContent.length} bytes)`);
      } catch {
        this.context.logger.warn('Could not load CSS for inline mode, falling back to semantic');
      }
    }
    
    const generatedPages: HtmlServiceOutput['pages'] = [];
    
    for (const [routePath, routeConfig] of Object.entries(routes)) {
      try {
        // Load view content
        const viewFileName = this.routeToViewFileName(routePath);
        const viewPath = join(viewsDir, 'pages', viewFileName);
        const viewContent = await this.fs.readFile(viewPath);
        
        // Build template data
        const templateData = {
          content: viewContent,
          title: routeConfig.title,
          meta: this.buildMetaTags(routeConfig, appConfig),
          lang: appConfig.lang ?? 'en',
          name: appConfig.name,
          ...routeConfig.data,
        };
        
        // Render through layout
        let html = await this.liquid!.renderFile('layouts/layout.liquid', templateData);
        
        // Process HTML based on mode
        html = this.processHtmlContent(html, mode, cssContent, stripDataClassInTailwind);
        
        // Determine output path
        const htmlFileName = this.routeToHtmlFileName(routePath);
        const htmlPath = join(outputDir, htmlFileName);
        
        // Ensure directory exists
        await this.fs.mkdir(dirname(htmlPath));
        
        // Write HTML file
        await this.fs.writeFile(htmlPath, html);
        
        generatedPages.push({
          route: routePath,
          path: htmlPath,
          size: html.length,
        });
        
        this.context.eventBus.emit('html:generated', {
          route: routePath,
          path: htmlPath,
          size: html.length,
        });
        
        this.context.logger.info(`Generated HTML: ${htmlPath} (${html.length} bytes)`);
      } catch (error) {
        this.context.logger.error(`Failed to generate HTML for ${routePath}:`, error);
        throw error;
      }
    }
    
    return { pages: generatedPages };
  }
  
  async dispose(): Promise<void> {
    this.liquid = null;
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
   * Convert route path to HTML file name
   */
  private routeToHtmlFileName(routePath: string): string {
    if (routePath === '/') {
      return 'index.html';
    }
    return `${routePath.slice(1)}/index.html`;
  }
  
  /**
   * Build meta tags from route config
   */
  private buildMetaTags(
    route: RouteConfig,
    appConfig: { name: string }
  ): Record<string, string> {
    const meta: Record<string, string> = {};
    
    if (route.seo?.description) {
      meta.description = route.seo.description;
      meta['og:description'] = route.seo.description;
    }
    
    if (route.seo?.keywords) {
      meta.keywords = route.seo.keywords.join(', ');
    }
    
    meta['og:title'] = route.title;
    
    if (route.seo?.image) {
      meta['og:image'] = route.seo.image;
    }
    
    return meta;
  }
  
  /**
   * Process HTML content based on mode
   */
  private processHtmlContent(
    html: string,
    mode: 'tailwind' | 'semantic' | 'inline',
    cssContent?: string,
    stripDataClass?: boolean
  ): string {
    if (mode === 'tailwind') {
      if (stripDataClass) {
        return this.removeDataClassAttributes(html);
      }
      return html;
    }
    
    if (mode === 'semantic' || mode === 'inline') {
      html = this.removeClassAttributes(html);
      html = this.convertDataClassToClass(html);
    }
    
    if (mode === 'inline' && cssContent) {
      html = this.injectInlineStyles(html, this.minifyCss(cssContent));
    }
    
    return html;
  }
  
  /**
   * Remove class attributes from HTML
   */
  private removeClassAttributes(html: string): string {
    return html.replace(/\s+class\s*=\s*["'][^"']*["']/g, '');
  }
  
  /**
   * Remove data-class attributes from HTML
   */
  private removeDataClassAttributes(html: string): string {
    return html.replace(/\s+data-class\s*=\s*["'][^"']*["']/g, '');
  }
  
  /**
   * Convert data-class to class
   */
  private convertDataClassToClass(html: string): string {
    return html.replace(/data-class\s*=\s*["']([^"']*)["']/g, 'class="$1"');
  }
  
  /**
   * Inject inline styles into head
   */
  private injectInlineStyles(html: string, css: string): string {
    return html.replace('</head>', `  <style>${css}</style>\n  </head>`);
  }
  
  /**
   * Simple CSS minification
   */
  private minifyCss(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      .replace(/\s*;\s*/g, ';')
      .replace(/;\s*}/g, '}')
      .trim();
  }
  
  /**
   * Create default file system
   */
  private createDefaultFileSystem(): HtmlFileSystem {
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
    };
  }
  
  /**
   * Create default Liquid engine
   */
  private async createDefaultLiquidEngine(): Promise<LiquidEngine> {
    const { Liquid } = await import('liquidjs');
    const engine = new Liquid({ extname: '.liquid' });
    
    // Register common filters
    engine.registerFilter('json', (value: unknown) => JSON.stringify(value));
    engine.registerFilter('lowercase', (value: string) => value.toLowerCase());
    engine.registerFilter('uppercase', (value: string) => value.toUpperCase());
    
    return {
      renderFile: async (template, data) => engine.renderFile(template, data),
      setRoot: (root: string) => {
        (engine as any).options.root = [root];
      },
    };
  }
}
