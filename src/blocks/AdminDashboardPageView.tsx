import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { DashSidebar } from '@/blocks';
import {
  Block,
  Stack,
  Title,
  Text,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@ui8kit/core';
import { useAdminAuth } from '@/providers/AdminAuthContext';
import { context } from '@/data/context';

export interface AdminDashboardPageViewProps {
  onExport?: () => void;
  onImport?: (data: unknown) => void;
}

export function AdminDashboardPageView({ onExport, onImport }: AdminDashboardPageViewProps) {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogout() {
    logout();
    navigate('/admin');
  }

  function handleExport() {
    const data = {
      menu: context.menu,
      recipes: context.recipes,
      blog: context.blog,
      promotions: context.promotions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resta-data.json';
    a.click();
    URL.revokeObjectURL(url);
    onExport?.();
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
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
    e.target.value = '';
  }

  const sidebar = (
    <DashSidebar label={context.adminSidebarLabel} links={context.getAdminSidebarLinks('/admin/dashboard')} />
  );

  return (
    <AdminLayout sidebar={sidebar}>
      <Block component="main" py="8" data-class="admin-dashboard-section">
        <Stack gap="8" max="w-4xl" mx="auto" px="4">
          <Stack flex="" justify="between" items="center" data-class="admin-dashboard-header">
            <Title fontSize="2xl" fontWeight="bold" data-class="admin-dashboard-title">
              Admin Dashboard
            </Title>
            <Button variant="outline" size="sm" onClick={handleLogout} data-class="admin-dashboard-logout">
              Logout
            </Button>
          </Stack>
          <Text fontSize="sm" textColor="muted-foreground" data-class="admin-dashboard-description">
            Export or import site data as JSON. Import updates in-memory state only (no persistence without backend).
          </Text>
          <Stack gap="4" data-class="admin-dashboard-actions">
            <Card data-class="admin-export-card">
              <CardHeader>
                <CardTitle order={4} data-class="admin-export-title">
                  Export Data
                </CardTitle>
                <CardDescription data-class="admin-export-description">
                  Download menu, recipes, blog, and promotions as JSON.
                </CardDescription>
              </CardHeader>
              <CardContent data-class="admin-export-actions">
                <Button onClick={handleExport} data-class="admin-export-button">
                  Export JSON
                </Button>
              </CardContent>
            </Card>
            <Card data-class="admin-import-card">
              <CardHeader>
                <CardTitle order={4} data-class="admin-import-title">
                  Import Data
                </CardTitle>
                <CardDescription data-class="admin-import-description">
                  Upload a JSON file. Data updates in-memory for this session only.
                </CardDescription>
              </CardHeader>
              <CardContent data-class="admin-import-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Button variant="outline" onClick={handleImportClick} data-class="admin-import-button">
                  Import JSON
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </Block>
    </AdminLayout>
  );
}
