import type { ReactNode } from 'react';
import { Block, Box } from '@ui8kit/core';
import { If } from '@ui8kit/dsl';
import { DesignHeader } from '@/partials/DesignHeader';
import { DashSidebar } from '@/blocks/DashSidebar';
import { useDesignSidebarLinks } from '@/hooks';
import type { NavItem, SidebarLink } from '@/types';

export interface DesignLayoutProps {
  children: ReactNode;
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
}

export function DesignLayout({
  children,
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
}: DesignLayoutProps) {
  const links = useDesignSidebarLinks(sidebarLinks ?? []);
  const topNav = navItems ?? [];

  return (
    <Block flex="col" min-h="screen" data-class="design-layout">
      <DesignHeader
        title={headerTitle ?? 'RestA Design System'}
        subtitle={headerSubtitle ?? 'Dashboard-style documentation'}
        navItems={topNav}
        data-class="design-layout-header"
      />

      <Block flex="row" data-class="design-layout-body">
        <If test="links.length > 0" value={links.length > 0}>
          <Block
            component="aside"
            data-class="design-layout-sidebar"
            border="r"
            bg="card"
            w="64"
            shrink="0"
          >
            <Box w="full" h="full" data-class="design-sidebar-content">
              <DashSidebar
                label="Design System"
                links={links}
                data-class="design-layout-sidebar-nav"
              />
            </Box>
          </Block>
        </If>

        <Block component="main" flex="1" p="8" data-class="design-layout-main">
          {children}
        </Block>
      </Block>
    </Block>
  );
}
