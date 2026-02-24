import type { IService, IServiceContext, RouteConfig } from '../../core/interfaces';
import { join, dirname } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { createNodeFileSystem } from '../../core/filesystem';

export interface ReactSsrServiceInput {
  registryPath: string;
  reactDistDir: string;
  outputDir: string;
  fixturesDir: string;
  routes: Record<string, RouteConfig>;
  routeComponentMap?: Record<string, string>;
}

export interface ReactSsrServiceOutput {
  pages: Array<{
    route: string;
    component: string;
    path: string;
    size: number;
  }>;
}

export interface ReactSsrFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}

export interface ReactSsrServiceOptions {
  fileSystem?: ReactSsrFileSystem;
}

interface RegistryItem {
  name: string;
  type: string;
  sourcePath: string;
  files: Array<{ path: string; target: string }>;
  domain?: string;
}

interface Registry {
  items: RegistryItem[];
}

interface SharedFixtures {
  navItems: Array<{ id: string; title: string; url: string }>;
  sidebarLinks: Array<{ label: string; href: string }>;
  site: { title: string; subtitle: string; description?: string };
}

interface DomainFixtures {
  menu: Record<string, unknown>;
  recipes: Record<string, unknown>;
  blog: Record<string, unknown>;
  promotions: Record<string, unknown>;
  landing: Record<string, unknown>;
  admin: Record<string, unknown>;
}

const DOMAIN_DETAIL_CONFIG: Record<string, {
  componentSuffix: string;
  propName: string;
  collectionKey: string;
  lookupField: string;
}> = {
  menu: { componentSuffix: 'MenuDetailPageView', propName: 'item', collectionKey: 'items', lookupField: 'id' },
  recipes: { componentSuffix: 'RecipeDetailPageView', propName: 'recipe', collectionKey: 'items', lookupField: 'slug' },
  blog: { componentSuffix: 'BlogDetailPageView', propName: 'post', collectionKey: 'posts', lookupField: 'slug' },
  promotions: { componentSuffix: 'PromotionDetailPageView', propName: 'item', collectionKey: 'items', lookupField: 'id' },
};

const ROUTE_COMPONENT_DEFAULTS: Record<string, string> = {
  '/': 'LandingPageView',
  '/menu': 'MenuPageView',
  '/recipes': 'RecipesPageView',
  '/blog': 'BlogPageView',
  '/promotions': 'PromotionsPageView',
  '/admin': 'AdminLoginPageView',
  '/admin/dashboard': 'AdminDashboardPageView',
};

function inferComponentName(route: string): string | null {
  if (ROUTE_COMPONENT_DEFAULTS[route]) {
    return ROUTE_COMPONENT_DEFAULTS[route];
  }

  const segments = route.split('/').filter(Boolean);
  if (segments.length === 2) {
    const domain = segments[0];
    const config = DOMAIN_DETAIL_CONFIG[domain];
    if (config) return config.componentSuffix;
    const capitalized = domain.charAt(0).toUpperCase() + domain.slice(1);
    return `${capitalized}DetailPageView`;
  }

  return null;
}

export class ReactSsrService implements IService<ReactSsrServiceInput, ReactSsrServiceOutput> {
  readonly name = 'react-ssr';
  readonly version = '1.0.0';
  readonly dependencies: readonly string[] = [];

  private context!: IServiceContext;
  private fs: ReactSsrFileSystem;

  constructor(options: ReactSsrServiceOptions = {}) {
    this.fs = options.fileSystem ?? createNodeFileSystem();
  }

  async initialize(context: IServiceContext): Promise<void> {
    this.context = context;
  }

