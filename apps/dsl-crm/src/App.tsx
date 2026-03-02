import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from '@/routes/landing/DashboardPage';
import { TasksPage } from '@/routes/tasks/TasksPage';
import { KanbanPage } from '@/routes/kanban/KanbanPage';
import { ReportsPage } from '@/routes/reports/ReportsPage';
import { LoginPage } from '@/routes/admin/LoginPage';
import { DashboardPage as AdminDashboardPage } from '@/routes/admin/DashboardPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/kanban" element={<KanbanPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/admin" element={<LoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
    </Routes>
  );
}
