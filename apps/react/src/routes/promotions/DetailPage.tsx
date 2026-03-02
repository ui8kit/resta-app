import { useParams } from 'react-router-dom';
import { SidebarContent, PromotionDetailPageView } from '@/blocks';
import { context } from '@/data/context';

export function PromotionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const item = context.promotions.items?.find((i) => (i.slug ?? i.id) === slug);

  return (
    <PromotionDetailPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      item={item}
    />
  );
}
