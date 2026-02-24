import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CssService } from './CssService';
import { HtmlConverterService } from '../html-converter';
import type { IServiceContext, GeneratorConfig } from '../../core/interfaces';
import { createMockLogger } from '../../../test/setup';

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
  };
}

function createMockContext(
  config: Partial<GeneratorConfig> = {},
  converter: ReturnType<typeof createMockHtmlConverter> = createMockHtmlConverter()
): IServiceContext {
  const fullConfig: GeneratorConfig = {
    app: { name: 'Test', lang: 'en' },
    mappings: {
      ui8kitMap: './src/lib/ui8kit.map.json',
    },
    css: {
      routes: ['/'],
      outputDir: './dist/css',
      pureCss: true,
    },
    html: {
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
      resolve: vi.fn().mockReturnValue(converter),
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
  let context: IServiceContext;

  beforeEach(() => {
    mockFs = createMockFs();
    mockHtmlConverter = createMockHtmlConverter();

    mockFs.files.set('dist/html/index.html', '<div class="bg-red-500" data-class="test">Hello</div>');

    service = new CssService({
      fileSystem: {
        readFile: mockFs.readFile,
        writeFile: mockFs.writeFile,
        mkdir: mockFs.mkdir,
      },
    });

    context = createMockContext({}, mockHtmlConverter);
    context.registry.has = vi.fn().mockReturnValue(true);
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(service.name).toBe('css');
    });

    it('should have version', () => {
      expect(service.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should depend on html-converter service', () => {
      expect(service.dependencies).toContain('html-converter');
    });
  });

  describe('initialize', () => {
    it('should initialize without error', async () => {
      const context = createMockContext();
      context.registry.has = vi.fn().mockReturnValue(true);

      await expect(service.initialize(context)).resolves.not.toThrow();
    });

    it('should use HtmlConverterService from registry if available', async () => {
      const registryConverter = createMockHtmlConverter();
      const context = createMockContext({}, registryConverter);
      context.registry.has = vi.fn().mockReturnValue(true);
      context.registry.resolve = vi.fn().mockReturnValue(registryConverter);

      await service.initialize(context);

      const input = {
        htmlDir: './dist/html',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
      };

      await service.execute(input);

      expect(registryConverter.execute).toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    beforeEach(async () => {
      await service.initialize(context);
    });

    it('should create output directory', async () => {
      const input = {
        htmlDir: './dist/html',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: true,
      };

      await service.execute(input);

      expect(mockFs.mkdir).toHaveBeenCalledWith('./dist/css');
    });

    it('should process each route HTML file', async () => {
      mockFs.files.set('dist/html/index.html', '<div class="test">Home</div>');
      mockFs.files.set('dist/html/about/index.html', '<div class="test">About</div>');

      const input = {
        htmlDir: './dist/html',
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
        htmlDir: './dist/html',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: false,
      };

      await service.execute(input);

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
        htmlDir: './dist/html',
        outputDir: './dist/css',
        routes: { '/': { title: 'Home' } },
        pureCss: true,
      };

      await service.execute(input);

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
        htmlDir: './dist/html',
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
        htmlDir: './dist/html',
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
  });

  describe('dispose', () => {
    it('should dispose without error', async () => {
      await service.initialize(createMockContext());

      await expect(service.dispose()).resolves.not.toThrow();
    });
  });
});
