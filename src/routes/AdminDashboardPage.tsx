import { Navigate } from 'react-router-dom';
import { AdminDashboardPageView } from '@/blocks';
import { useAdminAuth } from '@/providers/AdminAuthContext';

export function AdminDashboardPage() {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminDashboardPageView />;
}
