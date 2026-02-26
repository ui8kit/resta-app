import { ComponentsPageView } from '@/blocks';
import { context } from '@/data/context';

export function ComponentsPage() {
  return (
    <ComponentsPageView
      navItems={context.navItems}
      sidebarLinks={context.sidebarLinks}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      components={context.components}
    />
  );
}
