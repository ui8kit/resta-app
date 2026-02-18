import { MainLayout } from '@/layouts';
import { SidebarContent } from '@/blocks';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';

export type RecipeItem = {
  slug: string;
  title: string;
  excerpt: string;
  body?: string;
  image?: string;
  date?: string;
};

export interface RecipesPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  recipes: { title?: string; subtitle?: string; items?: RecipeItem[] };
}

export function RecipesPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  recipes,
}: RecipesPageViewProps) {
  const items = recipes.items ?? [];
  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" data-class="recipes-section">
        <Block py="16" data-class="recipes-header">
          <If test="recipes.title" value={!!recipes.title}>
            <Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="recipes-title">
              <Var name="recipes.title" value={recipes.title} />
            </Text>
          </If>
          <If test="recipes.subtitle" value={!!recipes.subtitle}>
            <Text
              fontSize="lg"
              textColor="muted-foreground"
              textAlign="center"
              max="w-xl"
              mx="auto"
              data-class="recipes-subtitle"
            >
              <Var name="recipes.subtitle" value={recipes.subtitle} />
            </Text>
          </If>
        </Block>
        <Grid cols="1-2-3" gap="6" data-class="recipes-grid">
          <Loop each="items" as="item" data={items}>
            {(item: RecipeItem) => (
              <Card data-class="recipes-item-card">
                <CardHeader>
                  <CardTitle order={4} data-class="recipes-item-title">
                    <Var name="item.title" value={item.title} />
                  </CardTitle>
                  <CardDescription data-class="recipes-item-excerpt">
                    <Var name="item.excerpt" value={item.excerpt} />
                  </CardDescription>
                  <If test="item.date" value={!!item.date}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="recipes-item-date">
                      <Var name="item.date" value={item.date} />
                    </Text>
                  </If>
                </CardHeader>
                <CardContent data-class="recipes-item-actions">
                  <DomainNavButton href={`/recipes/${item.slug}`} size="sm" data-class="recipes-item-link">
                    View Recipe
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
