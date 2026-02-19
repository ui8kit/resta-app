import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViteBundleService, type ViteBundleFileSystem, type ViteBundleInput } from './ViteBundleService';
import type { IServiceContext } from '../../core/interfaces';

// =============================================================================
// Mock Utilities
// =============================================================================

function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockEventBus() {
  return {
    emit: vi.fn(),
    on: vi.fn().mockReturnValue(() => {}),
  };
}

function createMockFileSystem(): ViteBundleFileSystem & {
  files: Map<string, { content: string; size: number }>;
  dirs: Set<string>;
} {
  const files = new Map<string, { content: string; size: number }>();
  const dirs = new Set<string>();
  
  return {
    files,
    dirs,
    readdir: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/');
      const result: string[] = [];
      
      for (const key of files.keys()) {
        if (key.startsWith(normalized + '/')) {
          const rest = key.slice(normalized.length + 1);
          const fileName = rest.split('/')[0];
          if (fileName && !result.includes(fileName)) {
            result.push(fileName);
          }
        }
      }
      
      return result;
    }),
    copyFile: vi.fn(async (src: string, dest: string) => {
      const normalized = src.replace(/\\/g, '/');
      const file = files.get(normalized);
      if (file) {
        files.set(dest.replace(/\\/g, '/'), file);
      }
    }),
    mkdir: vi.fn(async (path: string) => {
      dirs.add(path.replace(/\\/g, '/'));
    }),
    stat: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/');
      const file = files.get(normalized);
      if (file) {
        return { size: file.size };
      }
      throw new Error(`ENOENT: no such file: ${path}`);
    }),
    exists: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/');
      // Check if it's a directory (has files under it)
      for (const key of files.keys()) {
        if (key.startsWith(normalized + '/') || key === normalized) {
          return true;
        }
      }
      return dirs.has(normalized);
    }),
  };
}

function createMockContext(): IServiceContext {
  return {
    config: {},
    logger: createMockLogger() as any,
    eventBus: createMockEventBus() as any,
    registry: {
      resolve: vi.fn(),
      has: vi.fn().mockReturnValue(true),
      register: vi.fn(),
      getServiceNames: vi.fn().mockReturnValue([]),
      getInitializationOrder: vi.fn().mockReturnValue([]),
      initializeAll: vi.fn(),
      disposeAll: vi.fn(),
    } as any,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe('ViteBundleService', () => {
  let service: ViteBundleService;
  let mockFs: ReturnType<typeof createMockFileSystem>;
  let context: IServiceContext;
  
  beforeEach(() => {
    mockFs = createMockFileSystem();
    context = createMockContext();
    service = new ViteBundleService({ fileSystem: mockFs });
  });
  
  describe('metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('vite-bundle');
    });
    
    it('should have semantic version', () => {
      expect(service.version).toMatch(/^\d+\.\d+\.\d+$/);
    });
    
    it('should declare html dependency', () => {
      expect(service.dependencies).toContain('html');
    });
  });
  
  describe('initialize', () => {
    it('should initialize without error', async () => {
      await service.initialize(context);
      expect(true).toBe(true);
    });
  });
  
  describe('execute', () => {
    beforeEach(async () => {
      await service.initialize(context);
    });
    
    it('should warn if Vite build directory does not exist', async () => {
      const result = await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
      });
      
      expect(result.cssPath).toBeUndefined();
      expect(context.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('not found')
      );
    });
    
    it('should copy CSS file to HTML output', async () => {
      // Setup: Add CSS file to mock filesystem
      mockFs.files.set('./dist/assets/index-ABC123.css', {
        content: ':root { --color: blue; }',
        size: 1234,
      });
      
      const result = await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
      });
      
      expect(result.cssPath).toBe('./dist/html/css/styles.css');
      expect(result.originalCssName).toBe('index-ABC123.css');
      expect(result.cssSize).toBe(1234);
      
      // Verify mkdir was called
      expect(mockFs.mkdir).toHaveBeenCalledWith('./dist/html/css');
      
      // Verify copyFile was called
      expect(mockFs.copyFile).toHaveBeenCalledWith(
        './dist/assets/index-ABC123.css',
        './dist/html/css/styles.css'
      );
    });
    
    it('should use custom CSS filename', async () => {
      mockFs.files.set('./dist/assets/main-XYZ.css', {
        content: 'body { margin: 0; }',
        size: 500,
      });
      
      const result = await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
        cssFileName: 'app.css',
      });
      
      expect(result.cssPath).toBe('./dist/html/css/app.css');
    });
    
    it('should use custom CSS subdirectory', async () => {
      mockFs.files.set('./dist/assets/style-123.css', {
        content: 'h1 { color: red; }',
        size: 100,
      });
      
      const result = await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
        cssSubdir: 'assets/css',
      });
      
      expect(result.cssPath).toBe('./dist/html/assets/css/styles.css');
    });
    
    it('should emit event when CSS is copied', async () => {
      mockFs.files.set('./dist/assets/index-hash.css', {
        content: '.class { display: flex; }',
        size: 2000,
      });
      
      await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
      });
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'vite-bundle:css-copied',
        expect.objectContaining({
          originalName: 'index-hash.css',
          size: 2000,
        })
      );
    });
    
    it('should copy JS file when copyJs is true', async () => {
      mockFs.files.set('./dist/assets/index-abc.js', {
        content: 'console.log("app");',
        size: 5000,
      });
      
      const result = await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
        copyJs: true,
      });
      
      expect(result.jsPath).toBe('./dist/html/js/app.js');
      expect(result.originalJsName).toBe('index-abc.js');
      expect(result.jsSize).toBe(5000);
    });
    
    it('should use custom JS filename', async () => {
      mockFs.files.set('./dist/assets/index-def.js', {
        content: 'export default {};',
        size: 3000,
      });
      
      const result = await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
        copyJs: true,
        jsFileName: 'bundle.js',
      });
      
      expect(result.jsPath).toBe('./dist/html/js/bundle.js');
    });
    
    it('should not copy JS when copyJs is false (default)', async () => {
      mockFs.files.set('./dist/assets/index-ghi.js', {
        content: 'export const x = 1;',
        size: 1000,
      });
      
      const result = await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
        copyJs: false,
      });
      
      expect(result.jsPath).toBeUndefined();
    });
    
    it('should handle both CSS and JS files', async () => {
      mockFs.files.set('./dist/assets/index-css123.css', {
        content: 'body {}',
        size: 800,
      });
      mockFs.files.set('./dist/assets/index-js456.js', {
        content: 'init();',
        size: 1200,
      });
      
      const result = await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
        copyJs: true,
      });
      
      expect(result.cssPath).toBeDefined();
      expect(result.jsPath).toBeDefined();
    });
    
    it('should log info when CSS is copied', async () => {
      mockFs.files.set('./dist/assets/app-xyz.css', {
        content: '.btn { padding: 8px; }',
        size: 1500,
      });
      
      await service.execute({
        viteBuildDir: './dist/assets',
        htmlOutputDir: './dist/html',
      });
      
      expect(context.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Copied Vite CSS')
      );
    });
  });
  
  describe('dispose', () => {
    it('should dispose without error', async () => {
      await service.initialize(context);
      await service.dispose();
      expect(true).toBe(true);
    });
  });
});
