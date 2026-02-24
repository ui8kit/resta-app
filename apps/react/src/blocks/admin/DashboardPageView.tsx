import { AdminLayout } from '@/layouts';
import { DashSidebar } from '@/blocks';
import { Block, Stack, Group, Grid, Title, Text, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components';
import { context } from '@/data/context';
import { useAdminActions } from '@/hooks';

interface AdminDashboardPageViewProps {
  onExport?: () => void;
  onImport?: (data: unknown) => void;
}

export function AdminDashboardPageView(props: AdminDashboardPageViewProps) {
  const { onExport, onImport } = props;

  const {
    fileInputRef,
    handleLogout,
    handleExport,
    handleImportClick,
    handleFileChange,
  } = useAdminActions(onExport, onImport);
  const sidebar = (
    <DashSidebar label={context.adminSidebarLabel} links={context.getAdminSidebarLinks('/admin/dashboard')} />
  );

  return (
    <AdminLayout sidebar={sidebar}>
      <Block component="main" py="8" data-class="admin-dashboard-section">
        <Stack gap="8" max="w-4xl" mx="auto" px="4">
          <Group w="full" justify="between" items="center" data-class="admin-dashboard-header">
            <Title fontSize="2xl" fontWeight="bold" data-class="admin-dashboard-title">
              Admin Dashboard
            </Title>
            <Button variant="outline" size="sm" onClick={handleLogout} data-class="admin-dashboard-logout">
              Logout
            </Button>
          </Group>
          <Text fontSize="sm" textColor="muted-foreground" data-class="admin-dashboard-description">
            Export or import site data as JSON. Import updates in-memory state only (no persistence without backend).
          </Text>
          <Grid cols="1-2" gap="4" w="full" data-class="admin-dashboard-actions">
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
                <Button onClick={handleExport} rounded="sm" size="sm" data-class="admin-export-button">
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
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
                <Button variant="ghost" onClick={handleImportClick} rounded="sm" size="sm" data-class="admin-import-button">
                  Import JSON
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Stack>
      </Block>
    </AdminLayout>
  );
}
