import { CrmLayout } from '@/layouts';
import { Block, Stack, Grid, Title, Text, Card, CardHeader, CardTitle, CardContent, Group } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { context } from '@/data/context';
import type { KanbanColumn, KanbanCard } from '@/types';

export interface KanbanPageViewProps {
  title?: string;
  subtitle?: string;
}

export function KanbanPageView({ title, subtitle }: KanbanPageViewProps) {
  const data = context.domains.crm.kanban;
  const resolvedTitle = title ?? data.title;
  const resolvedSubtitle = subtitle ?? data.subtitle;
  const columns = data.columns;

  return (
    <CrmLayout>
      <Block component="section" data-class="kanban-section">
        <Stack gap="8" data-class="kanban-stack">
          <Stack gap="2" data-class="kanban-header">
            <If test="title" value={!!resolvedTitle}>
              <Title fontSize="3xl" fontWeight="bold" data-class="kanban-title">
                <Var name="title" value={resolvedTitle} />
              </Title>
            </If>
            <If test="subtitle" value={!!resolvedSubtitle}>
              <Text fontSize="base" textColor="muted-foreground" data-class="kanban-subtitle">
                <Var name="subtitle" value={resolvedSubtitle} />
              </Text>
            </If>
          </Stack>

          <Grid grid="cols-3" gap="6" data-class="kanban-board">
            <Loop each="columns" as="column" data={columns}>
              {(column: KanbanColumn) => (
                <Stack gap="4" data-class="kanban-column">
                  <Group justify="between" items="center" data-class="kanban-column-header">
                    <If test="column.label" value={!!column.label}>
                      <Title order={4} fontSize="base" fontWeight="semibold" data-class="kanban-column-label">
                        <Var name="column.label" value={column.label} />
                      </Title>
                    </If>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="kanban-column-count">
                      {column.cards.length}
                    </Text>
                  </Group>
                  <Stack gap="4" data-class="kanban-column-cards">
                    <Loop each="column.cards" as="card" data={column.cards}>
                      {(card: KanbanCard) => (
                        <Card data-class="kanban-card">
                          <CardHeader data-class="kanban-card-header">
                            <If test="card.title" value={!!card.title}>
                              <CardTitle order={5} data-class="kanban-card-title">
                                <Var name="card.title" value={card.title} />
                              </CardTitle>
                            </If>
                          </CardHeader>
                          <CardContent data-class="kanban-card-content">
                            <Group justify="between" data-class="kanban-card-meta">
                              <If test="card.value" value={!!card.value}>
                                <Text fontSize="sm" fontWeight="semibold" textColor="primary" data-class="kanban-card-value">
                                  <Var name="card.value" value={card.value ?? ''} />
                                </Text>
                              </If>
                              <If test="card.assignee" value={!!card.assignee}>
                                <Text fontSize="xs" textColor="muted-foreground" data-class="kanban-card-assignee">
                                  <Var name="card.assignee" value={card.assignee ?? ''} />
                                </Text>
                              </If>
                            </Group>
                          </CardContent>
                        </Card>
                      )}
                    </Loop>
                  </Stack>
                </Stack>
              )}
            </Loop>
          </Grid>
        </Stack>
      </Block>
    </CrmLayout>
  );
}
