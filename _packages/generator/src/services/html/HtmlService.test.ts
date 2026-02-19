import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HtmlService } from './HtmlService';
import type { IServiceContext, GeneratorConfig } from '../../core/interfaces';
import { createMockFileSystem, createMockLogger } from '../../../test/setup';

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

describe('HtmlService', () => {
  let service: HtmlService;
  let mockFs: ReturnType<typeof createMockFileSystem>;
  let mockLiquid: {
    renderFile: ReturnType<typeof vi.fn>;
    setRoot: ReturnType<typeof vi.fn>;
  };
  
  beforeEach(() => {
    mockFs = createMockFileSystem();
    mockLiquid = {
      renderFile: vi.fn().mockResolvedValue('<!DOCTYPE html><html><body>Content</body></html>'),
      setRoot: vi.fn(),
    };
    
    // Set up view files (use normalized paths without leading ./)
    mockFs.files.set('views/pages/index.liquid', '<div data-class="hero">Home</div>');
    mockFs.files.set('views/layouts/layout.liquid', '<!DOCTYPE html><html>{{ content }}</html>');
    
    service = new HtmlService({
      fileSystem: {
        readFile: mockFs.readFile,
        writeFile: mockFs.writeFile,
        mkdir: mockFs.mkdir,
      },
      liquidEngine: mockLiquid,
    });
  });
  
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('html');
    });
    
    it('should have version', () => {
      expect(service.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
    
    it('should depend on css service', () => {
      expect(service.dependencies).toContain('css');
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
    
    it('should set Liquid root to views directory', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/html',
        routes: { '/': { title: 'Home' } },
        appConfig: { name: 'Test', lang: 'en' },
      };
      
      await service.execute(input);
      
      expect(mockLiquid.setRoot).toHaveBeenCalledWith('./views');
    });
    
    it('should render each route through Liquid', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/html',
        routes: {
          '/': { title: 'Home' },
          '/about': { title: 'About' },
        },
        appConfig: { name: 'Test', lang: 'en' },
      };
      
      mockFs.files.set('views/pages/about.liquid', '<div>About</div>');
      
      await service.execute(input);
      
      expect(mockLiquid.renderFile).toHaveBeenCalledTimes(2);
    });
    
    it('should write HTML files', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/html',
        routes: { '/': { title: 'Home' } },
        appConfig: { name: 'Test', lang: 'en' },
      };
      
      await service.execute(input);
      
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
    
    it('should emit html:generated event', async () => {
      const context = createMockContext();
      await service.initialize(context);
      
      const input = {
        viewsDir: './views',
        outputDir: './dist/html',
        routes: { '/': { title: 'Home' } },
        appConfig: { name: 'Test', lang: 'en' },
      };
      
      await service.execute(input);
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'html:generated',
        expect.objectContaining({
          route: '/',
          path: expect.any(String),
          size: expect.any(Number),
        })
      );
    });
    
    it('should return list of generated pages', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/html',
        routes: {
          '/': { title: 'Home' },
          '/about': { title: 'About' },
        },
        appConfig: { name: 'Test', lang: 'en' },
      };
      
      mockFs.files.set('views/pages/about.liquid', '<div>About</div>');
      
      const result = await service.execute(input);
      
      expect(result.pages).toHaveLength(2);
      expect(result.pages[0]).toMatchObject({
        route: expect.any(String),
        path: expect.any(String),
        size: expect.any(Number),
      });
    });
    
    it('should pass correct data to Liquid template', async () => {
      const input = {
        viewsDir: './views',
        outputDir: './dist/html',
        routes: {
          '/': {
            title: 'Home Page',
            seo: { description: 'Welcome', keywords: ['home'] },
          },
        },
        appConfig: { name: 'TestApp', lang: 'en' },
      };
      
      await service.execute(input);
      
      expect(mockLiquid.renderFile).toHaveBeenCalledWith(
        'layouts/layout.liquid',
        expect.objectContaining({
          title: 'Home Page',
          lang: 'en',
          name: 'TestApp',
          meta: expect.objectContaining({
            description: 'Welcome',
          }),
        })
      );
    });
    
    it('should remove data-class in tailwind mode with stripDataClass', async () => {
      mockLiquid.renderFile.mockResolvedValue('<div data-class="test" class="bg-red">Content</div>');
      
      const input = {
        viewsDir: './views',
        outputDir: './dist/html',
        routes: { '/': { title: 'Home' } },
        mode: 'tailwind' as const,
        stripDataClassInTailwind: true,
        appConfig: { name: 'Test', lang: 'en' },
      };
      
      await service.execute(input);
      
      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('data-class');
      expect(writtenContent).toContain('class="bg-red"');
    });
    
    it('should convert data-class to class in semantic mode', async () => {
      mockLiquid.renderFile.mockResolvedValue('<div data-class="test" class="bg-red">Content</div>');
      
      const input = {
        viewsDir: './views',
        outputDir: './dist/html',
        routes: { '/': { title: 'Home' } },
        mode: 'semantic' as const,
        appConfig: { name: 'Test', lang: 'en' },
      };
      
      await service.execute(input);
      
      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toContain('class="test"');
      expect(writtenContent).not.toContain('bg-red');
    });
  });
  
  describe('dispose', () => {
    it('should dispose without error', async () => {
      await service.initialize(createMockContext());
      
      await expect(service.dispose()).resolves.not.toThrow();
    });
  });
});
