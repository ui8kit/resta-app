import { CrmLayout } from '@/layouts';
import { Block, Stack, Grid, Title, Text, Card, CardHeader, CardTitle, CardContent, Group, Badge } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { context } from '@/data/context';
import type { Task } from '@/types';
import { PRIORITY_VARIANT, STATUS_VARIANT } from '@/constants';

export interface TasksPageViewProps {
  title?: string;
  subtitle?: string;
}

export function TasksPageView({ title, subtitle }: TasksPageViewProps) {
  const data = context.domains.crm.tasks;
  const resolvedTitle = title ?? data.title;
  const resolvedSubtitle = subtitle ?? data.subtitle;
  const items = data.items;

  return (
    <CrmLayout>
      <Block component="section" data-class="tasks-section">
        <Stack gap="8" data-class="tasks-stack">
          <Stack gap="2" data-class="tasks-header">
            <If test="title" value={!!resolvedTitle}>
              <Title fontSize="3xl" fontWeight="bold" data-class="tasks-title">
                <Var name="title" value={resolvedTitle} />
              </Title>
            </If>
            <If test="subtitle" value={!!resolvedSubtitle}>
              <Text fontSize="base" textColor="muted-foreground" data-class="tasks-subtitle">
                <Var name="subtitle" value={resolvedSubtitle} />
              </Text>
            </If>
          </Stack>

          <Grid grid="cols-1" gap="4" data-class="tasks-grid">
            <Loop each="items" as="task" data={items}>
              {(task: Task) => (
                <Card data-class="task-card">
                  <CardHeader data-class="task-card-header">
                    <Group justify="between" items="start" data-class="task-card-meta">
                      <If test="task.title" value={!!task.title}>
                        <CardTitle order={4} data-class="task-card-title">
                          <Var name="task.title" value={task.title} />
                        </CardTitle>
                      </If>
                      <Group gap="2" data-class="task-card-badges">
                        <If test="task.priority" value={!!task.priority}>
                          <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'outline'} data-class="task-priority">
                            <Var name="task.priority" value={task.priority} />
                          </Badge>
                        </If>
                        <If test="task.status" value={!!task.status}>
                          <Badge variant={STATUS_VARIANT[task.status] ?? 'outline'} data-class="task-status">
                            <Var name="task.status" value={task.status} />
                          </Badge>
                        </If>
                      </Group>
                    </Group>
                  </CardHeader>
                  <CardContent data-class="task-card-content">
                    <Group gap="6" data-class="task-card-details">
                      <If test="task.assignee" value={!!task.assignee}>
                        <Text fontSize="sm" textColor="muted-foreground" data-class="task-assignee">
                          <Var name="task.assignee" value={task.assignee ?? ''} />
                        </Text>
                      </If>
                      <If test="task.dueDate" value={!!task.dueDate}>
                        <Text fontSize="sm" textColor="muted-foreground" data-class="task-due-date">
                          <Var name="task.dueDate" value={task.dueDate ?? ''} />
                        </Text>
                      </If>
                    </Group>
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
