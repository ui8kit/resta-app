import { PrimitivesPageView } from '@/blocks';
import { context } from '@/data/context';

export function PrimitivesPage() {
  return (
    <PrimitivesPageView
      navItems={context.navItems}
      sidebarLinks={context.sidebarLinks}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      section={context.primitives}
    />
  );
}
