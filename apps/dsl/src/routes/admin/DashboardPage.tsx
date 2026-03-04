import { Navigate } from 'react-router-dom';
import { AdminDashboardPageView } from '@/blocks';
import { useAdminAuth } from '@/providers/AdminAuthContext';
import { useAdminActions } from '@/hooks';

export function DashboardPage() {
  const { isAuthenticated } = useAdminAuth();
  const adminActions = useAdminActions();

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <AdminDashboardPageView
      fileInputRef={adminActions.fileInputRef}
      handleLogout={adminActions.handleLogout}
      handleExport={adminActions.handleExport}
      handleImportClick={adminActions.handleImportClick}
      handleFileChange={adminActions.handleFileChange}
    />
  );
}
