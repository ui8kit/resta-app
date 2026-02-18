import { MainLayout } from '@/layouts';
import { SidebarContent } from '@/blocks';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  image?: string;
  date?: string;
  author?: string;
};

export interface BlogPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  blog: { title?: string; subtitle?: string; posts?: BlogPost[] };
}

export function BlogPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  blog,
}: BlogPageViewProps) {
  const posts = blog.posts ?? [];
  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" data-class="blog-section">
        <Block py="16" data-class="blog-header">
          <If test="blog.title" value={!!blog.title}>
            <Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="blog-title">
              <Var name="blog.title" value={blog.title} />
            </Text>
          </If>
          <If test="blog.subtitle" value={!!blog.subtitle}>
            <Text
              fontSize="lg"
              textColor="muted-foreground"
              textAlign="center"
              max="w-xl"
              mx="auto"
              data-class="blog-subtitle"
            >
              <Var name="blog.subtitle" value={blog.subtitle} />
            </Text>
          </If>
        </Block>
        <Grid cols="1-2-3" gap="6" data-class="blog-grid">
          <Loop each="posts" as="post" data={posts}>
            {(post: BlogPost) => (
              <Card data-class="blog-post-card">
                <CardHeader>
                  <If test="post.title" value={!!post.title}>
                    <CardTitle order={4} data-class="blog-post-title">
                      <Var name="post.title" value={post.title} />
                    </CardTitle>
                  </If>
                  <If test="post.excerpt" value={!!post.excerpt}>
                    <CardDescription data-class="blog-post-excerpt">
                      <Var name="post.excerpt" value={post.excerpt} />
                    </CardDescription>
                  </If>
                  <If test="post.author" value={!!post.author}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="blog-post-meta">
                      <Var name="post.author" value={post.author} />
                    </Text>
                  </If>
                  <If test="post.date" value={!!post.date}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="blog-post-date">
                      <Var name="post.date" value={post.date} />
                    </Text>
                  </If>
                </CardHeader>
                <CardContent data-class="blog-post-actions">
                  <DomainNavButton href={`/blog/${post.slug}`} size="sm" data-class="blog-post-link">
                    Read More
                  </DomainNavButton>
                </CardContent>
              </Card>
            )}
          </Loop>
        </Grid>
      </Block>
    </MainLayout>
  );
}
