import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClassLogService, type ClassLogFileSystem, type ClassLogFile } from './ClassLogService';

// Mock file system
function createMockFs(files: Record<string, string> = {}): ClassLogFileSystem & { _written: Record<string, string> } {
  const writtenFiles: Record<string, string> = {};
  
  // Normalize paths for cross-platform compatibility
  const normalizedFiles: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    normalizedFiles[path.replace(/\\/g, '/')] = content;
  }
  
  return {
    readFile: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/');
      if (normalizedFiles[normalized]) return normalizedFiles[normalized];
      throw new Error(`File not found: ${path}`);
    }),
    writeFile: vi.fn(async (path: string, content: string) => {
      writtenFiles[path.replace(/\\/g, '/')] = content;
    }),
    mkdir: vi.fn(async () => {}),
    readdir: vi.fn(async (dirPath: string) => {
      const normalizedDir = dirPath.replace(/\\/g, '/');
      const entries: Array<{ name: string; isFile: () => boolean }> = [];
      
      for (const filePath of Object.keys(normalizedFiles)) {
        if (filePath.startsWith(normalizedDir + '/')) {
          const relativePath = filePath.slice(normalizedDir.length + 1);
          if (!relativePath.includes('/')) {
            entries.push({
              name: relativePath,
              isFile: () => true,
            });
          }
        }
      }
      
      if (entries.length === 0) {
        throw new Error(`Directory not found or empty: ${dirPath}`);
      }
      
      return entries;
    }),
    _written: writtenFiles,
  };
}

// Mock context
function createMockContext() {
  return {
    config: {},
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn().mockReturnThis(),
    },
    eventBus: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn().mockReturnValue(0),
    },
    registry: {
      has: vi.fn().mockReturnValue(false),
      resolve: vi.fn(),
      register: vi.fn(),
      getServiceNames: vi.fn().mockReturnValue([]),
      getInitializationOrder: vi.fn().mockReturnValue([]),
      initializeAll: vi.fn(),
      disposeAll: vi.fn(),
    },
  };
}

// Sample ui8kit.map.json for filtering
const SAMPLE_UIKIT_MAP = JSON.stringify({
  'flex': 'display: flex;',
  'gap-4': 'gap: 1rem;',
  'p-2': 'padding: 0.5rem;',
  'sticky': 'position: sticky;',
  'top-0': 'top: 0px;',
});

describe('ClassLogService', () => {
  let service: ClassLogService;
  let mockFs: ClassLogFileSystem & { _written: Record<string, string> };
  let mockContext: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockFs = createMockFs();
    mockContext = createMockContext();
    service = new ClassLogService({ fileSystem: mockFs });
  });

  it('has correct service metadata', () => {
    expect(service.name).toBe('class-log');
    expect(service.version).toBe('3.0.0');
    expect(service.dependencies).toContain('view');
  });

  it('extracts classes and generates JSON output files', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex gap-4 p-2">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
    });
    
    expect(result.totalClasses).toBe(3);
    
    // Check JSON file
    expect(mockFs._written['/dist/maps/ui8kit.log.json']).toBeDefined();
    const json: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.log.json']);
    expect(json.total).toBe(3);
    expect(json.classes).toContain('flex');
    expect(json.classes).toContain('gap-4');
    expect(json.classes).toContain('p-2');
    
    // Check filtered JSON file exists
    expect(mockFs._written['/dist/maps/ui8kit.tailwind.log.json']).toBeDefined();
  });

  it('filters classes by ui8kit.map.json', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex gap-4 custom-class invalid-class">Content</div>',
      '/uikit.map.json': SAMPLE_UIKIT_MAP,
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
      uikitMapPath: '/uikit.map.json',
    });
    
    expect(result.totalClasses).toBe(4); // All classes found
    expect(result.validClasses).toBe(2); // Only flex, gap-4 are valid
    
    const filteredJson: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.tailwind.log.json']);
    expect(filteredJson.total).toBe(2);
    expect(filteredJson.classes).toContain('flex');
    expect(filteredJson.classes).toContain('gap-4');
    expect(filteredJson.classes).not.toContain('custom-class');
    expect(filteredJson.classes).not.toContain('invalid-class');
  });

  it('deduplicates classes', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex flex flex gap-4 gap-4">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
    });
    
    expect(result.totalClasses).toBe(2); // flex, gap-4
    
    const json: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.log.json']);
    expect(json.classes).toEqual(['flex', 'gap-4']);
  });

  it('extracts data-class attributes', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex" data-class="hero-section">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
    });
    
    const json: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.log.json']);
    expect(json.classes).toContain('hero-section');
    expect(json.classes).toContain('flex');
  });

  it('handles responsive classes when includeResponsive is true', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex md:flex-col lg:gap-6">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
      includeResponsive: true,
    });
    
    const json: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.log.json']);
    expect(json.classes).toContain('md:flex-col');
    expect(json.classes).toContain('lg:gap-6');
  });

  it('excludes responsive classes when includeResponsive is false', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex md:flex-col lg:gap-6">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
      includeResponsive: false,
    });
    
    const json: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.log.json']);
    expect(json.classes).toContain('flex');
    expect(json.classes).not.toContain('md:flex-col');
    expect(json.classes).not.toContain('lg:gap-6');
  });

  it('skips Liquid tags in class values', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex {{ dynamic_class }} gap-4">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
    });
    
    const json: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.log.json']);
    expect(json.classes).toContain('flex');
    expect(json.classes).toContain('gap-4');
    expect(json.classes.some(c => c.includes('{'))).toBe(false);
  });

  it('scans partials and layouts directories', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex">Page</div>',
      '/views/partials/header.liquid': '<header class="sticky top-0">Header</header>',
      '/views/layouts/layout.liquid': '<html class="dark">Layout</html>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
    });
    
    const json: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.log.json']);
    expect(json.classes).toContain('flex');
    expect(json.classes).toContain('sticky');
    expect(json.classes).toContain('top-0');
    expect(json.classes).toContain('dark');
  });

  it('uses custom baseName for output files', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
      baseName: 'custom',
    });
    
    expect(result.jsonPath).toContain('custom.log.json');
    expect(result.filteredJsonPath).toContain('custom.tailwind.log.json');
    expect(mockFs._written['/dist/maps/custom.log.json']).toBeDefined();
    expect(mockFs._written['/dist/maps/custom.tailwind.log.json']).toBeDefined();
  });

  it('emits event on completion', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
    });
    
    expect(mockContext.eventBus.emit).toHaveBeenCalledWith('class-log:generated', expect.objectContaining({
      totalClasses: 1,
      validClasses: 1,
    }));
  });

  it('sorts classes alphabetically', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="z-10 flex absolute mt-4">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
    });
    
    const json: ClassLogFile = JSON.parse(mockFs._written['/dist/maps/ui8kit.log.json']);
    expect(json.classes).toEqual(['absolute', 'flex', 'mt-4', 'z-10']);
  });

  it('handles missing ui8kit.map.json gracefully', async () => {
    const files = {
      '/views/pages/index.liquid': '<div class="flex gap-4">Content</div>',
    };
    mockFs = createMockFs(files);
    service = new ClassLogService({ fileSystem: mockFs });
    
    await service.initialize(mockContext as any);
    const result = await service.execute({
      viewsDir: '/views',
      outputDir: '/dist/maps',
      uikitMapPath: '/nonexistent/uikit.map.json',
    });
    
    // Should still work, just use all classes
    expect(result.totalClasses).toBe(2);
    expect(result.validClasses).toBe(2);
    expect(mockContext.logger.warn).toHaveBeenCalled();
  });
});
