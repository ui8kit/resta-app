import type { ReactNode } from 'react';
import { Block, Group, Stack, Text, Title, Button } from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';
import type { NavItem, SidebarLink } from '@/types/navigation';

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
  const links = sidebarLinks ?? [];
  const topNav = navItems ?? [];

  return (
    <Block flex="col" min-h="screen" data-class="design-layout">
      <Block component="header" border="b" bg="background" data-class="design-layout-header">
        <Group justify="between" items="center" px="8" py="4" data-class="design-layout-header-content">
          <Stack gap="0" data-class="design-layout-brand">
            <Title order={3} data-class="design-layout-title">
              <Var name="headerTitle" value={headerTitle ?? 'RestA Design System'} />
            </Title>
            <Text fontSize="sm" textColor="muted-foreground" data-class="design-layout-subtitle">
              <Var name="headerSubtitle" value={headerSubtitle ?? 'Dashboard-style documentation'} />
            </Text>
          </Stack>
          <If test="topNav.length > 0" value={topNav.length > 0}>
            <Group gap="2" data-class="design-layout-top-nav">
              <Loop each="navItems" as="item" data={topNav}>
                {(item: NavItem) => (
                  <Button href={item.url} variant="link" size="sm" data-class="design-layout-top-nav-link">
                    <Var name="item.title" value={item.title} />
                  </Button>
                )}
              </Loop>
            </Group>
          </If>
        </Group>
      </Block>

      <Block flex="row" data-class="design-layout-body">
        <If test="links.length > 0" value={links.length > 0}>
          <Block component="aside" border="r" bg="card" p="6" data-class="design-layout-sidebar">
            <Stack gap="2" data-class="design-layout-sidebar-links">
              <Loop each="sidebarLinks" as="link" data={links}>
                {(link: SidebarLink) => (
                  <Button href={link.href} variant="ghost" justify="start" size="sm" data-class="design-layout-sidebar-link">
                    <Var name="link.label" value={link.label} />
                  </Button>
                )}
              </Loop>
            </Stack>
          </Block>
        </If>

        <Block component="main" flex="1" p="8" data-class="design-layout-main">
          {children}
        </Block>
      </Block>
    </Block>
  );
}
