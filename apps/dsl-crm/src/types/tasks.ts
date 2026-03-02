export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: string;
};

export type TasksFixture = {
  title: string;
  subtitle: string;
  items: Task[];
};
