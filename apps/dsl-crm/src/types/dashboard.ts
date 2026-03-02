export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
};

export type DashboardActivity = {
  id: string;
  type: string;
  description: string;
  time: string;
};

export type DashboardFixture = {
  title: string;
  subtitle: string;
  metrics: DashboardMetric[];
  recentActivity: DashboardActivity[];
};
