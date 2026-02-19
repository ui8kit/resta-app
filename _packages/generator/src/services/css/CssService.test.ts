import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CssService } from './CssService';
import { HtmlConverterService } from '../html-converter';
import type { IServiceContext, GeneratorConfig } from '../../core/interfaces';
import { createMockLogger } from '../../../test/setup';

// Mock HtmlConverterService
function createMockHtmlConverter() {
  const executeMock = vi.fn().mockResolvedValue({
    applyCss: '.test { @apply bg-red-500; }',
    pureCss: '.test { background-color: red; }',
    elementsCount: 1,
    selectorsCount: 1,
  });
  
  return {
    name: 'html-converter',
    version: '1.0.0',
    dependencies: [],
    initialize: vi.fn().mockResolvedValue(undefined),
    execute: executeMock,
    dispose: vi.fn().mockResolvedValue(undefined),
  } as unknown as HtmlConverterService & { execute: typeof executeMock };
}

// Mock file system
function createMockFs() {
  const files = new Map<string, string>();
  
  return {
    files,
    readFile: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
      if (files.has(normalized)) {
        return files.get(normalized)!;
      }
      for (const [key, value] of files.entries()) {
        if (normalized.endsWith(key) || key.endsWith(normalized)) {
          return value;
        }
      }
      throw new Error(`ENOENT: ${path}`);
    }),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
  };
}

// Mock context factory
function createMockContext(config: Partial<GeneratorConfig> = {}): IServiceContext {
  const fullConfig: GeneratorConfig = {
    app: { name: 'Test', lang: 'en' },
    mappings: {
      ui8kitMap: './src/lib/ui8kit.map.json',
    },
    css: {
      entryPath: './src/main.tsx',
      routes: ['/'],
      outputDir: './dist/css',
      pureCss: true,
    },
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

describe('CssService', () => {
  let service: CssService;
  let mockFs: ReturnType<typeof createMockFs>;
  let mockHtmlConverter: ReturnType<typeof createMockHtmlConverter>;
  
  beforeEach(() => {
    mockFs = createMockFs();
    mockHtmlConverter = createMockHtmlConverter();
    
    // Set up view files
    mockFs.files.set('views/pages/index.liquid', '<div class="bg-red-500" data-class="test">Hello</div>');
    
    service = new CssService({
      fileSystem: {
        readFile: mockFs.readFile,
        writeFile: mockFs.writeFile,
        mkdir: mockFs.mkdir,
        readdir: mockFs.readdir,
      },
      htmlConverter: mockHtmlConverter,
    });
  });
  
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('css');
    });
    
    it('should have version', () => {
      expect(service.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
    
    it('should depend on view service', () => {
      expect(service.dependencies).toContain('view');
    });
  });
  
  describe('initialize', () => {
    it('should initialize without error', async () => {
      const context = createMockContext();
      
      await expect(service.initialize(context)).resolves.not.toThrow();
    });
    
    it('should use HtmlConverterService from registry if available', async () => {
      const registryConverter = createMockHtmlConverter();
      const context = createMockContext();
      (context.registry as any).has = vi.fn().mockReturnValue(true);
      (context.registry as any).resolve = vi.fn().mockReturnValue(registryConverter);
      
      await service.initialize(context);
      
      // Execute to verify it uses the registry converter
      const input = {
        viewsDir: './views',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
      };
      
      await service.execute(input);
      
      expect(registryConverter.execute).toHaveBeenCalled();
    });
  });
  
  describe('execute', () => {
    beforeEach(async () => {
      await service.initialize(createMockContext());
    });
    
    it('should create output directory', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: true,
      };
      
      await service.execute(input);
      
      expect(mockFs.mkdir).toHaveBeenCalledWith('./dist/css');
    });
    
    it('should process each route view file', async () => {
      mockFs.files.set('views/pages/index.liquid', '<div class="test">Home</div>');
      mockFs.files.set('views/pages/about.liquid', '<div class="test">About</div>');
      
      const input = {
        viewsDir: './views',
        outputDir: './dist/css',
        routes: {
          '/': { title: 'Home' },
          '/about': { title: 'About' },
        },
        pureCss: true,
      };
      
      await service.execute(input);
      
      expect(mockHtmlConverter.execute).toHaveBeenCalledTimes(2);
    });
    
    it('should generate tailwind.apply.css', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: false,
      };
      
      await service.execute(input);
      
      // Normalize paths for cross-platform
      const writeCalls = mockFs.writeFile.mock.calls.map(call => 
        [(call[0] as string).replace(/\\/g, '/'), call[1]]
      );
      
      expect(writeCalls).toContainEqual([
        expect.stringContaining('tailwind.apply.css'),
        expect.any(String)
      ]);
    });
    
    it('should generate ui8kit.local.css when pureCss is true', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: true,
      };
      
      await service.execute(input);
      
      // Normalize paths for cross-platform
      const writeCalls = mockFs.writeFile.mock.calls.map(call => 
        [(call[0] as string).replace(/\\/g, '/'), call[1]]
      );
      
      expect(writeCalls).toContainEqual([
        expect.stringContaining('ui8kit.local.css'),
        expect.any(String)
      ]);
    });
    
    it('should emit css:generated event', async () => {
      const context = createMockContext();
      await service.initialize(context);
      
      const input = {
        viewsDir: './views',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: true,
      };
      
      await service.execute(input);
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'css:generated',
        expect.objectContaining({
          path: expect.any(String),
          size: expect.any(Number),
        })
      );
    });
    
    it('should return generated file info', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: true,
      };
      
      const result = await service.execute(input);
      
      expect(result.files).toContainEqual(
        expect.objectContaining({
          path: expect.stringContaining('tailwind.apply.css'),
          size: expect.any(Number),
        })
      );
    });
    
    it('should also process partials and layouts directories', async () => {
      // Mock readdir to return file entries for partials/layouts
      mockFs.readdir = vi.fn().mockImplementation(async (path: string) => {
        const normalized = path.replace(/\\/g, '/');
        if (normalized.includes('partials')) {
          return [{ name: 'header.liquid', isFile: () => true }];
        }
        if (normalized.includes('layouts')) {
          return [{ name: 'layout.liquid', isFile: () => true }];
        }
        return [];
      });
      
      mockFs.files.set('views/partials/header.liquid', '<header class="header">Header</header>');
      mockFs.files.set('views/layouts/layout.liquid', '<html class="layout">Layout</html>');
      
      const input = {
        viewsDir: './views',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: true,
      };
      
      // Re-create service with updated mock
      service = new CssService({
        fileSystem: {
          readFile: mockFs.readFile,
          writeFile: mockFs.writeFile,
          mkdir: mockFs.mkdir,
          readdir: mockFs.readdir,
        },
        htmlConverter: mockHtmlConverter,
      });
      await service.initialize(createMockContext());
      
      await service.execute(input);
      
      // Should process pages + partials + layouts (3 total)
      expect((mockHtmlConverter.execute as any).mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('dispose', () => {
    it('should dispose without error', async () => {
      await service.initialize(createMockContext());
      
      await expect(service.dispose()).resolves.not.toThrow();
    });
  });
});
