import { CrmLayout } from '@/layouts';
import { Block, Stack, Grid, Title, Text, Card, CardHeader, CardTitle, CardContent, Group, Badge } from '@/components';
import { context } from '@/data/context';
import type { Task } from '@/types';
import { Fragment } from 'react';

interface TasksPageViewProps {
  title?: string;
  subtitle?: string;
}

const PRIORITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  'todo': 'outline',
  'in-progress': 'secondary',
  'done': 'default',
};

export function TasksPageView(props: TasksPageViewProps) {
  const { title, subtitle } = props;

  const data = context.domains.crm.tasks;
  const resolvedTitle = title ?? data.title;
  const resolvedSubtitle = subtitle ?? data.subtitle;
  const items = data.items;

  return (
    <CrmLayout>
      <Block component="section" data-class="tasks-section">
        <Stack gap="8" data-class="tasks-stack">
          <Stack gap="2" data-class="tasks-header">
            {title ? (<><Title fontSize="3xl" fontWeight="bold" data-class="tasks-title">{title}</Title></>) : null}
            {subtitle ? (<><Text fontSize="base" textColor="muted-foreground" data-class="tasks-subtitle">{subtitle}</Text></>) : null}
          </Stack>
          <Grid grid="cols-1" gap="4" data-class="tasks-grid">
            {items.map((task, index) => (
            <Fragment key={task.id ?? index}>
            <Card data-class="task-card"><CardHeader data-class="task-card-header"><Group justify="between" items="start" data-class="task-card-meta">{task.title ? (<><CardTitle order={4} data-class="task-card-title">{task.title}</CardTitle></>) : null}<Group gap="2" data-class="task-card-badges">{task.priority ? (<><Badge variant={PRIORITY_VARIANT[task.priority] ?? 'outline'} data-class="task-priority">{task.priority}</Badge></>) : null}{task.status ? (<><Badge variant={STATUS_VARIANT[task.status] ?? 'outline'} data-class="task-status">{task.status}</Badge></>) : null}</Group></Group></CardHeader><CardContent data-class="task-card-content"><Group gap="6" data-class="task-card-details">{task.assignee ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="task-assignee">{task.assignee}</Text></>) : null}{task.dueDate ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="task-due-date">{task.dueDate}</Text></>) : null}</Group></CardContent></Card>
            </Fragment>
            ))}
          </Grid>
        </Stack>
      </Block>
    </CrmLayout>
  );
}
