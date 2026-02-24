import { SidebarContent, RecipesPageView } from '@/blocks';
import { context } from '@/data/context';

export function RecipesPage() {
  return (
    <RecipesPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      recipes={context.recipes}
    />
  );
}
