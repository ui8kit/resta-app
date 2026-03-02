import type { CanonicalContextInput } from './types';
import siteData from '../../../fixtures/shared/site.json';
import navigationData from '../../../fixtures/shared/navigation.json';
import pageData from '../../../fixtures/shared/page.json';
import dashboardData from '../../../fixtures/dashboard.json';
import tasksData from '../../../fixtures/tasks.json';
import kanbanData from '../../../fixtures/kanban.json';
import reportsData from '../../../fixtures/reports.json';
import adminData from '../../../fixtures/admin.json';
import type { PageFixture, SiteInfo } from '@ui8kit/sdk/source/data';
import type { DashboardFixture } from '@/types/dashboard';
import type { TasksFixture } from '@/types/tasks';
import type { KanbanFixture } from '@/types/kanban';
import type { ReportsFixture } from '@/types/reports';

export function loadFixturesContextInput(): CanonicalContextInput {
  return {
    site: siteData as SiteInfo,
    page: (pageData as PageFixture).page,
    navigation: navigationData as CanonicalContextInput['navigation'],
    fixtures: {
      dashboard: dashboardData as DashboardFixture,
      tasks: tasksData as TasksFixture,
      kanban: kanbanData as KanbanFixture,
      reports: reportsData as ReportsFixture,
      admin: adminData as CanonicalContextInput['fixtures']['admin'],
    },
  };
}
