import { createContext, EMPTY_ARRAY } from '@ui8kit/sdk/source/data';
import type {
  DashboardSidebarLink,
  NavItem,
  SidebarLink,
} from '@ui8kit/sdk/source/data';
import { loadFixturesContextInput } from './adapters/fixtures.adapter';
import type { CanonicalContextInput } from './adapters/types';

const input = loadFixturesContextInput();
const page = input.page;
const navItems = input.navigation.navItems as NavItem[];
const sidebarLinks = (input.navigation.sidebarLinks ?? EMPTY_ARRAY) as SidebarLink[];
const adminSidebarLinks = (input.navigation.adminSidebarLinks ?? EMPTY_ARRAY) as DashboardSidebarLink[];
const adminSidebarLabel = input.navigation.labels?.adminSidebarLabel ?? 'Admin';

const baseContext = createContext<{
  dashboard: CanonicalContextInput['fixtures']['dashboard'];
  tasks: CanonicalContextInput['fixtures']['tasks'];
  kanban: CanonicalContextInput['fixtures']['kanban'];
  reports: CanonicalContextInput['fixtures']['reports'];
  admin: CanonicalContextInput['fixtures']['admin'];
}>({
  site: input.site,
  page: input.page,
  navItems,
  sidebarLinks,
  adminSidebarLinks,
  adminSidebarLabel,
  dynamicRoutePatterns: [],
  fixtures: {
    dashboard: input.fixtures.dashboard,
    tasks: input.fixtures.tasks,
    kanban: input.fixtures.kanban,
    reports: input.fixtures.reports,
    admin: input.fixtures.admin,
  },
});

const crmDomain = Object.freeze({
  page: page.crm ?? [],
  dashboard: baseContext.fixtures.dashboard,
  tasks: baseContext.fixtures.tasks,
  kanban: baseContext.fixtures.kanban,
  reports: baseContext.fixtures.reports,
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
  dashboard: baseContext.fixtures.dashboard,
  tasks: baseContext.fixtures.tasks,
  kanban: baseContext.fixtures.kanban,
  reports: baseContext.fixtures.reports,
  admin: baseContext.fixtures.admin,
  domains: Object.freeze({
    crm: crmDomain,
    admin: adminDomain,
  }),
});
