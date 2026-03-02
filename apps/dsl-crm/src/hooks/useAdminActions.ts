import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { context } from '@/data/context';
import { useAdminAuth } from '@/providers/AdminAuthContext';

export function useAdminActions(onExport?: () => void, onImport?: (data: unknown) => void) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogout() {
    logout();
    navigate('/admin');
  }

  function handleExport() {
    const data = {
      dashboard: context.dashboard,
      tasks: context.tasks,
      kanban: context.kanban,
      reports: context.reports,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'crm-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
    onExport?.();
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        onImport?.(data);
      } catch {
        console.error('Invalid JSON');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  return {
    fileInputRef,
    handleLogout,
    handleExport,
    handleImportClick,
    handleFileChange,
  };
}
