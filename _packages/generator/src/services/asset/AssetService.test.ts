import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssetService } from './AssetService';
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

// Create mock file system
function createAssetMockFs() {
  const files = new Map<string, { content: string; size: number }>();
  const directories = new Set<string>();
  
  return {
    files,
    directories,
    copyFile: vi.fn(async (src: string, dest: string) => {
      const file = files.get(src.replace(/\\/g, '/'));
      if (file) {
        files.set(dest.replace(/\\/g, '/'), file);
      }
    }),
    mkdir: vi.fn(async (path: string) => {
      directories.add(path.replace(/\\/g, '/'));
    }),
    readdir: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
      const entries: string[] = [];
      
      for (const key of files.keys()) {
        const normalizedKey = key.replace(/\\/g, '/').replace(/^\.\//, '');
        if (normalizedKey.startsWith(normalized + '/')) {
          const relative = normalizedKey.slice(normalized.length + 1);
          const firstPart = relative.split('/')[0];
          if (firstPart && !entries.includes(firstPart)) {
            entries.push(firstPart);
          }
        }
      }
      
      return entries;
    }),
    stat: vi.fn(async (path: string) => {
      const file = files.get(path.replace(/\\/g, '/').replace(/^\.\//, ''));
      return {
        size: file?.size ?? 0,
        isFile: () => !!file,
        isDirectory: () => !file,
      };
    }),
    exists: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
      return files.has(normalized) || directories.has(normalized);
    }),
  };
}

describe('AssetService', () => {
  let service: AssetService;
  let mockFs: ReturnType<typeof createAssetMockFs>;
  
  beforeEach(() => {
    mockFs = createAssetMockFs();
    
    // Set up CSS files
    mockFs.files.set('dist/css/tailwind.apply.css', { content: '.btn {}', size: 100 });
    mockFs.files.set('dist/css/ui8kit.local.css', { content: '.btn {}', size: 200 });
    mockFs.files.set('dist/css/shadcn.css', { content: '.shadcn {}', size: 150 });
    mockFs.files.set('dist/css/variants.apply.css', { content: '.variant {}', size: 80 });
    
    service = new AssetService({
      fileSystem: mockFs,
    });
  });
  
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('asset');
    });
    
    it('should have version', () => {
      expect(service.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
    
    it('should depend on html service', () => {
      expect(service.dependencies).toContain('html');
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
    
    it('should create output directories', async () => {
      const input = {
        cssSourceDir: './dist/css',
        outputDir: './dist/html/assets',
      };
      
      await service.execute(input);
      
      // Normalize paths for cross-platform
      const mkdirCalls = mockFs.mkdir.mock.calls.map(c => 
        (c[0] as string).replace(/\\/g, '/')
      );
      
      expect(mkdirCalls).toContainEqual(expect.stringContaining('css'));
    });
    
    it('should copy CSS files based on tailwind mode', async () => {
      const input = {
        cssSourceDir: './dist/css',
        outputDir: './dist/html/assets',
        cssMode: 'tailwind' as const,
      };
      
      await service.execute(input);
      
      // Check that tailwind.apply.css was copied
      const copyCalls = mockFs.copyFile.mock.calls.map(c => 
        (c[0] as string).replace(/\\/g, '/')
      );
      
      expect(copyCalls).toContainEqual(expect.stringContaining('tailwind.apply.css'));
    });
    
    it('should copy CSS files based on semantic mode', async () => {
      const input = {
        cssSourceDir: './dist/css',
        outputDir: './dist/html/assets',
        cssMode: 'semantic' as const,
      };
      
      await service.execute(input);
      
      // Check that ui8kit.local.css was copied
      const copyCalls = mockFs.copyFile.mock.calls.map(c => 
        (c[0] as string).replace(/\\/g, '/')
      );
      
      expect(copyCalls).toContainEqual(expect.stringContaining('ui8kit.local.css'));
    });
    
    it('should always copy shadcn.css and variants.apply.css', async () => {
      const input = {
        cssSourceDir: './dist/css',
        outputDir: './dist/html/assets',
        cssMode: 'tailwind' as const,
      };
      
      await service.execute(input);
      
      const copyCalls = mockFs.copyFile.mock.calls.map(c => 
        (c[0] as string).replace(/\\/g, '/')
      );
      
      expect(copyCalls).toContainEqual(expect.stringContaining('shadcn.css'));
      expect(copyCalls).toContainEqual(expect.stringContaining('variants.apply.css'));
    });
    
    it('should emit asset:copied event for each file', async () => {
      const context = createMockContext();
      await service.initialize(context);
      
      const input = {
        cssSourceDir: './dist/css',
        outputDir: './dist/html/assets',
      };
      
      await service.execute(input);
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'asset:copied',
        expect.objectContaining({
          source: expect.any(String),
          dest: expect.any(String),
          type: 'css',
        })
      );
    });
    
    it('should return copied file info', async () => {
      const input = {
        cssSourceDir: './dist/css',
        outputDir: './dist/html/assets',
      };
      
      const result = await service.execute(input);
      
      expect(result.copiedFiles.length).toBeGreaterThan(0);
      expect(result.totalSize).toBeGreaterThan(0);
    });
    
    it('should copy JS files when jsSourceDir is provided', async () => {
      mockFs.files.set('dist/js/main.js', { content: 'console.log()', size: 50 });
      mockFs.exists = vi.fn().mockResolvedValue(true);
      
      const input = {
        cssSourceDir: './dist/css',
        jsSourceDir: './dist/js',
        outputDir: './dist/html/assets',
      };
      
      await service.execute(input);
      
      const mkdirCalls = mockFs.mkdir.mock.calls.map(c => 
        (c[0] as string).replace(/\\/g, '/')
      );
      
      expect(mkdirCalls).toContainEqual(expect.stringContaining('js'));
    });
  });
  
  describe('dispose', () => {
    it('should dispose without error', async () => {
      await service.initialize(createMockContext());
      
      await expect(service.dispose()).resolves.not.toThrow();
    });
  });
});
