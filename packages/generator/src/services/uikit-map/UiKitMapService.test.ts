import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UiKitMapService, type UiKitMapFileSystem, type UiKitMapServiceInput } from './UiKitMapService';
import type { IServiceContext, IEventBus, ILogger } from '../../core/interfaces';

/**
 * Mock file system type with getWrittenFiles
 */
type MockFileSystem = UiKitMapFileSystem & { getWrittenFiles: () => Record<string, string> };

/**
 * Create mock file system
 */
function createMockFileSystem(files: Record<string, string> = {}): MockFileSystem {
  const writtenFiles: Record<string, string> = {};
  
  return {
    readFile: vi.fn(async (path: string) => {
      if (files[path]) {
        return files[path];
      }
      throw new Error(`File not found: ${path}`);
    }),
    writeFile: vi.fn(async (path: string, content: string) => {
      writtenFiles[path] = content;
    }),
    exists: vi.fn(async (path: string) => path in files),
    getWrittenFiles: () => writtenFiles,
  };
}

/**
 * Create mock service context
 */
function createMockContext(): IServiceContext {
  return {
    config: {},
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(() => ({
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    } as unknown as ILogger,
    eventBus: {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as IEventBus,
    registry: {
      has: vi.fn(),
      resolve: vi.fn(),
      getServiceNames: vi.fn(),
    },
  } as unknown as IServiceContext;
}

// Sample utility-props.map.ts content
const SAMPLE_PROPS_MAP = `/* eslint-disable */
export const utilityPropsMap = {
  "absolute": [
    ""
  ],
  "bg": [
    "primary",
    "secondary",
    "background"
  ],
  "text": [
    "foreground",
    "muted-foreground"
  ],
  "gap": [
    "0",
    "1",
    "2",
    "4"
  ]
} as const;
`;

// Sample tw-css-extended.json content
const SAMPLE_TAILWIND_MAP = JSON.stringify({
  'absolute': 'position: absolute;',
  'gap-0': 'gap: 0px;',
  'gap-1': 'gap: 0.25rem;',
  'gap-2': 'gap: 0.5rem;',
  'gap-4': 'gap: 1rem;',
  'bg-red-500': 'background-color: rgb(239 68 68);',
});

// Sample shadcn.map.json content
const SAMPLE_SHADCN_MAP = JSON.stringify({
  'bg-primary': 'background-color: var(--primary);',
  'bg-secondary': 'background-color: var(--secondary);',
  'bg-background': 'background-color: var(--background);',
  'text-foreground': 'color: var(--foreground);',
  'text-muted-foreground': 'color: var(--muted-foreground);',
});

// Sample grid.map.json content
const SAMPLE_GRID_MAP = JSON.stringify({
  'md:grid-cols-2': '@media (min-width: 768px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }',
  'lg:grid-cols-3': '@media (min-width: 1024px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }',
});

describe('UiKitMapService', () => {
  let service: UiKitMapService;
  let mockContext: IServiceContext;
  let mockFs: UiKitMapFileSystem & { getWrittenFiles: () => Record<string, string> };
  
  const defaultInput: UiKitMapServiceInput = {
    propsMapPath: '/path/to/utility-props.map.ts',
    tailwindMapPath: '/path/to/tw-css-extended.json',
    shadcnMapPath: '/path/to/shadcn.map.json',
    gridMapPath: '/path/to/grid.map.json',
    outputPath: '/path/to/ui8kit.map.json',
  };
  
  beforeEach(() => {
    mockFs = createMockFileSystem({
      '/path/to/utility-props.map.ts': SAMPLE_PROPS_MAP,
      '/path/to/tw-css-extended.json': SAMPLE_TAILWIND_MAP,
      '/path/to/shadcn.map.json': SAMPLE_SHADCN_MAP,
      '/path/to/grid.map.json': SAMPLE_GRID_MAP,
    });
    
    service = new UiKitMapService({ fileSystem: mockFs });
    mockContext = createMockContext();
  });
  
  describe('service metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('uikit-map');
    });
    
    it('should have correct version', () => {
      expect(service.version).toBe('1.0.0');
    });
    
    it('should have no dependencies', () => {
      expect(service.dependencies).toEqual([]);
    });
  });
  
  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(service.initialize(mockContext)).resolves.not.toThrow();
    });
  });
  
  describe('execute', () => {
    beforeEach(async () => {
      await service.initialize(mockContext);
    });
    
    it('should generate ui8kit.map.json', async () => {
      const result = await service.execute(defaultInput);
      
      expect(result.outputPath).toBe('/path/to/ui8kit.map.json');
      expect(result.totalClasses).toBeGreaterThan(0);
    });
    
    it('should include Tailwind classes', async () => {
      const result = await service.execute(defaultInput);
      
      expect(result.tailwindClasses).toBeGreaterThan(0);
      
      const writtenContent = mockFs.getWrittenFiles()['/path/to/ui8kit.map.json'];
      const map = JSON.parse(writtenContent);
      
      expect(map['absolute']).toBe('position: absolute;');
      expect(map['gap-4']).toBe('gap: 1rem;');
    });
    
    it('should include Shadcn design tokens', async () => {
      const result = await service.execute(defaultInput);
      
      expect(result.shadcnClasses).toBeGreaterThan(0);
      
      const writtenContent = mockFs.getWrittenFiles()['/path/to/ui8kit.map.json'];
      const map = JSON.parse(writtenContent);
      
      expect(map['bg-primary']).toBe('background-color: var(--primary);');
      expect(map['text-foreground']).toBe('color: var(--foreground);');
    });
    
    it('should include grid classes', async () => {
      const result = await service.execute(defaultInput);
      
      expect(result.gridClasses).toBe(2);
      
      const writtenContent = mockFs.getWrittenFiles()['/path/to/ui8kit.map.json'];
      const map = JSON.parse(writtenContent);
      
      expect(map['md:grid-cols-2']).toContain('@media');
      expect(map['lg:grid-cols-3']).toContain('@media');
    });
    
    it('should prioritize Shadcn over Tailwind for same class', async () => {
      // If both have bg-primary, Shadcn should win
      const writtenContent = mockFs.getWrittenFiles()['/path/to/ui8kit.map.json'];
      
      // Re-run with overlapping classes
      await service.execute(defaultInput);
      const map = JSON.parse(mockFs.getWrittenFiles()['/path/to/ui8kit.map.json']);
      
      // bg-primary comes from Shadcn, not Tailwind
      expect(map['bg-primary']).toContain('var(--primary)');
    });
    
    it('should report missing classes', async () => {
      // Add a class that doesn't exist in any source
      const propsWithMissing = SAMPLE_PROPS_MAP.replace(
        '"gap": [',
        '"custom": ["nonexistent"],\n  "gap": ['
      );
      
      const testFs = createMockFileSystem({
        '/path/to/utility-props.map.ts': propsWithMissing,
        '/path/to/tw-css-extended.json': SAMPLE_TAILWIND_MAP,
        '/path/to/shadcn.map.json': SAMPLE_SHADCN_MAP,
        '/path/to/grid.map.json': SAMPLE_GRID_MAP,
      });
      
      const testService = new UiKitMapService({ fileSystem: testFs });
      await testService.initialize(mockContext);
      
      const result = await testService.execute(defaultInput);
      
      expect(result.missingClasses).toContain('custom-nonexistent');
    });
    
    it('should sort output alphabetically', async () => {
      await service.execute(defaultInput);
      
      const writtenContent = mockFs.getWrittenFiles()['/path/to/ui8kit.map.json'];
      const map = JSON.parse(writtenContent);
      const keys = Object.keys(map);
      
      const sortedKeys = [...keys].sort();
      expect(keys).toEqual(sortedKeys);
    });
    
    it('should emit uikit-map:generated event', async () => {
      await service.execute(defaultInput);
      
      expect(mockContext.eventBus.emit).toHaveBeenCalledWith(
        'uikit-map:generated',
        expect.objectContaining({
          totalClasses: expect.any(Number),
          outputPath: '/path/to/ui8kit.map.json',
        })
      );
    });
    
    it('should handle bare tokens (empty value)', async () => {
      await service.execute(defaultInput);
      
      const writtenContent = mockFs.getWrittenFiles()['/path/to/ui8kit.map.json'];
      const map = JSON.parse(writtenContent);
      
      // "absolute": [""] should generate class "absolute"
      expect(map['absolute']).toBe('position: absolute;');
    });
  });
  
  describe('dispose', () => {
    it('should dispose without errors', async () => {
      await service.initialize(mockContext);
      await expect(service.dispose()).resolves.not.toThrow();
    });
  });
  
  describe('error handling', () => {
    beforeEach(async () => {
      await service.initialize(mockContext);
    });
    
    it('should throw if props map file not found', async () => {
      const testFs = createMockFileSystem({
        // Missing props map
        '/path/to/tw-css-extended.json': SAMPLE_TAILWIND_MAP,
        '/path/to/shadcn.map.json': SAMPLE_SHADCN_MAP,
        '/path/to/grid.map.json': SAMPLE_GRID_MAP,
      });
      
      const testService = new UiKitMapService({ fileSystem: testFs });
      await testService.initialize(mockContext);
      
      await expect(testService.execute(defaultInput)).rejects.toThrow('File not found');
    });
    
    it('should throw if props map has invalid format', async () => {
      const testFs = createMockFileSystem({
        '/path/to/utility-props.map.ts': 'invalid content',
        '/path/to/tw-css-extended.json': SAMPLE_TAILWIND_MAP,
        '/path/to/shadcn.map.json': SAMPLE_SHADCN_MAP,
        '/path/to/grid.map.json': SAMPLE_GRID_MAP,
      });
      
      const testService = new UiKitMapService({ fileSystem: testFs });
      await testService.initialize(mockContext);
      
      await expect(testService.execute(defaultInput)).rejects.toThrow('Could not parse utilityPropsMap');
    });
  });
});
