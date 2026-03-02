import type { DashboardSidebarLink, NavItem, PageFixture, SidebarLink, SiteInfo } from '@ui8kit/sdk/source/data';
import type { DashboardFixture } from '@/types/dashboard';
import type { TasksFixture } from '@/types/tasks';
import type { KanbanFixture } from '@/types/kanban';
import type { ReportsFixture } from '@/types/reports';

export type AdminFixture = {
  exportSchema: Record<string, string>;
};

export type NavigationFixture = {
  navItems: NavItem[];
  sidebarLinks: SidebarLink[];
  adminSidebarLinks: DashboardSidebarLink[];
  labels?: {
    adminSidebarLabel?: string;
  };
};

export type CanonicalContextInput = {
  site: SiteInfo;
  page: PageFixture['page'];
  navigation: NavigationFixture;
  fixtures: {
    dashboard: DashboardFixture;
    tasks: TasksFixture;
    kanban: KanbanFixture;
    reports: ReportsFixture;
    admin: AdminFixture;
  };
};
