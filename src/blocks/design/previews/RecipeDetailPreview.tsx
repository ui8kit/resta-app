import { Block, Container, Title, Text, Group, Badge, Grid, Button } from '@ui8kit/core';
import { If, Else, Loop } from '@ui8kit/dsl';

export type RecipeDetailPreviewRecipe = {
  id: string;
  title: string;
  excerpt?: string;
  body?: string;
  date?: string;
  difficulty?: string;
  category?: { id?: string; title: string };
  cookTime?: { prep?: number; cook?: number; total: number };
  servings?: number;
  ingredients?: { id: string; amount: number; unit: string; name: string; note?: string }[];
  steps?: { id: string; step: number; title?: string; body: string }[];
  nutrition?: { calories: number; protein: number; fat: number; carbs: number };
};

export type RecipeDetailPreviewProps = {
  recipe?: RecipeDetailPreviewRecipe;
  onOrderClick?: (e: React.MouseEvent) => void;
};

export function RecipeDetailPreview({ recipe, onOrderClick }: RecipeDetailPreviewProps) {
  const ingredients = recipe?.ingredients ?? [];
  const steps = recipe?.steps ?? [];

  return (
    <Block component="article" data-class="recipe-detail-preview">
      <Container max="w-2xl" py="8">
        <If test="recipe" value={!!recipe}>
          <Block data-class="recipe-detail-content">
            <Group items="center" gap="2" mb="2">
              <If test="recipe.difficulty" value={!!recipe?.difficulty}>
                <Badge variant="outline">{recipe?.difficulty}</Badge>
              </If>
              <If test="recipe.category.title" value={!!recipe?.category?.title}>
                <Text fontSize="sm" textColor="muted-foreground">
                  {recipe?.category?.title}
                </Text>
              </If>
            </Group>
            <Title fontSize="4xl" fontWeight="bold">
              {recipe?.title}
            </Title>
            <Group items="center" gap="2" mt="2">
              <If test="recipe.date" value={!!recipe?.date}>
                <Text fontSize="sm" textColor="muted-foreground">
                  {recipe?.date}
                </Text>
              </If>
              <If test="recipe.cookTime.total" value={!!recipe?.cookTime?.total}>
                <Text fontSize="sm" textColor="muted-foreground">
                  {recipe?.cookTime?.total} min
                </Text>
              </If>
              <If test="recipe.servings" value={!!recipe?.servings}>
                <Text fontSize="sm" textColor="muted-foreground">
                  {recipe?.servings} servings
                </Text>
              </If>
            </Group>
            <If test="recipe.excerpt" value={!!recipe?.excerpt}>
              <Text fontSize="lg" mt="4" textColor="muted-foreground">
                {recipe?.excerpt}
              </Text>
            </If>
            <If test="recipe.body" value={!!recipe?.body}>
              <Block py="8">
                <Text fontSize="base" lineHeight="relaxed">
                  {recipe?.body}
                </Text>
              </Block>
            </If>
            <Grid cols="1-2" gap="6">
              <Block>
                <Title order={3} fontSize="xl" fontWeight="semibold" mb="4">
                  Ingredients
                </Title>
                <Loop each="ingredients" as="ing" data={ingredients}>
                  {(ing) => (
                    <Group key={ing.id} items="baseline" gap="2" py="2">
                      <Text fontWeight="semibold">
                        {ing.amount}{ing.unit || ''}
                      </Text>
                      <Text>
                        {ing.name}
                        <If test="ing.note" value={!!ing.note}>
                          {` (${ing.note})`}
                        </If>
                      </Text>
                    </Group>
                  )}
                </Loop>
              </Block>
              <Block>
                <Title order={3} fontSize="xl" fontWeight="semibold" mb="4">
                  Steps
                </Title>
                <Loop each="steps" as="s" data={steps}>
                  {(s) => (
                    <Block key={s.id} py="2">
                      <Text fontWeight="bold">Step {s.step}</Text>
                      <If test="s.title" value={!!s.title}>
                        <Text fontWeight="semibold">{s.title}</Text>
                      </If>
                      <Text>{s.body}</Text>
                    </Block>
                  )}
                </Loop>
              </Block>
            </Grid>
            <If test="recipe.nutrition" value={!!recipe?.nutrition}>
              <Block py="8">
                <Title order={4} fontSize="lg" fontWeight="semibold" mb="2">
                  Nutrition (per serving)
                </Title>
                <Text textColor="muted-foreground">
                  {recipe?.nutrition?.calories} kcal · {recipe?.nutrition?.protein}g protein · {recipe?.nutrition?.fat}g fat · {recipe?.nutrition?.carbs}g carbs
                </Text>
              </Block>
            </If>
            <Button size="lg" href="#" onClick={onOrderClick}>
              Order in the restaurant
            </Button>
          </Block>
        </If>
        <Else>
          <Text fontSize="sm" textColor="muted-foreground">
            No recipe data
          </Text>
        </Else>
      </Container>
    </Block>
  );
}
