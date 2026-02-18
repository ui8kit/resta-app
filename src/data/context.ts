import { createContext, EMPTY_ARRAY } from '@ui8kit/sdk/source/data';
import siteData from '../../fixtures/shared/site.json';
import navigationData from '../../fixtures/shared/navigation.json';
import pageData from '../../fixtures/shared/page.json';
import landingData from '../../fixtures/landing.json';
import menuData from '../../fixtures/menu.json';
import recipesData from '../../fixtures/recipes.json';
import blogData from '../../fixtures/blog.json';
import promotionsData from '../../fixtures/promotions.json';
import adminData from '../../fixtures/admin.json';
import type {
  DashboardSidebarLink,
  NavItem,
  PageFixture,
  SidebarLink,
  SiteInfo,
} from '@ui8kit/sdk/source/data';

const site = siteData as SiteInfo;
const page = (pageData as PageFixture).page;
const navItems = navigationData.navItems as NavItem[];
const sidebarLinks = (navigationData.sidebarLinks ?? EMPTY_ARRAY) as SidebarLink[];
const adminSidebarLinks = (navigationData.adminSidebarLinks ?? EMPTY_ARRAY) as DashboardSidebarLink[];
const adminSidebarLabel = navigationData.labels?.adminSidebarLabel ?? 'Admin';

const baseContext = createContext<{
  landing: typeof landingData;
  menu: typeof menuData;
  recipes: typeof recipesData;
  blog: typeof blogData;
  promotions: typeof promotionsData;
  admin: typeof adminData;
}>({
  site,
  page,
  navItems,
  sidebarLinks,
  adminSidebarLinks,
  adminSidebarLabel,
  dynamicRoutePatterns: ['/menu/:id', '/recipes/:slug', '/blog/:slug', '/promotions/:id'],
  fixtures: {
    landing: landingData,
    menu: menuData,
    recipes: recipesData,
    blog: blogData,
    promotions: promotionsData,
    admin: adminData,
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
