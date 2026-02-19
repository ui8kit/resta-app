import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewService } from './ViewService';
import type { IServiceContext, GeneratorConfig } from '../../core/interfaces';
import { createMockFileSystem, createMockLogger } from '../../../test/setup';

// Mock context factory
function createMockContext(config: Partial<GeneratorConfig> = {}): IServiceContext {
  const fullConfig: GeneratorConfig = {
    app: { name: 'Test', lang: 'en' },
    css: { entryPath: './src/main.tsx', routes: ['/'], outputDir: './dist/css' },
    html: {
      viewsDir: './views',
      routes: {
        '/': { title: 'Home' },
        '/about': { title: 'About' },
      },
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

describe('ViewService', () => {
  let service: ViewService;
  let mockFs: ReturnType<typeof createMockFileSystem>;
  let mockRenderer: {
    renderRoute: ReturnType<typeof vi.fn>;
    renderComponent: ReturnType<typeof vi.fn>;
  };
  
  beforeEach(() => {
    mockFs = createMockFileSystem();
    mockRenderer = {
      renderRoute: vi.fn().mockResolvedValue('<div data-class="test">Hello</div>'),
      renderComponent: vi.fn().mockResolvedValue('<header>Header</header>'),
    };
    
    service = new ViewService({
      fileSystem: {
        writeFile: mockFs.writeFile,
        mkdir: mockFs.mkdir,
        readdir: mockFs.readdir,
      },
      renderer: mockRenderer,
    });
  });
  
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('view');
    });
    
    it('should have version', () => {
      expect(service.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
    
    it('should depend on layout service', () => {
      expect(service.dependencies).toContain('layout');
    });
  });
  
  describe('initialize', () => {
    it('should initialize without error', async () => {
      const context = createMockContext();
      
      await expect(service.initialize(context)).resolves.not.toThrow();
    });
  });
  
  describe('execute', () => {
    beforeEach(async () => {
      await service.initialize(createMockContext());
    });
    
    it('should generate view for each route', async () => {
      const input = {
        entryPath: './src/main.tsx',
        viewsDir: './views',
        routes: {
          '/': { title: 'Home' },
          '/about': { title: 'About' },
        },
      };
      
      await service.execute(input);
      
      expect(mockRenderer.renderRoute).toHaveBeenCalledTimes(2);
    });
    
    it('should create pages directory', async () => {
      const input = {
        entryPath: './src/main.tsx',
        viewsDir: './views',
        routes: { '/': { title: 'Home' } },
      };
      
      await service.execute(input);
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('pages')
      );
    });
    
    it('should write liquid files for routes', async () => {
      const input = {
        entryPath: './src/main.tsx',
        viewsDir: './views',
        routes: { '/': { title: 'Home' } },
      };
      
      await service.execute(input);
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('index.liquid'),
        expect.any(String)
      );
    });
    
    it('should emit view:generated event for each route', async () => {
      const context = createMockContext();
      await service.initialize(context);
      
      const input = {
        entryPath: './src/main.tsx',
        viewsDir: './views',
        routes: { '/': { title: 'Home' } },
      };
      
      await service.execute(input);
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'view:generated',
        expect.objectContaining({
          route: '/',
          path: expect.any(String),
        })
      );
    });
    
    it('should return list of generated views', async () => {
      const input = {
        entryPath: './src/main.tsx',
        viewsDir: './views',
        routes: {
          '/': { title: 'Home' },
          '/about': { title: 'About' },
        },
      };
      
      const result = await service.execute(input);
      
      expect(result.views).toHaveLength(2);
      expect(result.views[0]).toMatchObject({
        route: expect.any(String),
        path: expect.any(String),
      });
    });
    
    it('should handle route path to filename conversion', async () => {
      const input = {
        entryPath: './src/main.tsx',
        viewsDir: './views',
        routes: {
          '/': { title: 'Home' },
          '/about': { title: 'About' },
          '/docs/getting-started': { title: 'Getting Started' },
        },
      };
      
      await service.execute(input);
      
      // Normalize paths for cross-platform comparison
      const writeCalls = mockFs.writeFile.mock.calls.map(call => 
        (call[0] as string).replace(/\\/g, '/')
      );
      
      expect(writeCalls).toContainEqual(expect.stringContaining('index.liquid'));
      expect(writeCalls).toContainEqual(expect.stringContaining('about.liquid'));
      expect(writeCalls).toContainEqual(expect.stringContaining('docs/getting-started.liquid'));
    });
  });
  
  describe('generatePartials', () => {
    beforeEach(async () => {
      await service.initialize(createMockContext({
        html: {
          viewsDir: './views',
          routes: { '/': { title: 'Home' } },
          outputDir: './dist/html',
          partials: {
            sourceDir: './src/partials',
            outputDir: 'partials',
          },
        },
      }));
      
      // Mock partials directory contents
      mockFs.files.set('./src/partials/Header.tsx', '');
      mockFs.files.set('./src/partials/Footer.tsx', '');
    });
    
    it('should generate partials when configured', async () => {
      const input = {
        entryPath: './src/main.tsx',
        viewsDir: './views',
        routes: { '/': { title: 'Home' } },
        partials: {
          sourceDir: './src/partials',
          outputDir: 'partials',
        },
      };
      
      await service.execute(input);
      
      // Should have rendered partials
      expect(mockRenderer.renderComponent).toHaveBeenCalled();
    });
  });
  
  describe('dispose', () => {
    it('should dispose without error', async () => {
      await service.initialize(createMockContext());
      
      await expect(service.dispose()).resolves.not.toThrow();
    });
  });
});
