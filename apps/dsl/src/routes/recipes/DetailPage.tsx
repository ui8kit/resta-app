import { useParams } from 'react-router-dom';
import { SidebarContent, RecipeDetailPageView } from '@/blocks';
import { context } from '@/data/context';

export function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const recipe = context.recipes.items?.find((r) => r.slug === slug);

  return (
    <RecipeDetailPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      recipe={recipe}
    />
  );
}
