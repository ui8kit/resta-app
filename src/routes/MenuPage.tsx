import { SidebarContent, MenuPageView } from '@/blocks';
import { context } from '@/data/context';

export function MenuPage() {
  return (
    <MenuPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      menu={context.menu}
    />
  );
}
