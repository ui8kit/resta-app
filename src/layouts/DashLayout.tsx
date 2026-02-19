import type { ReactNode } from 'react';
import { AdminLayout } from './AdminLayout';
import { DashSidebar } from '@/blocks';

const DESIGN_LINKS = [
  { label: 'Overview', href: '/design' },
  { label: 'Colors', href: '/design/colors' },
  { label: 'Typography', href: '/design/typography' },
  { label: 'Components', href: '/design/components' },
  { label: 'Widgets', href: '/design/widgets' },
];

export interface DashLayoutProps {
  children?: ReactNode;
  activeHref?: string;
}

export function DashLayout({ children, activeHref }: DashLayoutProps) {
  const links = DESIGN_LINKS.map((l) => ({ ...l, active: l.href === activeHref }));
  const sidebar = <DashSidebar label="Design System" links={links} />;
  return <AdminLayout sidebar={sidebar}>{children}</AdminLayout>;
}
