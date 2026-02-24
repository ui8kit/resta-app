import { useParams } from 'react-router-dom';
import { SidebarContent, BlogDetailPageView } from '@/blocks';
import { context } from '@/data/context';

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = context.blog.posts?.find((p) => p.slug === slug);

  return (
    <BlogDetailPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      post={post}
    />
  );
}
