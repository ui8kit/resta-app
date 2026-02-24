import type { DashboardSidebarLink, NavItem, SidebarLink } from '../types/navigation';
import { loadFixturesContextInput } from './adapters/fixtures.adapter';
import { loadWpGraphqlContextInput } from './adapters/wpgraphql.adapter';
import { loadShopifyContextInput } from './adapters/shopify.adapter';
import type { CanonicalContextInput } from './adapters/types';

function createAppContext<TFixtures extends Record<string, unknown>>(input: {
  site: CanonicalContextInput['site'];
  page: CanonicalContextInput['page'];
  navItems: NavItem[];
  sidebarLinks: SidebarLink[];
  adminSidebarLinks: DashboardSidebarLink[];
  adminSidebarLabel: string;
  dynamicRoutePatterns: string[];
  fixtures: TFixtures;
}) {
  return Object.freeze({
    ...input,
    getAdminSidebarLinks: (currentPath?: string) =>
      input.adminSidebarLinks.map((link) => ({
        ...link,
        active: currentPath ? link.href === currentPath : link.active,
      })),
  });
}

function resolveContextInput(): CanonicalContextInput {
  const source = (import.meta.env.VITE_DATA_SOURCE ?? 'fixtures') as 'fixtures' | 'wpgraphql' | 'shopify';
  if (source === 'wpgraphql') {
    return loadWpGraphqlContextInput();
  }
  if (source === 'shopify') {
    return loadShopifyContextInput();
  }
  return loadFixturesContextInput();
}

const input = resolveContextInput();
const page = input.page;
const navItems = input.navigation.navItems as NavItem[];
const sidebarLinks = (input.navigation.sidebarLinks ?? []) as SidebarLink[];
const adminSidebarLinks = (input.navigation.adminSidebarLinks ?? []) as DashboardSidebarLink[];
const adminSidebarLabel = input.navigation.labels?.adminSidebarLabel ?? 'Admin';

const baseContext = createAppContext<{
  landing: CanonicalContextInput['fixtures']['landing'];
  menu: CanonicalContextInput['fixtures']['menu'];
  recipes: CanonicalContextInput['fixtures']['recipes'];
  blog: CanonicalContextInput['fixtures']['blog'];
  promotions: CanonicalContextInput['fixtures']['promotions'];
  admin: CanonicalContextInput['fixtures']['admin'];
}>({
  site: input.site,
  page: input.page,
  navItems,
  sidebarLinks,
  adminSidebarLinks,
  adminSidebarLabel,
  dynamicRoutePatterns: ['/menu/:id', '/recipes/:slug', '/blog/:slug', '/promotions/:id'],
  fixtures: {
    landing: input.fixtures.landing,
    menu: input.fixtures.menu,
    recipes: input.fixtures.recipes,
    blog: input.fixtures.blog,
    promotions: input.fixtures.promotions,
    admin: input.fixtures.admin,
  },
});

const websiteDomain = Object.freeze({
  page: page.website ?? [],
  landing: baseContext.fixtures.landing,
  menu: baseContext.fixtures.menu,
  recipes: baseContext.fixtures.recipes,
  blog: baseContext.fixtures.blog,
  promotions: baseContext.fixtures.promotions,
  site: baseContext.site,
  navItems: baseContext.navItems,
  sidebarLinks: baseContext.sidebarLinks,
});

const adminDomain = Object.freeze({
  page: page.admin ?? [],
  admin: baseContext.fixtures.admin,
  adminSidebarLinks: baseContext.adminSidebarLinks,
  adminSidebarLabel: baseContext.adminSidebarLabel,
  getAdminSidebarLinks: baseContext.getAdminSidebarLinks,
});

export const context = Object.freeze({
  ...baseContext,
  landing: baseContext.fixtures.landing,
  menu: baseContext.fixtures.menu,
  recipes: baseContext.fixtures.recipes,
  blog: baseContext.fixtures.blog,
  promotions: baseContext.fixtures.promotions,
  admin: baseContext.fixtures.admin,
  domains: Object.freeze({
    website: websiteDomain,
    admin: adminDomain,
  }),
});
