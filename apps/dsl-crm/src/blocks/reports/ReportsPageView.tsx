import { CrmLayout } from '@/layouts';
import { Block, Stack, Grid, Title, Text, Card, CardHeader, CardTitle, CardContent, Group } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { context } from '@/data/context';
import type { ReportSection, ReportItem } from '@/types';

export interface ReportsPageViewProps {
  title?: string;
  subtitle?: string;
}

export function ReportsPageView({ title, subtitle }: ReportsPageViewProps) {
  const data = context.domains.crm.reports;
  const resolvedTitle = title ?? data.title;
  const resolvedSubtitle = subtitle ?? data.subtitle;
  const sections = data.sections;

  return (
    <CrmLayout>
      <Block component="section" data-class="reports-section">
        <Stack gap="8" data-class="reports-stack">
          <Stack gap="2" data-class="reports-header">
            <If test="title" value={!!resolvedTitle}>
              <Title fontSize="3xl" fontWeight="bold" data-class="reports-title">
                <Var name="title" value={resolvedTitle} />
              </Title>
            </If>
            <If test="subtitle" value={!!resolvedSubtitle}>
              <Text fontSize="base" textColor="muted-foreground" data-class="reports-subtitle">
                <Var name="subtitle" value={resolvedSubtitle} />
              </Text>
            </If>
          </Stack>

          <Grid grid="cols-1" gap="8" data-class="reports-sections">
            <Loop each="sections" as="section" data={sections}>
              {(section: ReportSection) => (
                <Card data-class="reports-section-card">
                  <CardHeader data-class="reports-section-header">
                    <If test="section.title" value={!!section.title}>
                      <CardTitle order={3} data-class="reports-section-title">
                        <Var name="section.title" value={section.title} />
                      </CardTitle>
                    </If>
                  </CardHeader>
                  <CardContent data-class="reports-section-content">
                    <Grid grid="cols-4" gap="4" data-class="reports-items-grid">
                      <Loop each="section.items" as="item" data={section.items}>
                        {(item: ReportItem) => (
                          <Stack gap="1" data-class="reports-item">
                            <If test="item.label" value={!!item.label}>
                              <Text fontSize="sm" textColor="muted-foreground" data-class="reports-item-label">
                                <Var name="item.label" value={item.label} />
                              </Text>
                            </If>
                            <Group items="end" data-class="reports-item-value-row">
                              <If test="item.value" value={!!item.value}>
                                <Text fontSize="2xl" fontWeight="bold" data-class="reports-item-value">
                                  <Var name="item.value" value={item.value} />
                                </Text>
                              </If>
                            </Group>
                          </Stack>
                        )}
                      </Loop>
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Loop>
          </Grid>
        </Stack>
      </Block>
    </CrmLayout>
  );
}
