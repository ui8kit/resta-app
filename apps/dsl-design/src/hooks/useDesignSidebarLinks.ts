import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { SidebarLink } from '@/types';
import type { DashboardSidebarLink } from '@/types';

export function useDesignSidebarLinks(sidebarLinks: SidebarLink[]): DashboardSidebarLink[] {
  const { pathname } = useLocation();

  return useMemo(
    () =>
      sidebarLinks.map((link) => ({
        ...link,
        active: pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)),
      })),
    [sidebarLinks, pathname]
  );
}
