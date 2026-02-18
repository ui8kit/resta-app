import { useParams } from 'react-router-dom';
import { SidebarContent, MenuDetailPageView } from '@/blocks';
import { context } from '@/data/context';

export function MenuDetailPage() {
  const { id } = useParams<{ id: string }>();
  const item = context.menu.items?.find((i) => i.id === id);

  return (
    <MenuDetailPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      item={item}
    />
  );
}
