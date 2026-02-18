import type { ReactNode } from 'react';
import { Block, Box } from '@ui8kit/core';
import { If } from '@ui8kit/dsl';
import { Sidebar } from '@/partials/Sidebar';
import { Header } from '@/partials/Header';

export interface AdminLayoutProps {
  children?: ReactNode;
  sidebar?: ReactNode;
}

export function AdminLayout({ children, sidebar }: AdminLayoutProps) {
  return (
    <Block flex="col" min-h="screen" data-class="admin-layout">
      <Header title="RestA" subtitle="Admin" navItems={[]} dataClass="admin-layout-header" />
      <Block flex="" data-class="admin-layout-body" className="flex-1">
        <If test="sidebar" value={!!sidebar}>
          <Block
            component="aside"
            data-class="admin-sidebar"
            className="hidden md:flex w-64 shrink-0 border-r border-border"
          >
            <Box w="full" h="full" data-class="admin-sidebar-content" className="overflow-auto">
              <Sidebar>{sidebar}</Sidebar>
            </Box>
          </Block>
        </If>
        <Block component="main" flex="col" data-class="admin-main" className="flex-1 overflow-auto">
          {children}
        </Block>
      </Block>
    </Block>
  );
}
