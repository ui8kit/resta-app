import type { IService, IServiceContext } from '../../core/interfaces';
import { join, dirname, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Input for route rendering
 */
export interface RenderRouteInput {
  type: 'route';
  entryPath: string;
  routePath: string;
}

/**
 * Input for component rendering
 */
export interface RenderComponentInput {
  type: 'component';
  modulePath: string;
  exportName?: string;
  props?: Record<string, unknown>;
}

/**
 * Combined input type
 */
export type RenderServiceInput = RenderRouteInput | RenderComponentInput;

/**
 * Output from RenderService.execute()
 */
export interface RenderServiceOutput {
  html: string;
  componentName?: string;
}

/**
 * File system interface for RenderService
 */
export interface RenderFileSystem {
  readFile(path: string): Promise<string>;
  exists(path: string): Promise<boolean>;
}

/**
 * React renderer interface (abstracted for testing)
 */
export interface ReactRenderer {
  renderToStaticMarkup(element: unknown): string;
  createElement(component: unknown, props?: Record<string, unknown>): unknown;
}

/**
 * Module loader interface (abstracted for testing)
 */
export interface ModuleLoader {
  loadModule(modulePath: string): Promise<Record<string, unknown>>;
}

/**
 * Custom router parser function type.
 * Takes the entry file content and returns a map of route paths to component names.
 */
export type RouterParser = (source: string) => Map<string, string>;

/**
 * RenderService options
 */
export interface RenderServiceOptions {
  fileSystem?: RenderFileSystem;
  reactRenderer?: ReactRenderer;
  moduleLoader?: ModuleLoader;
  /**
   * Custom router parser for non-standard router configurations.
   * If not provided, uses default React Router v6+ parser.
   */
  routerParser?: RouterParser;
}

/**
 * Import info structure
 */
interface ImportInfo {
  specifier: string;
  isNamed: boolean;
}

/**
 * RenderService - Renders React components to static HTML.
 * 
 * Replaces the @ui8kit/render package functionality.
 * 
 * Responsibilities:
 * - Parse router configuration from entry files
 * - Render React routes to HTML
 * - Render individual components to HTML
 * - Resolve import paths and load modules
 */
export class RenderService implements IService<RenderServiceInput, RenderServiceOutput> {
  readonly name = 'render';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = [];
  
  private context!: IServiceContext;
  private fs: RenderFileSystem;
  private react: ReactRenderer;
  private loader: ModuleLoader;
  private customRouterParser?: RouterParser;
  
  // Caches
  private importsCache: Map<string, Map<string, ImportInfo>> = new Map();
  private routesCache: Map<string, Map<string, string>> = new Map();
  
  constructor(options: RenderServiceOptions = {}) {
    this.fs = options.fileSystem ?? this.createDefaultFileSystem();
    this.react = options.reactRenderer ?? this.createDefaultReactRenderer();
    this.loader = options.moduleLoader ?? this.createDefaultModuleLoader();
    this.customRouterParser = options.routerParser;
  }
  
  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }
  
  async execute(input: RenderServiceInput): Promise<RenderServiceOutput> {
    if (input.type === 'route') {
      return this.renderRoute(input);
    } else {
      return this.renderComponent(input);
    }
  }
  
  async dispose(): Promise<void> {
    this.importsCache.clear();
    this.routesCache.clear();
  }
  
  /**
   * Get cache size (for testing)
   */
  getCacheSize(): number {
    return this.importsCache.size + this.routesCache.size;
  }
  
  /**
   * Render a route to HTML
   */
  private async renderRoute(input: RenderRouteInput): Promise<RenderServiceOutput> {
    const { entryPath, routePath } = input;
    
    try {
      // Parse router configuration
      const { imports, routes } = await this.parseRouterConfig(entryPath);
      
      // Get component name for this route
      const normalizedPath = this.normalizeRoutePath(routePath);
      const componentName = routes.get(normalizedPath);
      
      if (!componentName) {
        this.context.logger.warn(`Route ${routePath} not found in router configuration`);
        return { html: '' };
      }
      
      // Load and render component
      const Component = await this.loadComponent(entryPath, componentName, imports);
      if (!Component) {
        this.context.logger.warn(`Component ${componentName} could not be loaded`);
        return { html: '' };
      }
      
      // Render component
      const element = this.react.createElement(Component);
      const html = this.react.renderToStaticMarkup(element);
      
      this.context.eventBus.emit('render:route', {
        routePath,
        componentName,
        htmlSize: html.length,
      });
      
      return { html, componentName };
    } catch (error) {
      this.context.logger.error(`Failed to render route ${routePath}:`, error);
      return { html: '' };
    }
  }
  
  /**
   * Render a component to HTML
   */
  private async renderComponent(input: RenderComponentInput): Promise<RenderServiceOutput> {
    const { modulePath, exportName, props = {} } = input;
    
    const absModulePath = isAbsolute(modulePath)
      ? modulePath
      : join(process.cwd(), modulePath);
    
    const mod = await this.loader.loadModule(absModulePath);
    
    const Component = exportName ? mod[exportName] : mod.default;
    if (!Component) {
      const available = Object.keys(mod).sort().join(', ') || '(none)';
      throw new Error(
        `Component export not found. modulePath=${modulePath} exportName=${exportName ?? 'default'} availableExports=${available}`
      );
    }
    
    const element = this.react.createElement(Component as any, props);
    const html = this.react.renderToStaticMarkup(element);
    
    this.context.eventBus.emit('render:component', {
      modulePath,
      exportName,
      htmlSize: html.length,
    });
    
    return { html, componentName: exportName };
  }
  
  /**
   * Parse router configuration from entry file
   */
  private async parseRouterConfig(entryPath: string): Promise<{
    imports: Map<string, ImportInfo>;
    routes: Map<string, string>;
  }> {
    const cacheKey = entryPath;
    
    // Check cache
    if (this.importsCache.has(cacheKey) && this.routesCache.has(cacheKey)) {
      return {
        imports: this.importsCache.get(cacheKey)!,
        routes: this.routesCache.get(cacheKey)!,
      };
    }
    
    const absEntryPath = isAbsolute(entryPath) 
      ? entryPath 
      : join(process.cwd(), entryPath);
    const fileContent = await this.fs.readFile(absEntryPath);
    
    const imports = this.parseImports(fileContent);
    const routes = this.customRouterParser 
      ? this.customRouterParser(fileContent) 
      : this.parseRoutes(fileContent);
    
    // Cache results
    this.importsCache.set(cacheKey, imports);
    this.routesCache.set(cacheKey, routes);
    
    return { imports, routes };
  }
  
  /**
   * Parse imports from source code
   */
  parseImports(source: string): Map<string, ImportInfo> {
    const map = new Map<string, ImportInfo>();
    
    // Default imports: import Component from 'path'
    const defaultImportRegex = /import\s+([A-Za-z0-9_]+)\s+from\s+['"]([^'"]+)['"];?/g;
    let match: RegExpExecArray | null;
    while ((match = defaultImportRegex.exec(source)) !== null) {
      map.set(match[1], { specifier: match[2], isNamed: false });
    }
    
    // Named imports: import { Component } from 'path'
    const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g;
    while ((match = namedImportRegex.exec(source)) !== null) {
      const importsList = match[1];
      const spec = match[2];
      const componentNames = importsList.split(',').map(name => name.trim()).filter(name => name.length > 0);
      for (const name of componentNames) {
        // Handle "as" alias: { Foo as Bar }
        const aliasMatch = name.match(/^(\w+)\s+as\s+(\w+)$/);
        const finalName = aliasMatch ? aliasMatch[2] : name;
        map.set(finalName, { specifier: spec, isNamed: true });
      }
    }
    
    return map;
  }
  
  /**
   * Parse routes from router configuration.
   * 
   * Supports React Router v6+ format with createBrowserRouter:
   * - { index: true, element: <Component /> }
   * - { path: 'route', element: <Component /> }
   * 
   * For other router formats, provide a custom router parser via RenderServiceOptions.
   */
  parseRoutes(source: string): Map<string, string> {
    const map = new Map<string, string>();
    
    // Extract children array from createBrowserRouter (React Router v6+ format)
    // Pattern matches: children: [ ... ]
    const childrenBlockRegex = /children:\s*\[([\s\S]*?)\]/m;
    const blockMatch = childrenBlockRegex.exec(source);
    if (!blockMatch) return map;
    
    const block = blockMatch[1];
    
    // Match route entries in React Router format:
    // { index: true, element: <Home /> }
    // { path: 'about', element: <About /> }
    // Pattern is flexible with whitespace and optional trailing commas
    const routeEntryRegex = /\{\s*(index:\s*true|path:\s*['"]([^'"]+)['"])\s*,\s*element:\s*<\s*([A-Za-z0-9_]+)\s*\/>/g;
    let match: RegExpExecArray | null;
    while ((match = routeEntryRegex.exec(block)) !== null) {
      const isIndex = match[1] && match[1].includes('index');
      const pathVal = isIndex ? '/' : `/${match[2]}`;
      const componentName = match[3];
      map.set(pathVal, componentName);
    }
    
    return map;
  }
  
  /**
   * Load component by name
   */
  private async loadComponent(
    entryPath: string,
    componentName: string,
    imports: Map<string, ImportInfo>
  ): Promise<unknown> {
    const entryDir = dirname(isAbsolute(entryPath) ? entryPath : join(process.cwd(), entryPath));
    const importInfo = imports.get(componentName);
    
    if (!importInfo) {
      throw new Error(`Import for component ${componentName} not found`);
    }
    
    const absModulePath = await this.resolveImportPath(entryDir, importInfo.specifier);
    const mod = await this.loader.loadModule(absModulePath);
    
    return importInfo.isNamed ? mod[componentName] : mod.default;
  }
  
  /**
   * Resolve import path to file
   */
  async resolveImportPath(entryDir: string, specifier: string): Promise<string> {
    let base: string;
    
    if (specifier.startsWith('@/')) {
      // Alias - resolve relative to src directory
      base = join(entryDir, specifier.slice(2));
    } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
      base = join(entryDir, specifier);
    } else {
      // External module - return as-is for loader
      return specifier;
    }
    
    const candidates = [
      `${base}.tsx`, `${base}.ts`, `${base}.jsx`, `${base}.js`,
      join(base, 'index.tsx'), join(base, 'index.ts'),
      join(base, 'index.jsx'), join(base, 'index.js'),
    ];
    
    for (const candidate of candidates) {
      if (await this.fs.exists(candidate)) {
        return candidate;
      }
    }
    
    throw new Error(`Unable to resolve file for import ${specifier}`);
  }
  
  /**
   * Normalize route path
   */
  private normalizeRoutePath(routePath: string): string {
    return routePath === '/' ? '/' : (routePath.startsWith('/') ? routePath : `/${routePath}`);
  }
  
  /**
   * Create default file system
   */
  private createDefaultFileSystem(): RenderFileSystem {
    return {
      readFile: async (path: string) => {
        const { readFile } = await import('node:fs/promises');
        return readFile(path, 'utf-8');
      },
      exists: async (path: string) => {
        const { access } = await import('node:fs/promises');
        try {
          await access(path);
          return true;
        } catch {
          return false;
        }
      },
    };
  }
  
  /**
   * Create default React renderer
   */
  private createDefaultReactRenderer(): ReactRenderer {
    // Lazy load React to avoid issues in non-React environments
    let React: any;
    let ReactDOMServer: any;
    
    return {
      renderToStaticMarkup: (element: unknown) => {
        if (!ReactDOMServer) {
          ReactDOMServer = require('react-dom/server');
        }
        return ReactDOMServer.renderToStaticMarkup(element);
      },
      createElement: (component: unknown, props?: Record<string, unknown>) => {
        if (!React) {
          React = require('react');
        }
        return React.createElement(component, props ?? {});
      },
    };
  }
  
  /**
   * Create default module loader
   */
  private createDefaultModuleLoader(): ModuleLoader {
    return {
      loadModule: async (modulePath: string) => {
        const moduleUrl = pathToFileURL(modulePath).href;
        return import(moduleUrl);
      },
    };
  }
}
