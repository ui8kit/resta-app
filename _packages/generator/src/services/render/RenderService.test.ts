import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RenderService } from './RenderService';
import type { IServiceContext, GeneratorConfig } from '../../core/interfaces';
import { createMockLogger } from '../../../test/setup';

// Mock context factory
function createMockContext(config: Partial<GeneratorConfig> = {}): IServiceContext {
  const fullConfig: GeneratorConfig = {
    app: { name: 'Test', lang: 'en' },
    css: { entryPath: './src/main.tsx', routes: ['/'], outputDir: './dist/css' },
    html: {
      viewsDir: './views',
      routes: { '/': { title: 'Home' } },
      outputDir: './dist/html',
    },
    ...config,
  };
  
  return {
    config: fullConfig,
    logger: createMockLogger(),
    eventBus: {
      emit: vi.fn(),
      on: vi.fn().mockReturnValue(() => {}),
      once: vi.fn(),
      off: vi.fn(),
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn().mockReturnValue(0),
    },
    registry: {
      has: vi.fn().mockReturnValue(false),
      resolve: vi.fn(),
      register: vi.fn(),
      getServiceNames: vi.fn().mockReturnValue([]),
      getInitializationOrder: vi.fn().mockReturnValue([]),
      initializeAll: vi.fn().mockResolvedValue(undefined),
      disposeAll: vi.fn().mockResolvedValue(undefined),
    },
  };
}

// Mock file system
function createMockRenderFs() {
  const files = new Map<string, string>();
  
  return {
    files,
    readFile: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
      const content = files.get(normalized);
      if (!content) throw new Error(`ENOENT: ${path}`);
      return content;
    }),
    exists: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
      return files.has(normalized);
    }),
  };
}

