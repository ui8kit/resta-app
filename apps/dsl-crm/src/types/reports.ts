export type ReportItem = {
  id: string;
  label: string;
  value: string;
};

export type ReportSection = {
  id: string;
  title: string;
  items: ReportItem[];
};

export type ReportsFixture = {
  title: string;
  subtitle: string;
  sections: ReportSection[];
};
