export type NavItem = {
  id: string;
  title: string;
  url: string;
};

export type SidebarLink = {
  label: string;
  href: string;
};

export type DashboardSidebarLink = {
  label: string;
  href: string;
  active?: boolean;
};