  async execute(input: ReactSsrServiceInput): Promise<ReactSsrServiceOutput> {
    const { registryPath, reactDistDir, outputDir, fixturesDir, routes, routeComponentMap = {} } = input;

    const registryRaw = await this.fs.readFile(registryPath);
    const registry: Registry = JSON.parse(registryRaw);

    const componentIndex = new Map<string, RegistryItem>();
    for (const item of registry.items) {
      componentIndex.set(item.name, item);
    }

    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');

    const shared = this.loadSharedFixtures(fixturesDir);
    const domainData = this.loadDomainFixtures(fixturesDir);

    let ThemeProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
    let AdminAuthProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
    let MemoryRouter: React.ComponentType<{ initialEntries?: string[]; children: React.ReactNode }> | null = null;
    let SidebarContent: React.ComponentType<Record<string, unknown>> | null = null;

    try {
      const themeMod = await import(join(reactDistDir, 'src/providers/theme.tsx'));
      ThemeProvider = themeMod.ThemeProvider;
    } catch (e) {
      this.context.logger.warn(`Could not load ThemeProvider: ${e instanceof Error ? e.message : e}`);
    }

    try {
      const authMod = await import(join(reactDistDir, 'src/providers/AdminAuthContext.tsx'));
      AdminAuthProvider = authMod.AdminAuthProvider;
    } catch (e) {
      this.context.logger.warn(`Could not load AdminAuthProvider: ${e instanceof Error ? e.message : e}`);
    }

    try {
      const routerMod = await import('react-router-dom');
      MemoryRouter = routerMod.MemoryRouter;
    } catch (e) {
      this.context.logger.warn(`Could not load MemoryRouter: ${e instanceof Error ? e.message : e}`);
    }

    try {
      const sidebarMod = await import(join(reactDistDir, 'src/blocks/SidebarContent.tsx'));
      SidebarContent = sidebarMod.SidebarContent;
    } catch (e) {
      this.context.logger.warn(`Could not load SidebarContent: ${e instanceof Error ? e.message : e}`);
    }

    const sidebarElement = SidebarContent
      ? createElement(SidebarContent, { title: 'Quick Links', links: shared.sidebarLinks })
      : null;

    const generatedPages: ReactSsrServiceOutput['pages'] = [];

    for (const [routePath, routeConfig] of Object.entries(routes)) {
      const componentName =
        routeComponentMap[routePath] ?? inferComponentName(routePath);

      if (!componentName) {
        this.context.logger.warn(`No component mapped for route: ${routePath}`);
        continue;
      }

      const registryItem = componentIndex.get(componentName);
      if (!registryItem) {
        this.context.logger.warn(`Component "${componentName}" not found in registry for route: ${routePath}`);
        continue;
      }

      try {
        const componentRelPath = registryItem.files[0]?.path;
        if (!componentRelPath) {
          this.context.logger.warn(`No file entry for component: ${componentName}`);
          continue;
        }

        const componentPath = join(reactDistDir, 'src', componentRelPath);
        const mod = await import(componentPath);
        const Component = mod.default ?? mod[componentName] ?? Object.values(mod).find(
          (v): v is React.ComponentType => typeof v === 'function'
        );

        if (!Component) {
          this.context.logger.warn(`Could not resolve export for component: ${componentName}`);
          continue;
        }

        const props = this.buildProps(routePath, routeConfig, componentName, shared, domainData, sidebarElement);

        let element = createElement(Component as React.ComponentType, props);

        if (MemoryRouter) {
          element = createElement(MemoryRouter, { initialEntries: [routePath] }, element);
        }
        if (AdminAuthProvider) {
          element = createElement(AdminAuthProvider, null, element);
        }
        if (ThemeProvider) {
          element = createElement(ThemeProvider, null, element);
        }

        const html = renderToStaticMarkup(element);

        const htmlFileName = this.routeToHtmlFileName(routePath);
        const htmlPath = join(outputDir, htmlFileName);

        await this.fs.mkdir(dirname(htmlPath));
        await this.fs.writeFile(htmlPath, html);

        generatedPages.push({
          route: routePath,
          component: componentName,
          path: htmlPath,
          size: html.length,
        });

        this.context.eventBus.emit('ssr:rendered', {
          route: routePath,
          component: componentName,
          path: htmlPath,
          size: html.length,
        });

        this.context.logger.info(`SSR: ${routePath} -> ${componentName} (${html.length} bytes)`);
      } catch (error) {
        this.context.logger.warn(
          `SSR failed for ${routePath} (${componentName}): ${error instanceof Error ? error.message : error}`
        );
      }
    }

    return { pages: generatedPages };
  }

