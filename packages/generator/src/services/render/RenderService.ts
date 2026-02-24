import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type { IService, IServiceContext, RouteConfig } from '../../core/interfaces';

export interface RenderServiceInput {
  appEntry: string;
  outputDir: string;
  routes: Record<string, RouteConfig>;
  skipRoutes?: string[];
}

export interface RenderServiceOutput {
  pages: Array<{
    route: string;
    path: string;
    size: number;
  }>;
}

type AppComponent = (props: Record<string, unknown>) => unknown;
type ProviderComponent = (props: { children: unknown }) => unknown;

export class RenderService implements IService<RenderServiceInput, RenderServiceOutput> {
  readonly name = 'render';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = [];

  private context!: IServiceContext;

  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }

  async execute(input: RenderServiceInput): Promise<RenderServiceOutput> {
    const appEntryPath = resolve(input.appEntry);
    const appRoot = resolve(appEntryPath, '..', '..');
    const runtime = await this.loadReactRuntime(appRoot);
    const appModule = await import(pathToFileURL(appEntryPath).href);
    const App = (appModule.App ?? appModule.default) as AppComponent | undefined;
    if (!App) {
      throw new Error(`Could not resolve App export from ${appEntryPath}`);
    }

    const providers = await this.loadProviders(appEntryPath);
    const skipped = new Set(input.skipRoutes ?? []);
    const pages: RenderServiceOutput['pages'] = [];

    for (const routePath of Object.keys(input.routes)) {
      if (skipped.has(routePath)) {
        this.context.logger.warn(`Skipped route render: ${routePath}`);
        continue;
      }

      const htmlFileName = this.routeToHtmlFileName(routePath);
      const htmlPath = join(input.outputDir, htmlFileName);
      const appNode = this.wrapRoute(runtime, App, routePath, providers);
      const html = runtime.renderToStaticMarkup(appNode);

      await mkdir(dirname(htmlPath), { recursive: true });
      await writeFile(htmlPath, html, 'utf-8');

      const size = html.length;
      pages.push({ route: routePath, path: htmlPath, size });
      this.context.eventBus.emit('html:generated', { route: routePath, path: htmlPath, size });
      this.context.logger.info(`Rendered route ${routePath} -> ${htmlPath}`);
    }

    return { pages };
  }

  async dispose(): Promise<void> {
    // No resources to dispose.
  }

  private wrapRoute(
    runtime: {
      createElement: (...args: unknown[]) => unknown;
      MemoryRouter: unknown;
    },
    App: AppComponent,
    routePath: string,
    providers: ProviderComponent[]
  ): unknown {
    let tree: unknown = runtime.createElement(
      runtime.MemoryRouter as never,
      { initialEntries: [routePath], initialIndex: 0 },
      runtime.createElement(App as never, {})
    );
    for (const Provider of providers) {
      tree = runtime.createElement(Provider as never, { children: tree });
    }
    return tree;
  }

  private routeToHtmlFileName(routePath: string): string {
    if (routePath === '/') return 'index.html';
    return `${routePath.slice(1)}/index.html`;
  }

  private async loadProviders(appEntryPath: string): Promise<ProviderComponent[]> {
    const appSrcDir = resolve(appEntryPath, '..');
    const providers: ProviderComponent[] = [];
    const candidates: Array<{ file: string; exportName: string }> = [
      { file: join(appSrcDir, 'providers', 'theme.tsx'), exportName: 'ThemeProvider' },
      { file: join(appSrcDir, 'providers', 'AdminAuthContext.tsx'), exportName: 'AdminAuthProvider' },
    ];

    for (const candidate of candidates) {
      try {
        await readFile(candidate.file, 'utf-8');
        const mod = await import(pathToFileURL(candidate.file).href);
        const Provider = mod[candidate.exportName] as ProviderComponent | undefined;
        if (Provider) providers.push(Provider);
      } catch {
        // Optional provider: ignore if not present.
      }
    }
    return providers;
  }

  private async loadReactRuntime(appRoot: string): Promise<{
    createElement: (...args: unknown[]) => unknown;
    renderToStaticMarkup: (node: unknown) => string;
    MemoryRouter: unknown;
  }> {
    const appRequire = createRequire(join(appRoot, 'package.json'));
    const reactEntry = appRequire.resolve('react');
    const reactDomServerEntry = appRequire.resolve('react-dom/server');
    const reactRouterEntry = appRequire.resolve('react-router-dom');

    const reactMod = await import(pathToFileURL(reactEntry).href);
    const reactDomServerMod = await import(pathToFileURL(reactDomServerEntry).href);
    const reactRouterMod = await import(pathToFileURL(reactRouterEntry).href);

    const createElement = reactMod.createElement as (...args: unknown[]) => unknown;
    const renderToStaticMarkup = reactDomServerMod.renderToStaticMarkup as (node: unknown) => string;
    const MemoryRouter = reactRouterMod.MemoryRouter;

    if (!createElement || !renderToStaticMarkup || !MemoryRouter) {
      throw new Error('Could not resolve React runtime modules from app root.');
    }

    return { createElement, renderToStaticMarkup, MemoryRouter };
  }
}
