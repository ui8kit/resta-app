import { TypographyPageView } from '@/blocks';
import { context } from '@/data/context';

export function TypographyPage() {
  return (
    <TypographyPageView
      navItems={context.navItems}
      sidebarLinks={context.sidebarLinks}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      section={context.typography}
    />
  );
}
