import type { ReactNode } from 'react';
import { MainLayout } from '@/layouts';
import { SidebarContent } from '@/blocks';
import { HeroBlock } from './HeroBlock';

export interface LandingPageViewProps {
  mode?: 'full' | 'with-sidebar' | 'sidebar-left';
  navItems?: { id: string; title: string; url: string }[];
  sidebar: ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  landing: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaUrl?: string;
    secondaryCtaText?: string;
    secondaryCtaUrl?: string;
  };
}

export function LandingPageView({
  mode,
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  landing,
}: LandingPageViewProps) {
  return (
    <MainLayout
      mode={mode ?? 'full'}
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <HeroBlock {...landing} />
    </MainLayout>
  );
}
