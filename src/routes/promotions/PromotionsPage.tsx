import { SidebarContent, PromotionsPageView } from '@/blocks';
import { context } from '@/data/context';

export function PromotionsPage() {
  return (
    <PromotionsPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      promotions={context.promotions}
    />
  );
}
