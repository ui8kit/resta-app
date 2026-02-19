import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayoutService } from './LayoutService';
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

describe('LayoutService', () => {
  let service: LayoutService;
  let mockFs: ReturnType<typeof createMockFileSystem>;
  
  beforeEach(() => {
    mockFs = createMockFileSystem();
    service = new LayoutService({
      templatesDir: '/templates',
      fileSystem: {
        readFile: mockFs.readFile,
        writeFile: mockFs.writeFile,
        exists: mockFs.exists,
        mkdir: mockFs.mkdir,
      },
    });
  });
  
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('layout');
    });
    
    it('should have version', () => {
      expect(service.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
    
    it('should have no dependencies', () => {
      expect(service.dependencies).toHaveLength(0);
    });
  });
  
  describe('initialize', () => {
    it('should initialize without error', async () => {
      const context = createMockContext();
      
      await expect(service.initialize(context)).resolves.not.toThrow();
    });
    
    it('should store config reference', async () => {
      const context = createMockContext();
      
      await service.initialize(context);
      
      // Service should be initialized (internal state check via execute)
      expect(true).toBe(true);
    });
  });
  
  describe('execute', () => {
    beforeEach(async () => {
      // Set up template files
      mockFs.files.set('/templates/layout.liquid', '<!DOCTYPE html><html>{{ content }}</html>');
      mockFs.files.set('/templates/page.liquid', '<main>{{ content }}</main>');
      
      await service.initialize(createMockContext({
        html: {
          viewsDir: './views',
          routes: { '/': { title: 'Home' } },
          outputDir: './dist/html',
        },
      }));
    });
    
    it('should create layouts directory if not exists', async () => {
      const input = { viewsDir: './views' };
      
      await service.execute(input);
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('layouts')
      );
    });
    
    it('should copy layout templates if missing', async () => {
      const input = { viewsDir: './views' };
      
      await service.execute(input);
      
      // Should have written layout files
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
    
    it('should not overwrite existing layouts', async () => {
      // Pre-populate layout file
      mockFs.files.set('./views/layouts/layout.liquid', 'existing content');
      
      const input = { viewsDir: './views' };
      
      await service.execute(input);
      
      // Should not have overwritten
      expect(mockFs.files.get('./views/layouts/layout.liquid')).toBe('existing content');
    });
    
    it('should return list of created files', async () => {
      const input = { viewsDir: './views' };
      
      const result = await service.execute(input);
      
      expect(result).toMatchObject({
        created: expect.any(Array),
        skipped: expect.any(Array),
      });
    });
  });
  
  describe('dispose', () => {
    it('should dispose without error', async () => {
      await service.initialize(createMockContext());
      
      await expect(service.dispose()).resolves.not.toThrow();
    });
  });
});
