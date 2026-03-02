export type KanbanCard = {
  id: string;
  title: string;
  value?: string;
  assignee?: string;
};

export type KanbanColumn = {
  id: string;
  label: string;
  cards: KanbanCard[];
};

export type KanbanFixture = {
  title: string;
  subtitle: string;
  columns: KanbanColumn[];
};
