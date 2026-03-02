export type TaskBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const PRIORITY_VARIANT: Record<string, TaskBadgeVariant> = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
};

export const STATUS_VARIANT: Record<string, TaskBadgeVariant> = {
  todo: 'outline',
  'in-progress': 'secondary',
  done: 'default',
};
