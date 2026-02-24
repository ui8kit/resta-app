import { MainLayout } from '@/layouts';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text, Badge, Group } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';
import type { NavItem, RecipeItem } from '@/types';

export interface RecipesPageViewProps {
  navItems?: NavItem[];
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
            {(item: RecipeItem) => {
              const hasCookTimeAndServings = !!item.cookTime?.total && !!item.servings;
              return (
              <Card data-class="recipes-item-card">
                <CardHeader>
                  <Group items="center" gap="2" mb="1">
                    <If test="item.difficulty" value={!!item.difficulty}>
                      <Badge variant="outline" data-class="recipes-item-difficulty">
                        <Var name="item.difficulty" value={item.difficulty} />
                      </Badge>
                    </If>
                    <If test="item.category.title" value={!!item.category?.title}>
                      <Text fontSize="sm" textColor="muted-foreground" data-class="recipes-item-category">
                        <Var name="item.category.title" value={item.category?.title} />
                      </Text>
                    </If>
                  </Group>
                  <If test="item.title" value={!!item.title}>
                    <CardTitle order={4} data-class="recipes-item-title">
                      <Var name="item.title" value={item.title} />
                    </CardTitle>
                  </If>
                  <If test="item.excerpt" value={!!item.excerpt}>
                    <CardDescription data-class="recipes-item-excerpt">
                      <Var name="item.excerpt" value={item.excerpt} />
                    </CardDescription>
                  </If>
                  <If test="item.cookTime.total || item.servings" value={!!item.cookTime?.total || !!item.servings}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="recipes-item-meta">
                      <If test="item.cookTime.total" value={!!item.cookTime?.total}>
                        <Text component="span">
                          <Var name="item.cookTime.total" value={`${item.cookTime?.total} min`} />
                        </Text>
                      </If>
                      <If test="item.cookTime.total && item.servings" value={hasCookTimeAndServings}>
                        {' · '}
                      </If>
                      <If test="item.servings" value={!!item.servings}>
                        <Text component="span">
                          <Var name="item.servings" value={`${item.servings} servings`} />
                        </Text>
                      </If>
                    </Text>
                  </If>
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
              );
            }}
          </Loop>
        </Grid>
      </Block>
    </MainLayout>
  );
}
