import { WidgetsPageView } from '@/blocks';
import { context } from '@/data/context';

export function WidgetsPage() {
  return (
    <WidgetsPageView
      navItems={context.navItems}
      sidebarLinks={context.sidebarLinks}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      widgetsDemo={context.widgetsDemo}
    />
  );
}
