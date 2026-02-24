import type { ReactNode } from 'react';
import { Block, Box, Sheet } from '@/components';
import { Sidebar } from '@/partials/Sidebar';
import { Header } from '@/partials/Header';

interface AdminLayoutProps {
  children?: ReactNode;
  sidebar?: ReactNode;
}

export function AdminLayout(props: AdminLayoutProps) {
  const { children, sidebar } = props;

  const mobileMenu = sidebar ? (
    <Block className="flex md:hidden shrink-0" data-class="admin-mobile-menu-trigger">
      <Sheet
        id="admin-mobile-sheet"
        side="left"
        size="sm"
        title="Menu"
        openLabel="Open menu"
        closeLabel="Close menu"
        triggerVariant="link"
        triggerSize="sm"
        showTrigger
      >
        <Block
          data-class="admin-mobile-sheet-content"
          className="mt-4"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('a')) {
              const cb = document.getElementById('admin-mobile-sheet') as HTMLInputElement | null;
              if (cb) cb.checked = false;
            }
          }}
        >
          <Sidebar>{sidebar}</Sidebar>
        </Block>
      </Sheet>
    </Block>
  ) : undefined;

  return (
    <Block flex="col" min-h="screen" data-class="admin-layout">
      <Header title={"RestA"} subtitle={"Admin"} navItems={[]} dataClass={"admin-layout-header"} beforeThemeToggle={mobileMenu} />
      <Block flex="" data-class="admin-layout-body" className="flex-1">
        {sidebar ? (<><Block component="aside" data-class="admin-sidebar" className="hidden md:flex w-64 shrink-0 border-r border-border"><Box w="full" h="full" data-class="admin-sidebar-content" className="overflow-auto"><Sidebar>{sidebar}</Sidebar></Box></Block></>) : null}
        <Block component="main" flex="col" data-class="admin-main" className="flex-1 overflow-auto">
          {children}
        </Block>
      </Block>
    </Block>
  );
}
