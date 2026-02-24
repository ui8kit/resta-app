import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HtmlService } from './HtmlService';
import type { GeneratorConfig, IServiceContext } from '../../core/interfaces';
import { createMockLogger } from '../../../test/setup';

function createMockFs() {
  const files = new Map<string, string>();
  return {
    files,
    readFile: vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, '/');
      const found = files.get(normalized);
      if (found !== undefined) return found;
      throw new Error(`ENOENT: ${path}`);
    }),
    writeFile: vi.fn(async (_path: string, _content: string) => {}),
    mkdir: vi.fn(async (_path: string) => {}),
  };
}

function createContext(): IServiceContext {
  const config: GeneratorConfig = {
    app: { name: 'Test', lang: 'en' },
    css: {
      routes: ['/'],
      outputDir: './dist/css',
      outputFiles: { pureCss: 'ui8kit.local.css' },
    },
    html: {
      viewsDir: './views',
      routes: { '/': { title: 'Home' } },
      outputDir: './dist/html',
      mode: 'tailwind',
    },
  };

  return {
    config,
    logger: createMockLogger(),
    eventBus: {
      emit: vi.fn(),
      on: vi.fn(() => () => {}),
      once: vi.fn(() => {}),
      off: vi.fn(() => {}),
      removeAllListeners: vi.fn(() => {}),
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

describe('HtmlService modes integration', () => {
  let service: HtmlService;
  let mockFs: ReturnType<typeof createMockFs>;

  beforeEach(async () => {
    mockFs = createMockFs();
    service = new HtmlService({ fileSystem: mockFs });
    await service.initialize(createContext());
  });

  it('tailwind mode keeps classes and data-class', async () => {
    mockFs.files.set('views/pages/index.html', '<div class="p-4" data-class="card">A</div>');

    await service.execute({
      viewsDir: './views',
      viewsPagesSubdir: 'pages',
      outputDir: './dist/html',
      routes: { '/': { title: 'Home' } },
      mode: 'tailwind',
      appConfig: { name: 'Test', lang: 'en' },
    });

    const html = mockFs.writeFile.mock.calls[0][1] as string;
    expect(html).toContain('class="p-4"');
    expect(html).toContain('data-class="card"');
  });

  it('semantic mode replaces data-class and strips utility class', async () => {
    mockFs.files.set('views/pages/index.html', '<div class="p-4" data-class="card">A</div>');

    await service.execute({
      viewsDir: './views',
      viewsPagesSubdir: 'pages',
      outputDir: './dist/html',
      routes: { '/': { title: 'Home' } },
      mode: 'semantic',
      appConfig: { name: 'Test', lang: 'en' },
    });

    const html = mockFs.writeFile.mock.calls[0][1] as string;
    expect(html).not.toContain('class="p-4"');
    expect(html).toContain('class="card"');
    expect(html).not.toContain('data-class=');
  });

  it('inline mode embeds minified css into head', async () => {
    mockFs.files.set('views/pages/index.html', '<div data-class="card">A</div>');
    mockFs.files.set('dist/css/ui8kit.local.css', '.card { color: red; }');

    await service.execute({
      viewsDir: './views',
      viewsPagesSubdir: 'pages',
      outputDir: './dist/html',
      routes: { '/': { title: 'Home' } },
      mode: 'inline',
      cssOutputDir: './dist/css',
      appConfig: { name: 'Test', lang: 'en' },
    });

    const html = mockFs.writeFile.mock.calls[0][1] as string;
    expect(html).toContain('<style>.card{color: red}</style>');
  });
});

