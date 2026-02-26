import { createContext, EMPTY_ARRAY } from '@ui8kit/sdk/source/data';
import type { NavItem, SidebarLink } from '@/types/navigation';
import { loadFixturesContextInput } from './adapters/fixtures.adapter';
import type { CanonicalContextInput } from './adapters/types';

const input = loadFixturesContextInput();
const navItems = input.navigation.navItems as NavItem[];
const sidebarLinks = (input.navigation.sidebarLinks ?? EMPTY_ARRAY) as SidebarLink[];

const baseContext = createContext<{
  overview: CanonicalContextInput['fixtures']['overview'];
  colors: CanonicalContextInput['fixtures']['colors'];
  tokens: CanonicalContextInput['fixtures']['tokens'];
  components: CanonicalContextInput['fixtures']['components'];
  primitives: CanonicalContextInput['fixtures']['primitives'];
  widgets: CanonicalContextInput['fixtures']['widgets'];
  typography: CanonicalContextInput['fixtures']['typography'];
  typographyScale: CanonicalContextInput['fixtures']['typographyScale'];
  pages: CanonicalContextInput['fixtures']['pages'];
  widgetsDemo: CanonicalContextInput['fixtures']['widgetsDemo'];
  pagesPreview: CanonicalContextInput['fixtures']['pagesPreview'];
}>({
  site: input.site,
  page: input.page,
  navItems,
  sidebarLinks,
  adminSidebarLinks: [],
  adminSidebarLabel: 'Design',
  dynamicRoutePatterns: [],
  fixtures: {
    overview: input.fixtures.overview,
    colors: input.fixtures.colors,
    tokens: input.fixtures.tokens,
    components: input.fixtures.components,
    primitives: input.fixtures.primitives,
    widgets: input.fixtures.widgets,
    typography: input.fixtures.typography,
    typographyScale: input.fixtures.typographyScale,
    pages: input.fixtures.pages,
    widgetsDemo: input.fixtures.widgetsDemo,
    pagesPreview: input.fixtures.pagesPreview,
  },
});

const websiteDomain = Object.freeze({
  page: input.page.website ?? [],
  overview: baseContext.fixtures.overview,
  colors: baseContext.fixtures.colors,
  tokens: baseContext.fixtures.tokens,
  components: baseContext.fixtures.components,
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
  overview: baseContext.fixtures.overview,
  colors: baseContext.fixtures.colors,
  tokens: baseContext.fixtures.tokens,
  components: baseContext.fixtures.components,
  primitives: baseContext.fixtures.primitives,
  widgets: baseContext.fixtures.widgets,
  typography: baseContext.fixtures.typography,
  typographyScale: baseContext.fixtures.typographyScale,
  pages: baseContext.fixtures.pages,
  widgetsDemo: baseContext.fixtures.widgetsDemo,
  pagesPreview: baseContext.fixtures.pagesPreview,
  domains: Object.freeze({
    website: websiteDomain,
  }),
});
