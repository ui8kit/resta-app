import { CrmLayout } from '@/layouts';
import { Block, Stack, Grid, Title, Text, Card, CardHeader, CardTitle, CardContent, Group } from '@/components';
import { context } from '@/data/context';
import type { ReportSection, ReportItem } from '@/types';
import { Fragment } from 'react';

interface ReportsPageViewProps {
  title?: string;
  subtitle?: string;
}

export function ReportsPageView(props: ReportsPageViewProps) {
  const { title, subtitle } = props;

  const data = context.domains.crm.reports;
  const resolvedTitle = title ?? data.title;
  const resolvedSubtitle = subtitle ?? data.subtitle;
  const sections = data.sections;

  return (
    <CrmLayout>
      <Block component="section" data-class="reports-section">
        <Stack gap="8" data-class="reports-stack">
          <Stack gap="2" data-class="reports-header">
            {title ? (
              <>
                <Title fontSize="3xl" fontWeight="bold" data-class="reports-title">
                  {title}
                </Title>
              </>
            ) : null}
            {subtitle ? (
              <>
                <Text fontSize="base" textColor="muted-foreground" data-class="reports-subtitle">
                  {subtitle}
                </Text>
              </>
            ) : null}
          </Stack>
          <Grid grid="cols-1" gap="8" data-class="reports-sections">
            {sections.map((section, index) => (
              <Fragment key={section.id ?? index}>
                <Card data-class="reports-section-card">
                  <CardHeader data-class="reports-section-header">
                    {section.title ? (
                      <>
                        <CardTitle order={3} data-class="reports-section-title">
                          {section.title}
                        </CardTitle>
                      </>
                    ) : null}
                  </CardHeader>
                  <CardContent data-class="reports-section-content">
                    <Grid grid="cols-4" gap="4" data-class="reports-items-grid">
                      {(section.items ?? []).map((item, index) => (
                        <Fragment key={item.id ?? index}>
                          <Stack gap="1" data-class="reports-item">
                            {item.label ? (
                              <>
                                <Text fontSize="sm" textColor="muted-foreground" data-class="reports-item-label">
                                  {item.label}
                                </Text>
                              </>
                            ) : null}
                            <Group items="end" data-class="reports-item-value-row">
                              {item.value ? (
                                <>
                                  <Text fontSize="2xl" fontWeight="bold" data-class="reports-item-value">
                                    {item.value}
                                  </Text>
                                </>
                              ) : null}
                            </Group>
                          </Stack>
                        </Fragment>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Fragment>
            ))}
          </Grid>
        </Stack>
      </Block>
    </CrmLayout>
  );
}
