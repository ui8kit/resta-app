import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HtmlConverterService } from './HtmlConverterService';
import { createMockLogger } from '../../../test/setup';

/**
 * Create mock file system for HtmlConverterService
 */
function createMockFs() {
  const files = new Map<string, string>();
  
  const normalizePath = (p: string) => {
    return p.replace(/\\/g, '/').replace(/^\.\//, '');
  };
  
  return {
    files,
    readFile: vi.fn(async (path: string) => {
      const normalized = normalizePath(path);
      
      // Try exact match first
      if (files.has(normalized)) {
        return files.get(normalized)!;
      }
      
      // Try matching by ending (for absolute paths)
      for (const [key, value] of files.entries()) {
        if (normalized.endsWith(key) || key.endsWith(normalized)) {
          return value;
        }
      }
      
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }),
  };
}

/**
 * Create mock service context
 */
function createMockContext(config: Record<string, unknown> = {}) {
  return {
    config: config as any,
    logger: createMockLogger(),
    eventBus: {
      emit: vi.fn(),
      on: vi.fn(() => () => {}),
      off: vi.fn(),
      once: vi.fn(() => () => {}),
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn(() => 0),
    },
    registry: {
      has: vi.fn(() => false),
      resolve: vi.fn(),
      register: vi.fn(),
      getServiceNames: vi.fn(() => []),
      getInitializationOrder: vi.fn(() => []),
      initializeAll: vi.fn(async () => {}),
      disposeAll: vi.fn(async () => {}),
    },
  };
}

describe('HtmlConverterService', () => {
  let service: HtmlConverterService;
  let mockFs: ReturnType<typeof createMockFs>;
  
  beforeEach(() => {
    mockFs = createMockFs();
    service = new HtmlConverterService({
      fileSystem: mockFs,
    });
  });
  
  describe('constructor', () => {
    it('should create service with default name', () => {
      expect(service.name).toBe('html-converter');
    });
    
    it('should have version', () => {
      expect(service.version).toBe('1.0.0');
    });
    
    it('should have no dependencies', () => {
      expect(service.dependencies).toEqual([]);
    });
  });
  
  describe('initialize', () => {
    it('should load maps from config paths', async () => {
      const ui8kitMap = { 'flex': 'display: flex;', 'p-4': 'padding: 1rem;' };
      const shadcnMap = { 'bg-background': 'background-color: hsl(var(--background));' };
      
      mockFs.files.set('maps/ui8kit.map.json', JSON.stringify(ui8kitMap));
      mockFs.files.set('maps/shadcn.map.json', JSON.stringify(shadcnMap));
      
      const context = createMockContext({
        mappings: {
          ui8kitMap: 'maps/ui8kit.map.json',
          shadcnMap: 'maps/shadcn.map.json',
        },
      });
      
      await service.initialize(context);
      
      expect(mockFs.readFile).toHaveBeenCalledWith(expect.stringContaining('ui8kit.map.json'));
      expect(mockFs.readFile).toHaveBeenCalledWith(expect.stringContaining('shadcn.map.json'));
    });
    
    it('should handle missing shadcn map gracefully', async () => {
      const ui8kitMap = { 'flex': 'display: flex;' };
      mockFs.files.set('maps/ui8kit.map.json', JSON.stringify(ui8kitMap));
      
      const context = createMockContext({
        mappings: {
          ui8kitMap: 'maps/ui8kit.map.json',
        },
      });
      
      // Should not throw
      await service.initialize(context);
    });
  });
  
  describe('execute', () => {
    const ui8kitMap = {
      'flex': 'display: flex;',
      'p-4': 'padding: 1rem;',
      'text-lg': 'font-size: 1.125rem;',
      'bg-white': 'background-color: #ffffff;',
      'items-center': 'align-items: center;',
    };
    
    beforeEach(async () => {
      // Reset mock and files
      mockFs = createMockFs();
      mockFs.files.set('maps/ui8kit.map.json', JSON.stringify(ui8kitMap));
      
      // Create new service with fresh mock
      service = new HtmlConverterService({
        fileSystem: mockFs,
      });
      
      const context = createMockContext({
        mappings: {
          ui8kitMap: 'maps/ui8kit.map.json',
        },
      });
      
      await service.initialize(context);
    });
    
    it('should extract classes from HTML with data-class', async () => {
      const html = `
        <div data-class="card" class="flex p-4">
          <span data-class="card-title" class="text-lg">Title</span>
        </div>
      `;
      mockFs.files.set('views/page.liquid', html);
      
      const result = await service.execute({
        htmlPath: 'views/page.liquid',
      });
      
      expect(result.applyCss).toContain('.card');
      expect(result.applyCss).toContain('@apply flex p-4');
      expect(result.applyCss).toContain('.card-title');
      expect(result.applyCss).toContain('@apply text-lg');
    });
    
    it('should generate pure CSS with resolved properties', async () => {
      const html = `<div data-class="box" class="flex p-4"></div>`;
      mockFs.files.set('views/page.liquid', html);
      
      const result = await service.execute({
        htmlPath: 'views/page.liquid',
      });
      
      expect(result.pureCss).toContain('.box');
      expect(result.pureCss).toContain('display: flex;');
      expect(result.pureCss).toContain('padding: 1rem;');
    });
    
    it('should handle elements without data-class', async () => {
      const html = `<div class="flex items-center"></div>`;
      mockFs.files.set('views/page.liquid', html);
      
      const result = await service.execute({
        htmlPath: 'views/page.liquid',
      });
      
      // Should generate a random selector
      expect(result.applyCss).toContain('@apply flex items-center');
    });
    
    it('should merge duplicate class sets', async () => {
      const html = `
        <div data-class="item-1" class="flex p-4"></div>
        <div data-class="item-2" class="flex p-4"></div>
        <div data-class="item-3" class="flex p-4"></div>
      `;
      mockFs.files.set('views/page.liquid', html);
      
      const result = await service.execute({
        htmlPath: 'views/page.liquid',
      });
      
      // Should combine selectors with same classes
      expect(result.applyCss).toContain('.item-1, .item-2, .item-3');
    });
    
    it('should respect ignoreSelectors option', async () => {
      const html = `
        <div data-class="keep-this" class="flex"></div>
        <div data-class="ignore-this" class="p-4"></div>
      `;
      mockFs.files.set('views/page.liquid', html);
      
      const result = await service.execute({
        htmlPath: 'views/page.liquid',
        ignoreSelectors: ['ignore-this'],
      });
      
      expect(result.applyCss).toContain('.keep-this');
      expect(result.applyCss).not.toContain('.ignore-this');
    });
    
    it('should support regex in ignoreSelectors', async () => {
      const html = `
        <div data-class="card" class="flex"></div>
        <div data-class="temp-123" class="p-4"></div>
        <div data-class="temp-456" class="bg-white"></div>
      `;
      mockFs.files.set('views/page.liquid', html);
      
      const result = await service.execute({
        htmlPath: 'views/page.liquid',
        ignoreSelectors: [/^temp-/],
      });
      
      expect(result.applyCss).toContain('.card');
      expect(result.applyCss).not.toContain('temp-123');
      expect(result.applyCss).not.toContain('temp-456');
    });
    
    it('should emit convert:complete event', async () => {
      const html = `<div data-class="box" class="flex"></div>`;
      mockFs.files.set('views/page.liquid', html);
      
      const context = createMockContext({
        mappings: { ui8kitMap: 'maps/ui8kit.map.json' },
      });
      await service.initialize(context);
      
      await service.execute({ htmlPath: 'views/page.liquid' });
      
      expect(context.eventBus.emit).toHaveBeenCalledWith(
        'html-converter:complete',
        expect.objectContaining({
          htmlPath: 'views/page.liquid',
          elementsCount: expect.any(Number),
        })
      );
    });
  });
  
  describe('extractClasses', () => {
    it('should extract class attribute correctly', () => {
      const tag = '<div class="flex items-center p-4">';
      const classes = service.extractClassAttribute(tag);
      
      expect(classes).toEqual(['flex', 'items-center', 'p-4']);
    });
    
    it('should not confuse class with data-class', () => {
      const tag = '<div data-class="card" class="flex">';
      const classes = service.extractClassAttribute(tag);
      
      expect(classes).toEqual(['flex']);
      expect(classes).not.toContain('card');
    });
    
    it('should extract data-class attribute', () => {
      const tag = '<div data-class="card-header" class="flex">';
      const dataClass = service.extractDataClassAttribute(tag);
      
      expect(dataClass).toBe('card-header');
    });
  });
  
  describe('dispose', () => {
    it('should clear cached maps', async () => {
      mockFs.files.set('maps/ui8kit.map.json', JSON.stringify({ flex: 'display: flex;' }));
      
      const context = createMockContext({
        mappings: { ui8kitMap: 'maps/ui8kit.map.json' },
      });
      await service.initialize(context);
      
      await service.dispose();
      
      // After dispose, maps should be cleared
      expect(service.getMapsSize()).toBe(0);
    });
  });
  
  describe('isValidTailwindClass', () => {
    beforeEach(async () => {
      // Reset mock and files
      mockFs = createMockFs();
      mockFs.files.set('maps/ui8kit.map.json', JSON.stringify({
        'flex': 'display: flex;',
        'p-4': 'padding: 1rem;',
      }));
      
      // Create new service with fresh mock
      service = new HtmlConverterService({
        fileSystem: mockFs,
      });
      
      const context = createMockContext({
        mappings: { ui8kitMap: 'maps/ui8kit.map.json' },
      });
      await service.initialize(context);
    });
    
    it('should return true for known classes', () => {
      expect(service.isValidTailwindClass('flex')).toBe(true);
      expect(service.isValidTailwindClass('p-4')).toBe(true);
    });
    
    it('should return false for unknown classes', () => {
      expect(service.isValidTailwindClass('unknown-class')).toBe(false);
    });
    
    it('should return false for lucide icon classes', () => {
      expect(service.isValidTailwindClass('lucide')).toBe(false);
      expect(service.isValidTailwindClass('lucide-star')).toBe(false);
    });
  });
});
