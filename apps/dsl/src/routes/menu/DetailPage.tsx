import { useParams } from 'react-router-dom';
import { SidebarContent, MenuDetailPageView } from '@/blocks';
import { context } from '@/data/context';

export function DetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const item = context.menu.items?.find((i) => i.slug === slug);

  return (
    <MenuDetailPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      item={item}
      promotions={context.promotions}
    />
  );
}
