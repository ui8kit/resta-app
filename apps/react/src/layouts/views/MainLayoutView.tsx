import { Fragment, ReactNode } from 'react';
import { Block, Container, Grid, Stack } from '@/components';
import { Header } from '../../partials/Header';
import { Footer } from '../../partials/Footer';
import { Sidebar } from '../../partials/Sidebar';
import type { FooterSection, LayoutMode, NavItem } from '@/types';

interface MainLayoutViewProps {
  children: ReactNode;
  mode?: LayoutMode;
  sidebar?: ReactNode;
  navItems?: NavItem[];
  footerSections?: FooterSection[];
  headerTitle?: string;
  headerSubtitle?: string;
  footerCopyright?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function MainLayoutView(props: MainLayoutViewProps) {
  const { children, mode, sidebar, navItems, footerSections, headerTitle, headerSubtitle, footerCopyright, showHeader, showFooter } = props;

  const resolvedMode = mode ?? 'with-sidebar';
  const hasSidebarLayout = resolvedMode === 'with-sidebar' || resolvedMode === 'sidebar-left';
  const isSidebarLeft = resolvedMode === 'sidebar-left';
  const shouldRenderFull = resolvedMode === 'full' || !sidebar;

  return (
    <Fragment>
      {showHeader ?? true ? (<><Header title={headerTitle ?? 'RestA'} subtitle={headerSubtitle ?? 'Restaurant & Bar'} navItems={navItems ?? []} dataClass={"main-layout-header"} /></>) : null}
      <Block component="main" flex="1" py="8" data-class="main-layout-content">
        {hasSidebarLayout ? (<>{!!sidebar ? (<><Container data-class="main-layout-container"><Grid grid="cols-3" gap="8" data-class="main-layout-grid">{isSidebarLeft ? (<><Stack col="span-2" gap="6" order="2" data-class="main-layout-main">{children}</Stack><Stack col="span-1" order="1" data-class="main-layout-sidebar-wrapper"><Sidebar position={"left"}>{sidebar}</Sidebar></Stack></>) : null}{!isSidebarLeft ? (<><Stack col="span-2" gap="6" order="1" data-class="main-layout-main">{children}</Stack><Stack col="span-1" order="2" data-class="main-layout-sidebar-wrapper"><Sidebar position={"right"}>{sidebar}</Sidebar></Stack></>) : null}</Grid></Container></>) : null}</>) : null}
        {shouldRenderFull ? (<><Container flex="col" gap="6" data-class="main-layout-container">{children}</Container></>) : null}
      </Block>
      {showFooter ?? true ? (<><Footer copyright={footerCopyright ?? '© 2025 RestA. All rights reserved.'} sections={footerSections ?? []} dataClass={"main-layout-footer"} /></>) : null}
    </Fragment>
  );
}
