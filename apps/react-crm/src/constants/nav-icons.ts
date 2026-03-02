import { LayoutDashboard, CheckSquare, Columns, BarChart2 } from 'lucide-react';

export const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  tasks: CheckSquare,
  kanban: Columns,
  reports: BarChart2,
};
