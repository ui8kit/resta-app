import { MainLayout } from '@/layouts';
import { Block, Container, Title, Text } from '@/components';

interface BlogDetailPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  post?: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body?: string;
    image?: { src: string; alt?: string };
    date?: string;
    author?: string;
  };
}

export function BlogDetailPageView(props: BlogDetailPageViewProps) {
  const { navItems, sidebar, headerTitle, headerSubtitle, post } = props;

  return (
    <MainLayout mode={"full"} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <Block component="article" data-class="blog-detail-section">
        <Container max="w-2xl" py="16">
          {post ? (<><Block data-class="blog-detail-content"><Title fontSize="4xl" fontWeight="bold" data-class="blog-detail-title">{post.title}</Title>{post.date ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="blog-detail-date">{post.date}</Text></>) : null}{post.author ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="blog-detail-author">{post.author}</Text></>) : null}<Block py="8" data-class="blog-detail-body"><Text fontSize="base" lineHeight="relaxed" data-class="blog-detail-text">{post.body}</Text></Block></Block></>) : null}
        </Container>
      </Block>
    </MainLayout>
  );
}
