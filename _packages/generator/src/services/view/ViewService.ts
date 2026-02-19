import type { IService, IServiceContext, RouteConfig } from '../../core/interfaces';
import { join, dirname } from 'node:path';
import { RenderService } from '../render';

/**
 * Input for ViewService.execute()
 */
export interface ViewServiceInput {
  entryPath: string;
  viewsDir: string;
  routes: Record<string, RouteConfig>;
  partials?: {
    sourceDir: string;
    outputDir?: string;
    props?: Record<string, Record<string, unknown>>;
  };
}

/**
 * Output from ViewService.execute()
 */
export interface ViewServiceOutput {
  views: Array<{
    route: string;
    path: string;
    size: number;
  }>;
  partials?: Array<{
    name: string;
    path: string;
  }>;
}

/**
 * File system interface for ViewService
 */
export interface ViewFileSystem {
  writeFile(path: string, content: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  readdir(path: string): Promise<string[]>;
}

/**
 * Renderer interface for ViewService
 */
export interface ViewRenderer {
  renderRoute(options: { entryPath: string; routePath: string }): Promise<string>;
  renderComponent(options: { modulePath: string; exportName?: string; props?: Record<string, unknown> }): Promise<string>;
}

/**
 * ViewService options
 */
export interface ViewServiceOptions {
  fileSystem?: ViewFileSystem;
  renderer?: ViewRenderer;
}

/**
 * ViewService - Generates Liquid view files from React components.
 * 
 * Responsibilities:
 * - Render React routes to HTML
 * - Save as Liquid view files
 * - Generate partials from React components
 */
export class ViewService implements IService<ViewServiceInput, ViewServiceOutput> {
  readonly name = 'view';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = ['layout'];
  
  private context!: IServiceContext;
  private fs: ViewFileSystem;
  private renderer: ViewRenderer;
  
  constructor(options: ViewServiceOptions = {}) {
    this.fs = options.fileSystem ?? this.createDefaultFileSystem();
    this.renderer = options.renderer ?? this.createDefaultRenderer();
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }
  
  async execute(input: ViewServiceInput): Promise<ViewServiceOutput> {
    const { entryPath, viewsDir, routes, partials } = input;
    
    const pagesDir = join(viewsDir, 'pages');
    await this.fs.mkdir(pagesDir);
    
    const generatedViews: ViewServiceOutput['views'] = [];
    
    // Generate views for each route
    for (const [routePath, routeConfig] of Object.entries(routes)) {
      try {
        const html = await this.renderer.renderRoute({
          entryPath,
          routePath,
        });
        
        const viewFileName = this.routeToFileName(routePath);
        const viewPath = join(pagesDir, viewFileName);
        
        // Ensure subdirectory exists for nested routes
        await this.fs.mkdir(dirname(viewPath));
        
        await this.fs.writeFile(viewPath, html);
        
        generatedViews.push({
          route: routePath,
          path: viewPath,
          size: html.length,
        });
        
        this.context.eventBus.emit('view:generated', {
          route: routePath,
          path: viewPath,
        });
        
        this.context.logger.info(`Generated view: ${viewPath}`);
      } catch (error) {
        this.context.logger.error(`Failed to generate view for ${routePath}:`, error);
        throw error;
      }
    }
    
    // Generate partials if configured
    let generatedPartials: ViewServiceOutput['partials'];
    if (partials) {
      generatedPartials = await this.generatePartials(viewsDir, partials);
    }
    
    return {
      views: generatedViews,
      partials: generatedPartials,
    };
  }
  
  async dispose(): Promise<void> {
    // No cleanup needed
  }
  
  /**
   * Generate partials from React components
   */
  private async generatePartials(
    viewsDir: string,
    config: NonNullable<ViewServiceInput['partials']>
  ): Promise<Array<{ name: string; path: string }>> {
    const { sourceDir, outputDir = 'partials', props = {} } = config;
    const partialsOutputDir = join(viewsDir, outputDir);
    
    await this.fs.mkdir(partialsOutputDir);
    
    const generated: Array<{ name: string; path: string }> = [];
    
    try {
      const entries = await this.fs.readdir(sourceDir);
      
      for (const entry of entries) {
        // Filter for component files
        const lower = entry.toLowerCase();
        if (!lower.endsWith('.tsx') && !lower.endsWith('.ts') && 
            !lower.endsWith('.jsx') && !lower.endsWith('.js')) {
          continue;
        }
        
        const componentName = entry.replace(/\.(tsx?|jsx?|js)$/i, '');
        const modulePath = join(sourceDir, entry);
        const componentProps = props[componentName] ?? {};
        
        try {
          // Try named export first, then default
          let html: string;
          try {
            html = await this.renderer.renderComponent({
              modulePath,
              exportName: componentName,
              props: componentProps,
            });
          } catch {
            html = await this.renderer.renderComponent({
              modulePath,
              props: componentProps,
            });
          }
          
          // Fix Liquid escaping
          html = this.unescapeLiquidTags(html);
          
          const outputFileName = `${componentName.toLowerCase()}.liquid`;
          const outputPath = join(partialsOutputDir, outputFileName);
          
          const header = `{% comment %} Auto-generated from ${sourceDir}/${entry}. Do not edit manually. {% endcomment %}\n`;
          await this.fs.writeFile(outputPath, header + html + '\n');
          
          generated.push({
            name: componentName,
            path: outputPath,
          });
          
          this.context.logger.info(`Generated partial: ${outputPath}`);
        } catch (error) {
          this.context.logger.warn(`Failed to generate partial ${componentName}:`, error);
        }
      }
    } catch (error) {
      this.context.logger.warn(`Failed to read partials directory ${sourceDir}:`, error);
    }
    
    return generated;
  }
  
  /**
   * Convert route path to view file name
   */
  private routeToFileName(routePath: string): string {
    if (routePath === '/') {
      return 'index.liquid';
    }
    
    // Remove leading slash and add .liquid extension
    const path = routePath.slice(1);
    return `${path}.liquid`;
  }
  
  /**
   * Fix Liquid tag escaping from React rendering
   */
  private unescapeLiquidTags(html: string): string {
    const decode = (s: string) =>
      s
        .replace(/&#x27;|&apos;/g, "'")
        .replace(/&quot;|&#34;/g, '"');

    // Unescape inside Liquid output tags: {{ ... }}
    html = html.replace(/\{\{[\s\S]*?\}\}/g, (m) => decode(m));
    // Unescape inside Liquid statement tags: {% ... %}
    html = html.replace(/\{%\s*[\s\S]*?\s*%\}/g, (m) => decode(m));
    
    return html;
  }
  
  /**
   * Create default file system using Node.js fs
   */
  private createDefaultFileSystem(): ViewFileSystem {
    return {
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
        return readdir(path);
      },
    };
  }
  
  /**
   * Create default renderer using internal RenderService
   */
  private createDefaultRenderer(): ViewRenderer {
    // Create a RenderService instance for use without full DI
    const renderService = new RenderService();
    let initialized = false;
    
    const ensureInitialized = async () => {
      if (!initialized && this.context) {
        await renderService.initialize(this.context);
        initialized = true;
      }
    };
    
    return {
      renderRoute: async (options) => {
        await ensureInitialized();
        const result = await renderService.execute({
          type: 'route',
          entryPath: options.entryPath,
          routePath: options.routePath,
        });
        return result.html;
      },
      renderComponent: async (options) => {
        await ensureInitialized();
        const result = await renderService.execute({
          type: 'component',
          modulePath: options.modulePath,
          exportName: options.exportName,
          props: options.props,
        });
        return result.html;
      },
    };
  }
}
