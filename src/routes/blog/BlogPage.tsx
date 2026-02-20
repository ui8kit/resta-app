import { SidebarContent, BlogPageView } from '@/blocks';
import { context } from '@/data/context';

export function BlogPage() {
  return (
    <BlogPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      blog={context.blog}
    />
  );
}
