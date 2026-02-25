import type { NavItem, SidebarLink } from '@/types/navigation';
import type { DesignSectionFixture } from '@/types/design';

export type SiteInfo = {
  title: string;
  subtitle?: string;
  [key: string]: unknown;
};

export type PageEntry = {
  id: string;
  domain: string;
  title: string;
  path: string;
  component: string;
};

export type PageFixture = {
  page: {
    website: PageEntry[];
    admin?: PageEntry[];
  };
};

export type NavigationFixture = {
  navItems: NavItem[];
  sidebarLinks: SidebarLink[];
  adminSidebarLinks?: SidebarLink[];
  labels?: {
    adminSidebarLabel?: string;
  };
};

export type CanonicalContextInput = {
  site: SiteInfo;
  page: PageFixture['page'];
  navigation: NavigationFixture;
  fixtures: {
    tokens: DesignSectionFixture;
    primitives: DesignSectionFixture;
    widgets: DesignSectionFixture;
    typography: DesignSectionFixture;
    pages: DesignSectionFixture;
  };
};
