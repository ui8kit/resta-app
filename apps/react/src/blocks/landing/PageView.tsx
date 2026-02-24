import type { ReactNode } from 'react';
import { MainLayout } from '@/layouts';
import { HeroBlock } from '@/blocks';

interface LandingPageViewProps {
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

export function LandingPageView(props: LandingPageViewProps) {
  const { mode, navItems, sidebar, headerTitle, headerSubtitle, landing } = props;

  return (
    <MainLayout mode={mode ?? 'full'} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <HeroBlock {...landing} />
    </MainLayout>
  );
}
