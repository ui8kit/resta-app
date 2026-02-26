import type { NavItem, SidebarLink } from '@/types/navigation';
import type { DesignSectionFixture, OverviewFixture } from '@/types/design';
import type { ColorsFixture, ComponentsFixture, TypographyScaleFixture, WidgetsDemoFixture, PagesPreviewFixture } from '@/types/fixtures';

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
    overview: OverviewFixture;
    colors: ColorsFixture;
    tokens: DesignSectionFixture;
    components: ComponentsFixture;
    primitives: DesignSectionFixture;
    widgets: DesignSectionFixture;
    typography: DesignSectionFixture;
    typographyScale: TypographyScaleFixture;
    pages: DesignSectionFixture;
    widgetsDemo: WidgetsDemoFixture;
    pagesPreview: PagesPreviewFixture;
  };
};