  async dispose(): Promise<void> {}

  private buildProps(
    routePath: string,
    routeConfig: RouteConfig,
    componentName: string,
    shared: SharedFixtures,
    domainData: DomainFixtures,
    sidebarElement: React.ReactElement | null,
  ): Record<string, unknown> {
    const baseProps: Record<string, unknown> = {
      navItems: shared.navItems,
      sidebar: sidebarElement,
      headerTitle: shared.site.title,
      headerSubtitle: shared.site.subtitle,
      ...routeConfig.data,
    };

    if (componentName === 'AdminLoginPageView' || componentName === 'AdminDashboardPageView') {
      return { headerTitle: shared.site.title, ...routeConfig.data };
    }

    if (componentName === 'LandingPageView') {
      return { ...baseProps, landing: domainData.landing };
    }

    if (componentName === 'MenuPageView') {
      return { ...baseProps, menu: domainData.menu, promotions: domainData.promotions };
    }

    if (componentName === 'RecipesPageView') {
      return { ...baseProps, recipes: domainData.recipes };
    }

    if (componentName === 'BlogPageView') {
      return { ...baseProps, blog: domainData.blog };
    }

    if (componentName === 'PromotionsPageView') {
      return { ...baseProps, promotions: domainData.promotions };
    }

    const segments = routePath.split('/').filter(Boolean);
    if (segments.length === 2) {
      const domain = segments[0] as keyof DomainFixtures;
      const itemSlug = segments[1];
      const detailConfig = DOMAIN_DETAIL_CONFIG[domain];

      if (detailConfig && domainData[domain]) {
        const fixture = domainData[domain] as Record<string, unknown>;
        const collection = (fixture[detailConfig.collectionKey] ?? []) as Array<Record<string, unknown>>;
        const item = collection.find((i) => i[detailConfig.lookupField] === itemSlug);

        const detailProps: Record<string, unknown> = { ...baseProps };
        detailProps[detailConfig.propName] = item;

        if (domain === 'menu') {
          detailProps.promotions = domainData.promotions;
        }

        return detailProps;
      }
    }

    return baseProps;
  }

  private loadSharedFixtures(fixturesDir: string): SharedFixtures {
    const defaults: SharedFixtures = {
      navItems: [],
      sidebarLinks: [],
      site: { title: '', subtitle: '' },
    };

    try {
      const navPath = join(fixturesDir, 'shared', 'navigation.json');
      if (existsSync(navPath)) {
        const nav = JSON.parse(readFileSync(navPath, 'utf-8'));
        defaults.navItems = nav.navItems ?? [];
        defaults.sidebarLinks = nav.sidebarLinks ?? [];
      }
    } catch { /* use defaults */ }

    try {
      const sitePath = join(fixturesDir, 'shared', 'site.json');
      if (existsSync(sitePath)) {
        defaults.site = JSON.parse(readFileSync(sitePath, 'utf-8'));
      }
    } catch { /* use defaults */ }

    return defaults;
  }

  private loadDomainFixtures(fixturesDir: string): DomainFixtures {
    const domains = ['menu', 'recipes', 'blog', 'promotions', 'landing', 'admin'] as const;
    const result: Record<string, Record<string, unknown>> = {};

    for (const domain of domains) {
      try {
        const filePath = join(fixturesDir, `${domain}.json`);
        if (existsSync(filePath)) {
          result[domain] = JSON.parse(readFileSync(filePath, 'utf-8'));
        } else {
          result[domain] = {};
        }
      } catch {
        result[domain] = {};
      }
    }

    return result as unknown as DomainFixtures;
  }

  private routeToHtmlFileName(routePath: string): string {
    if (routePath === '/') return 'index.html';
    return `${routePath.slice(1)}/index.html`;
  }
}
