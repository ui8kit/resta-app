import { createContext, EMPTY_ARRAY } from '@ui8kit/sdk/source/data';
import type { NavItem, SidebarLink } from '@/types/navigation';
import { loadFixturesContextInput } from './adapters/fixtures.adapter';
import type { CanonicalContextInput } from './adapters/types';

const input = loadFixturesContextInput();
const navItems = input.navigation.navItems as NavItem[];
const sidebarLinks = (input.navigation.sidebarLinks ?? EMPTY_ARRAY) as SidebarLink[];

const baseContext = createContext<{
  tokens: CanonicalContextInput['fixtures']['tokens'];
  primitives: CanonicalContextInput['fixtures']['primitives'];
  widgets: CanonicalContextInput['fixtures']['widgets'];
  typography: CanonicalContextInput['fixtures']['typography'];
  pages: CanonicalContextInput['fixtures']['pages'];
}>({
  site: input.site,
  page: input.page,
  navItems,
  sidebarLinks,
  adminSidebarLinks: [],
  adminSidebarLabel: 'Design',
  dynamicRoutePatterns: [],
  fixtures: {
    tokens: input.fixtures.tokens,
    primitives: input.fixtures.primitives,
    widgets: input.fixtures.widgets,
    typography: input.fixtures.typography,
    pages: input.fixtures.pages,
  },
});

const websiteDomain = Object.freeze({
  page: input.page.website ?? [],
  tokens: baseContext.fixtures.tokens,
  primitives: baseContext.fixtures.primitives,
  widgets: baseContext.fixtures.widgets,
  typography: baseContext.fixtures.typography,
  pages: baseContext.fixtures.pages,
  site: baseContext.site,
  navItems: baseContext.navItems,
  sidebarLinks: baseContext.sidebarLinks,
});

export const context = Object.freeze({
  ...baseContext,
  tokens: baseContext.fixtures.tokens,
  primitives: baseContext.fixtures.primitives,
  widgets: baseContext.fixtures.widgets,
  typography: baseContext.fixtures.typography,
  pages: baseContext.fixtures.pages,
  domains: Object.freeze({
    website: websiteDomain,
  }),
});
