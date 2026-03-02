import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Block, Box, Sheet } from '@ui8kit/core';
import { DashSidebar } from '@/blocks';
import { context } from '@/data/context';
import { Sidebar } from '@/partials/Sidebar';
import { Header } from '@/partials/Header';
import type { DashboardSidebarLink } from '@/types';

export interface CrmLayoutProps {
  children?: ReactNode;
  sidebar?: ReactNode;
}

export function CrmLayout({ children, sidebar }: CrmLayoutProps) {
  const location = useLocation();
  const links: DashboardSidebarLink[] = context.domains.crm.sidebarLinks.map((link) => ({
    ...link,
    active: location.pathname === link.href,
  }));
  const resolvedSidebar = sidebar ?? <DashSidebar links={links} />;

  const mobileMenu = (
    <Block className="flex md:hidden shrink-0" data-class="crm-mobile-menu-trigger">
      <Sheet
        id="crm-mobile-sheet"
        side="left"
        size="sm"
        title="Menu"
        openLabel="Open menu"
        closeLabel="Close menu"
        triggerVariant="ghost"
        triggerSize="sm"
        showTrigger
      >
        <Block
          data-class="crm-mobile-sheet-content"
          className="mt-4"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) {
              const cb = document.getElementById('crm-mobile-sheet') as HTMLInputElement | null;
              if (cb) cb.checked = false;
            }
          }}
        >
          <Sidebar>{resolvedSidebar}</Sidebar>
        </Block>
      </Sheet>
    </Block>
  );

  return (
    <Block flex="col" min-h="screen" data-class="crm-layout">
      <Header
        title="CRM"
        subtitle="Customer Relationship Manager"
        navItems={[]}
        dataClass="crm-layout-header"
        beforeThemeToggle={mobileMenu}
      />
      <Block flex="" data-class="crm-layout-body" className="flex-1">
        <Block
          component="aside"
          data-class="crm-sidebar"
          className="hidden md:flex w-64 shrink-0 border-r border-border"
        >
          <Box w="full" h="full" data-class="crm-sidebar-content" className="overflow-auto">
            <Sidebar>{resolvedSidebar}</Sidebar>
          </Box>
        </Block>
        <Block component="main" flex="col" data-class="crm-main" className="flex-1 overflow-auto">
          {children}
        </Block>
      </Block>
    </Block>
  );
}
