export type NavItem = {
  id: string;
  title: string;
  url: string;
};

export type SidebarLink = {
  id?: string;
  label: string;
  href: string;
};

export type DashboardSidebarLink = {
  id?: string;
  label: string;
  href: string;
  active?: boolean;
};
