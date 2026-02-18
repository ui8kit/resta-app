import { SidebarContent, LandingPageView } from '@/blocks';
import { context } from '@/data/context';

export function LandingPage() {
  return (
    <LandingPageView
      mode="full"
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      landing={context.landing}
    />
  );
}
