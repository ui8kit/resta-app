import { MainLayout } from '@/layouts';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text, Badge, Group } from '@/components';
import { DomainNavButton } from '@/partials';
import type { NavItem, RecipeItem } from '@/types';
import { Fragment } from 'react';

interface RecipesPageViewProps {
  navItems?: NavItem[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  recipes: { title?: string; subtitle?: string; items?: RecipeItem[] };
}

export function RecipesPageView(props: RecipesPageViewProps) {
  const { navItems, sidebar, headerTitle, headerSubtitle, recipes } = props;

  const items = recipes.items ?? [];

  return (
    <MainLayout mode={"full"} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <Block component="section" data-class="recipes-section">
        <Block py="16" data-class="recipes-header">
          {recipes.title ? (<><Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="recipes-title">{recipes.title}</Text></>) : null}
          {recipes.subtitle ? (<><Text fontSize="lg" textColor="muted-foreground" textAlign="center" max="w-xl" mx="auto" data-class="recipes-subtitle">{recipes.subtitle}</Text></>) : null}
        </Block>
        <Grid cols="1-2-3" gap="6" data-class="recipes-grid">
          {items.map((item, index) => (
          <Fragment key={item.id ?? index}>
          <Card data-class="recipes-item-card"><CardHeader><Group items="center" gap="2" mb="1">{item.difficulty ? (<><Badge variant="outline" data-class="recipes-item-difficulty">{item.difficulty}</Badge></>) : null}{item.category.title ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="recipes-item-category">{item.category.title}</Text></>) : null}</Group>{item.title ? (<><CardTitle order={4} data-class="recipes-item-title">{item.title}</CardTitle></>) : null}{item.excerpt ? (<><CardDescription data-class="recipes-item-excerpt">{item.excerpt}</CardDescription></>) : null}{item.cookTime.total || item.servings ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="recipes-item-meta">{item.cookTime.total ? (<><Text component="span">{item.cookTime.total}</Text></>) : null}{item.cookTime.total && item.servings ? (<>' · '</>) : null}{item.servings ? (<><Text component="span">{item.servings}</Text></>) : null}</Text></>) : null}{item.date ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="recipes-item-date">{item.date}</Text></>) : null}</CardHeader><CardContent data-class="recipes-item-actions"><DomainNavButton href={`/recipes/${item.slug}`} size={"sm"} data-class={"recipes-item-link"}>View Recipe</DomainNavButton></CardContent></Card>
          </Fragment>
          ))}
        </Grid>
      </Block>
    </MainLayout>
  );
}
