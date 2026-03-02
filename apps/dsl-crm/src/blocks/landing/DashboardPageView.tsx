import { CrmLayout } from '@/layouts';
import { Block, Stack, Grid, Title, Text, Card, CardHeader, CardTitle, CardContent, Group, Badge } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { context } from '@/data/context';
import type { DashboardMetric, DashboardActivity } from '@/types';

export interface DashboardPageViewProps {
  title?: string;
  subtitle?: string;
}

export function DashboardPageView({ title, subtitle }: DashboardPageViewProps) {
  const data = context.domains.crm.dashboard;
  const resolvedTitle = title ?? data.title;
  const resolvedSubtitle = subtitle ?? data.subtitle;
  const metrics = data.metrics;
  const activity = data.recentActivity;

  return (
    <CrmLayout>
      <Block component="section" data-class="dashboard-section">
        <Stack gap="8" data-class="dashboard-stack">
          <Stack gap="2" data-class="dashboard-header">
            <If test="title" value={!!resolvedTitle}>
              <Title fontSize="3xl" fontWeight="bold" data-class="dashboard-title">
                <Var name="title" value={resolvedTitle} />
              </Title>
            </If>
            <If test="subtitle" value={!!resolvedSubtitle}>
              <Text fontSize="base" textColor="muted-foreground" data-class="dashboard-subtitle">
                <Var name="subtitle" value={resolvedSubtitle} />
              </Text>
            </If>
          </Stack>

          <Grid grid="cols-4" gap="4" data-class="dashboard-metrics">
            <Loop each="metrics" as="metric" data={metrics}>
              {(metric: DashboardMetric) => (
                <Card data-class="dashboard-metric-card">
                  <CardHeader data-class="dashboard-metric-header">
                    <If test="metric.label" value={!!metric.label}>
                      <CardTitle order={4} data-class="dashboard-metric-label">
                        <Var name="metric.label" value={metric.label} />
                      </CardTitle>
                    </If>
                  </CardHeader>
                  <CardContent data-class="dashboard-metric-content">
                    <Group items="end" gap="2" data-class="dashboard-metric-row">
                      <If test="metric.value" value={!!metric.value}>
                        <Text fontSize="3xl" fontWeight="bold" data-class="dashboard-metric-value">
                          <Var name="metric.value" value={metric.value} />
                        </Text>
                      </If>
                      <If test="metric.trendUp" value={metric.trendUp}>
                        <Badge variant="default" data-class="dashboard-metric-trend-up">
                          <Var name="metric.trend" value={metric.trend} />
                        </Badge>
                      </If>
                      <If test="!metric.trendUp" value={!metric.trendUp}>
                        <Badge variant="destructive" data-class="dashboard-metric-trend-down">
                          <Var name="metric.trend" value={metric.trend} />
                        </Badge>
                      </If>
                    </Group>
                  </CardContent>
                </Card>
              )}
            </Loop>
          </Grid>

          <Card data-class="dashboard-activity-card">
            <CardHeader data-class="dashboard-activity-header">
              <CardTitle order={3} data-class="dashboard-activity-title">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent data-class="dashboard-activity-content">
              <Stack gap="4" data-class="dashboard-activity-list">
                <Loop each="activity" as="item" data={activity}>
                  {(item: DashboardActivity) => (
                    <Group justify="between" items="center" data-class="dashboard-activity-item">
                      <If test="item.description" value={!!item.description}>
                        <Text fontSize="sm" data-class="dashboard-activity-description">
                          <Var name="item.description" value={item.description} />
                        </Text>
                      </If>
                      <If test="item.time" value={!!item.time}>
                        <Text fontSize="xs" textColor="muted-foreground" data-class="dashboard-activity-time">
                          <Var name="item.time" value={item.time} />
                        </Text>
                      </If>
                    </Group>
                  )}
                </Loop>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Block>
    </CrmLayout>
  );
}
