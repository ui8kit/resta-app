import { MainLayout } from '@/layouts';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text } from '@/components';
import { DomainNavButton } from '@/partials';
import type { BlogPost, NavItem } from '@/types';
import { Fragment } from 'react';

interface BlogPageViewProps {
  navItems?: NavItem[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  blog: { title?: string; subtitle?: string; posts?: BlogPost[] };
}

export function BlogPageView(props: BlogPageViewProps) {
  const { navItems, sidebar, headerTitle, headerSubtitle, blog } = props;

  const posts = blog.posts ?? [];

  return (
    <MainLayout mode={"full"} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <Block component="section" data-class="blog-section">
        <Block py="16" data-class="blog-header">
          {blog.title ? (<><Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="blog-title">{blog.title}</Text></>) : null}
          {blog.subtitle ? (<><Text fontSize="lg" textColor="muted-foreground" textAlign="center" max="w-xl" mx="auto" data-class="blog-subtitle">{blog.subtitle}</Text></>) : null}
        </Block>
        <Grid cols="1-2-3" gap="6" data-class="blog-grid">
          {posts.map((post, index) => (
          <Fragment key={post.id ?? index}>
          <Card data-class="blog-post-card"><CardHeader>{post.title ? (<><CardTitle order={4} data-class="blog-post-title">{post.title}</CardTitle></>) : null}{post.excerpt ? (<><CardDescription data-class="blog-post-excerpt">{post.excerpt}</CardDescription></>) : null}{post.author ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="blog-post-meta">{post.author}</Text></>) : null}{post.date ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="blog-post-date">{post.date}</Text></>) : null}</CardHeader><CardContent data-class="blog-post-actions"><DomainNavButton href={`/blog/${post.slug}`} size={"sm"} data-class={"blog-post-link"}>Read More</DomainNavButton></CardContent></Card>
          </Fragment>
          ))}
        </Grid>
      </Block>
    </MainLayout>
  );
}
