import { CrmLayout } from '@/layouts';
import { Block, Stack, Grid, Title, Text, Card, CardHeader, CardTitle, CardContent, Group, Badge } from '@/components';
import { context } from '@/data/context';
import type { DashboardMetric, DashboardActivity } from '@/types';
import { Fragment } from 'react';

interface DashboardPageViewProps {
  title?: string;
  subtitle?: string;
}

export function DashboardPageView(props: DashboardPageViewProps) {
  const { title, subtitle } = props;

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
            {title ? (
              <>
                <Title fontSize="3xl" fontWeight="bold" data-class="dashboard-title">
                  {title}
                </Title>
              </>
            ) : null}
            {subtitle ? (
              <>
                <Text fontSize="base" textColor="muted-foreground" data-class="dashboard-subtitle">
                  {subtitle}
                </Text>
              </>
            ) : null}
          </Stack>
          <Grid grid="cols-4" gap="4" data-class="dashboard-metrics">
            {metrics.map((metric, index) => (
              <Fragment key={metric.id ?? index}>
                <Card data-class="dashboard-metric-card">
                  <CardHeader data-class="dashboard-metric-header">
                    {metric.label ? (
                      <>
                        <CardTitle order={4} data-class="dashboard-metric-label">
                          {metric.label}
                        </CardTitle>
                      </>
                    ) : null}
                  </CardHeader>
                  <CardContent data-class="dashboard-metric-content">
                    <Group items="end" gap="2" data-class="dashboard-metric-row">
                      {metric.value ? (
                        <>
                          <Text fontSize="3xl" fontWeight="bold" data-class="dashboard-metric-value">
                            {metric.value}
                          </Text>
                        </>
                      ) : null}
                      {metric.trendUp ? (
                        <>
                          <Badge variant="default" data-class="dashboard-metric-trend-up">
                            {metric.trend}
                          </Badge>
                        </>
                      ) : null}
                      {!metric.trendUp ? (
                        <>
                          <Badge variant="destructive" data-class="dashboard-metric-trend-down">
                            {metric.trend}
                          </Badge>
                        </>
                      ) : null}
                    </Group>
                  </CardContent>
                </Card>
              </Fragment>
            ))}
          </Grid>
          <Card data-class="dashboard-activity-card">
            <CardHeader data-class="dashboard-activity-header">
              <CardTitle order={3} data-class="dashboard-activity-title">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent data-class="dashboard-activity-content">
              <Stack gap="4" data-class="dashboard-activity-list">
                {activity.map((item, index) => (
                  <Fragment key={item.id ?? index}>
                    <Group justify="between" items="center" data-class="dashboard-activity-item">
                      {item.description ? (
                        <>
                          <Text fontSize="sm" data-class="dashboard-activity-description">
                            {item.description}
                          </Text>
                        </>
                      ) : null}
                      {item.time ? (
                        <>
                          <Text fontSize="xs" textColor="muted-foreground" data-class="dashboard-activity-time">
                            {item.time}
                          </Text>
                        </>
                      ) : null}
                    </Group>
                  </Fragment>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Block>
    </CrmLayout>
  );
}
