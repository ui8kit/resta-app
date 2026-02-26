import { ColorsPageView } from '@/blocks';
import { context } from '@/data/context';

export function ColorsPage() {
  return (
    <ColorsPageView
      navItems={context.navItems}
      sidebarLinks={context.sidebarLinks}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      colors={context.colors}
    />
  );
}
