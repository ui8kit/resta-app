import { PagesPageView } from '@/blocks';
import { context } from '@/data/context';

export function PagesPage() {
  return (
    <PagesPageView
      navItems={context.navItems}
      sidebarLinks={context.sidebarLinks}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      section={context.pages}
    />
  );
}
