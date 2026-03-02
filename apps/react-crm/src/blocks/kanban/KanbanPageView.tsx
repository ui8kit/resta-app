import { CrmLayout } from '@/layouts';
import { Block, Stack, Grid, Title, Text, Card, CardHeader, CardTitle, CardContent, Group } from '@/components';
import { context } from '@/data/context';
import type { KanbanColumn, KanbanCard } from '@/types';
import { Fragment } from 'react';

interface KanbanPageViewProps {
  title?: string;
  subtitle?: string;
}

export function KanbanPageView(props: KanbanPageViewProps) {
  const { title, subtitle } = props;

  const data = context.domains.crm.kanban;
  const resolvedTitle = title ?? data.title;
  const resolvedSubtitle = subtitle ?? data.subtitle;
  const columns = data.columns;

  return (
    <CrmLayout>
      <Block component="section" data-class="kanban-section">
        <Stack gap="8" data-class="kanban-stack">
          <Stack gap="2" data-class="kanban-header">
            {title ? (<><Title fontSize="3xl" fontWeight="bold" data-class="kanban-title">{title}</Title></>) : null}
            {subtitle ? (<><Text fontSize="base" textColor="muted-foreground" data-class="kanban-subtitle">{subtitle}</Text></>) : null}
          </Stack>
          <Grid grid="cols-3" gap="6" data-class="kanban-board">
            {columns.map((column, index) => (
            <Fragment key={column.id ?? index}>
            <Stack gap="4" data-class="kanban-column"><Group justify="between" items="center" data-class="kanban-column-header">{column.label ? (<><Title order={4} fontSize="base" fontWeight="semibold" data-class="kanban-column-label">{column.label}</Title></>) : null}<Text fontSize="sm" textColor="muted-foreground" data-class="kanban-column-count">{column.cards.length}</Text></Group><Stack gap="4" data-class="kanban-column-cards">{(column.cards ?? []).map((card, index) => (
            <Fragment key={card.id ?? index}>
            <Card data-class="kanban-card"><CardHeader data-class="kanban-card-header">{card.title ? (<><CardTitle order={5} data-class="kanban-card-title">{card.title}</CardTitle></>) : null}</CardHeader><CardContent data-class="kanban-card-content"><Group justify="between" data-class="kanban-card-meta">{card.value ? (<><Text fontSize="sm" fontWeight="semibold" textColor="primary" data-class="kanban-card-value">{card.value}</Text></>) : null}{card.assignee ? (<><Text fontSize="xs" textColor="muted-foreground" data-class="kanban-card-assignee">{card.assignee}</Text></>) : null}</Group></CardContent></Card>
            </Fragment>
            ))}</Stack></Stack>
            </Fragment>
            ))}
          </Grid>
        </Stack>
      </Block>
    </CrmLayout>
  );
}
