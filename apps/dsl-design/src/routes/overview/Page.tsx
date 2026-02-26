import { OverviewPageView } from '@/blocks';
import { context } from '@/data/context';

export function OverviewPage() {
  return (
    <OverviewPageView
      navItems={context.navItems}
      sidebarLinks={context.sidebarLinks}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      overview={context.overview}
    />
  );
}
