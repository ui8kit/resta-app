import { MainLayout } from '@/layouts';
import { SidebarContent } from '@/blocks';
import { Block, Container, Title, Text } from '@ui8kit/core';
import { If, Var } from '@ui8kit/dsl';

export interface RecipeDetailPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  recipe?: {
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    image?: string;
    date?: string;
  };
}

export function RecipeDetailPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  recipe,
}: RecipeDetailPageViewProps) {
  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="article" data-class="recipe-detail-section">
        <Container max="w-2xl" py="16">
          <If test="recipe" value={!!recipe}>
            <Block data-class="recipe-detail-content">
              <Title fontSize="4xl" fontWeight="bold" data-class="recipe-detail-title">
                <Var name="recipe.title" value={recipe?.title} />
              </Title>
              <If test="recipe.date" value={!!recipe?.date}>
                <Text fontSize="sm" textColor="muted-foreground" data-class="recipe-detail-date">
                  <Var name="recipe.date" value={recipe?.date} />
                </Text>
              </If>
              <Block py="8" data-class="recipe-detail-body">
                <Text fontSize="base" lineHeight="relaxed" data-class="recipe-detail-text">
                  <Var name="recipe.body" value={recipe?.body} />
                </Text>
              </Block>
            </Block>
          </If>
        </Container>
      </Block>
    </MainLayout>
  );
}
