import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Block, Box, Stack, Group, Sheet, Container } from '@ui8kit/core';
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
    <Box flex="" shrink="0" className="md:hidden" data-class="crm-mobile-menu-trigger">
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
        <Stack gap="4" data-class="crm-mobile-sheet-content">
          <Box
            data-class="crm-mobile-sheet-inner"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) {
                const cb = document.getElementById('crm-mobile-sheet') as HTMLInputElement | null;
                if (cb) cb.checked = false;
              }
            }}
          >
            <Sidebar>{resolvedSidebar}</Sidebar>
          </Box>
        </Stack>
      </Sheet>
    </Box>
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
      <Group flex="" grow items="stretch" data-class="crm-layout-body">
        <Sidebar
          position="left"
          className="hidden md:flex"
          border="r"
          bg="card"
          w="64"
          shrink="0"
          py="4"
          overflow="auto"
          data-class="crm-sidebar"
        >
          {resolvedSidebar}
        </Sidebar>
        <Group component="main" flex="col" grow overflow="auto" data-class="crm-main">
          <Container>
            {children}
          </Container>
        </Group>
      </Group>
    </Block>
  );
}