describe('RenderService', () => {
  let service: RenderService;
  let mockFs: ReturnType<typeof createMockRenderFs>;
  let mockReactRenderer: {
    renderToStaticMarkup: ReturnType<typeof vi.fn>;
    createElement: ReturnType<typeof vi.fn>;
  };
  let mockModuleLoader: {
    loadModule: ReturnType<typeof vi.fn>;
  };
  
  beforeEach(() => {
    mockFs = createMockRenderFs();
    mockReactRenderer = {
      renderToStaticMarkup: vi.fn().mockReturnValue('<div data-class="test">Hello</div>'),
      createElement: vi.fn().mockReturnValue({ type: 'div' }),
    };
    mockModuleLoader = {
      loadModule: vi.fn().mockResolvedValue({ default: () => null }),
    };
    
    service = new RenderService({
      fileSystem: mockFs,
      reactRenderer: mockReactRenderer,
      moduleLoader: mockModuleLoader,
    });
  });
  
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('render');
    });
    
    it('should have version', () => {
      expect(service.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
    
    it('should have no dependencies', () => {
      expect(service.dependencies).toEqual([]);
    });
  });
  
  describe('initialize', () => {
    it('should initialize without error', async () => {
      const context = createMockContext();
      await expect(service.initialize(context)).resolves.not.toThrow();
    });
  });
  
  describe('parseImports', () => {
    it('should parse default imports', () => {
      const source = `
        import HomePage from './pages/Home';
        import AboutPage from './pages/About';
      `;
      
      const imports = service.parseImports(source);
      
      expect(imports.get('HomePage')).toEqual({
        specifier: './pages/Home',
        isNamed: false,
      });
      expect(imports.get('AboutPage')).toEqual({
        specifier: './pages/About',
        isNamed: false,
      });
    });
    
    it('should parse named imports', () => {
      const source = `
        import { Header, Footer } from './components';
        import { Sidebar } from './layout';
      `;
      
      const imports = service.parseImports(source);
      
      expect(imports.get('Header')).toEqual({
        specifier: './components',
        isNamed: true,
      });
      expect(imports.get('Footer')).toEqual({
        specifier: './components',
        isNamed: true,
      });
      expect(imports.get('Sidebar')).toEqual({
        specifier: './layout',
        isNamed: true,
      });
    });
    
    it('should handle mixed imports', () => {
      const source = `
        import React from 'react';
        import { useState, useEffect } from 'react';
        import HomePage from './pages/Home';
      `;
      
      const imports = service.parseImports(source);
      
      expect(imports.get('React')).toEqual({
        specifier: 'react',
        isNamed: false,
      });
      expect(imports.get('useState')).toEqual({
        specifier: 'react',
        isNamed: true,
      });
      expect(imports.get('HomePage')).toEqual({
        specifier: './pages/Home',
        isNamed: false,
      });
    });
  });
  
  describe('parseRoutes', () => {
    it('should parse index route', () => {
      const source = `
        const router = createBrowserRouter([{
          path: '/',
          element: <Layout />,
          children: [
            { index: true, element: <HomePage /> },
          ]
        }]);
      `;
      
      const routes = service.parseRoutes(source);
      
      expect(routes.get('/')).toBe('HomePage');
    });
    
    it('should parse path routes', () => {
      const source = `
        const router = createBrowserRouter([{
          path: '/',
          element: <Layout />,
          children: [
            { index: true, element: <HomePage /> },
            { path: 'about', element: <AboutPage /> },
            { path: 'contact', element: <ContactPage /> },
          ]
        }]);
      `;
      
      const routes = service.parseRoutes(source);
      
      expect(routes.get('/')).toBe('HomePage');
      expect(routes.get('/about')).toBe('AboutPage');
      expect(routes.get('/contact')).toBe('ContactPage');
    });
    
    it('should handle empty children array', () => {
      const source = `
        const router = createBrowserRouter([{
          path: '/',
          element: <Layout />,
        }]);
      `;
      
      const routes = service.parseRoutes(source);
      
      expect(routes.size).toBe(0);
    });
  });
  
  describe('custom router parser', () => {
    it('should use custom router parser when provided', async () => {
      const customParser = vi.fn().mockReturnValue(new Map([
        ['/', 'CustomHome'],
        ['/custom', 'CustomPage'],
      ]));
      
      const customService = new RenderService({
        fileSystem: mockFs,
        reactRenderer: mockReactRenderer,
        moduleLoader: mockModuleLoader,
        routerParser: customParser,
      });
      
      // Set up entry file
      const cwd = process.cwd().replace(/\\/g, '/');
      mockFs.files.set(`${cwd}/src/custom.tsx`, 'some custom router format');
      mockFs.readFile = vi.fn(async () => 'some custom router format');
      mockFs.exists.mockResolvedValue(true);
      
      await customService.initialize(createMockContext());
      
      await customService.execute({
        type: 'route',
        entryPath: './src/custom.tsx',
        routePath: '/',
      });
      
      expect(customParser).toHaveBeenCalledWith('some custom router format');
    });
  });
  
  describe('resolveImportPath', () => {
    beforeEach(() => {
      // Set up mock files
      mockFs.files.set('src/pages/Home.tsx', 'export default function Home() {}');
      mockFs.files.set('src/components/index.ts', 'export * from "./Button"');
    });
    
    it('should resolve relative paths with .tsx extension', async () => {
      mockFs.exists.mockImplementation(async (path: string) => {
        return path.includes('Home.tsx');
      });
      
      const resolved = await service.resolveImportPath('/project/src', './pages/Home');
      
      expect(resolved).toContain('Home.tsx');
    });
    
    it('should resolve @/ alias paths', async () => {
      mockFs.exists.mockImplementation(async (path: string) => {
        return path.includes('Button.tsx');
      });
      
      const resolved = await service.resolveImportPath('/project/src', '@/components/Button');
      
      expect(resolved).toContain('Button.tsx');
    });
    
    it('should throw for unresolvable paths', async () => {
      mockFs.exists.mockResolvedValue(false);
      
      await expect(
        service.resolveImportPath('/project/src', './nonexistent')
      ).rejects.toThrow('Unable to resolve');
    });
  });
  
  describe('execute - renderRoute', () => {
    const entryContent = `
      import HomePage from './pages/Home';
      import AboutPage from './pages/About';
      
      const router = createBrowserRouter([{
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'about', element: <AboutPage /> },
        ]
      }]);
    `;
    
    beforeEach(async () => {
      // Reset mocks
      mockFs.files.clear();
      
      // Set up entry file - use absolute path format
      const cwd = process.cwd().replace(/\\/g, '/');
      mockFs.files.set(`${cwd}/src/main.tsx`, entryContent);
      mockFs.files.set('src/main.tsx', entryContent);
      
      // Update readFile to handle absolute paths
      mockFs.readFile = vi.fn(async (path: string) => {
        const normalized = path.replace(/\\/g, '/');
        // Try various path formats
        for (const [key, value] of mockFs.files.entries()) {
          if (normalized.endsWith(key) || normalized === key) {
            return value;
          }
        }
        throw new Error(`ENOENT: ${path}`);
      });
      
      mockFs.exists.mockImplementation(async (path: string) => {
        return path.includes('.tsx') || path.includes('.ts');
      });
      
      // Recreate service with updated mock
      service = new RenderService({
        fileSystem: mockFs,
        reactRenderer: mockReactRenderer,
        moduleLoader: mockModuleLoader,
      });
      
      await service.initialize(createMockContext());
    });
    
    it('should render route to HTML', async () => {
      const result = await service.execute({
        type: 'route',
        entryPath: './src/main.tsx',
        routePath: '/',
      });
      
      expect(result.html).toBeDefined();
      expect(mockReactRenderer.renderToStaticMarkup).toHaveBeenCalled();
    });
    
    it('should return empty string for unknown route', async () => {
      const result = await service.execute({
        type: 'route',
        entryPath: './src/main.tsx',
        routePath: '/unknown',
      });
      
      expect(result.html).toBe('');
    });
    
    it('should emit render:route event', async () => {
      const context = createMockContext();
      
      // Recreate service with new context
      service = new RenderService({
        fileSystem: mockFs,
        reactRenderer: mockReactRenderer,
        moduleLoader: mockModuleLoader,
      });
      await service.initialize(context);
      
      await service.execute({
        type: 'route',
        entryPath: './src/main.tsx',
        routePath: '/',
      });
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'render:route',
        expect.objectContaining({
          routePath: '/',
        })
      );
    });
  });
  
  describe('execute - renderComponent', () => {
    beforeEach(async () => {
      await service.initialize(createMockContext());
      
      mockFs.exists.mockResolvedValue(true);
      mockModuleLoader.loadModule.mockResolvedValue({
        default: () => null,
        Header: () => null,
      });
    });
    
    it('should render component with default export', async () => {
      const result = await service.execute({
        type: 'component',
        modulePath: './src/components/Header.tsx',
      });
      
      expect(result.html).toBeDefined();
      expect(mockReactRenderer.renderToStaticMarkup).toHaveBeenCalled();
    });
    
    it('should render component with named export', async () => {
      const result = await service.execute({
        type: 'component',
        modulePath: './src/components/Header.tsx',
        exportName: 'Header',
      });
      
      expect(result.html).toBeDefined();
    });
    
    it('should pass props to component', async () => {
      await service.execute({
        type: 'component',
        modulePath: './src/components/Header.tsx',
        props: { title: 'Test Title' },
      });
      
      expect(mockReactRenderer.createElement).toHaveBeenCalledWith(
        expect.any(Function),
        { title: 'Test Title' }
      );
    });
    
    it('should throw for missing export', async () => {
      mockModuleLoader.loadModule.mockResolvedValue({
        default: null,
      });
      
      await expect(
        service.execute({
          type: 'component',
          modulePath: './src/components/Missing.tsx',
        })
      ).rejects.toThrow('not found');
    });
    
    it('should emit render:component event', async () => {
      const context = createMockContext();
      await service.initialize(context);
      
      await service.execute({
        type: 'component',
        modulePath: './src/components/Header.tsx',
      });
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'render:component',
        expect.objectContaining({
          modulePath: './src/components/Header.tsx',
        })
      );
    });
  });
  
  describe('dispose', () => {
    it('should dispose without error', async () => {
      await service.initialize(createMockContext());
      await expect(service.dispose()).resolves.not.toThrow();
    });
    
    it('should clear internal caches', async () => {
      await service.initialize(createMockContext());
      
      // Populate cache by parsing
      mockFs.files.set('src/main.tsx', `
        import HomePage from './pages/Home';
        const router = createBrowserRouter([{
          children: [{ index: true, element: <HomePage /> }]
        }]);
      `);
      
      await service.execute({
        type: 'route',
        entryPath: './src/main.tsx',
        routePath: '/',
      });
      
      await service.dispose();
      
      // After dispose, caches should be cleared
      expect(service.getCacheSize()).toBe(0);
    });
  });
});
