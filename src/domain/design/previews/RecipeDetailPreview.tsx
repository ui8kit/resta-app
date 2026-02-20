import { Block, Container, Title, Text, Group, Badge, Grid, Button } from '@ui8kit/core';

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
        {recipe ? (
          <Block data-class="recipe-detail-content">
            <Group items="center" gap="2" mb="2">
              {recipe.difficulty && (
                <Badge variant="outline">{recipe.difficulty}</Badge>
              )}
              {recipe.category?.title && (
                <Text fontSize="sm" textColor="muted-foreground">
                  {recipe.category.title}
                </Text>
              )}
            </Group>
            <Title fontSize="4xl" fontWeight="bold">
              {recipe.title}
            </Title>
            <Group items="center" gap="2" mt="2">
              {recipe.date && (
                <Text fontSize="sm" textColor="muted-foreground">
                  {recipe.date}
                </Text>
              )}
              {recipe.cookTime?.total && (
                <Text fontSize="sm" textColor="muted-foreground">
                  {recipe.cookTime.total} min
                </Text>
              )}
              {recipe.servings && (
                <Text fontSize="sm" textColor="muted-foreground">
                  {recipe.servings} servings
                </Text>
              )}
            </Group>
            {recipe.excerpt && (
              <Text fontSize="lg" mt="4" textColor="muted-foreground">
                {recipe.excerpt}
              </Text>
            )}
            {recipe.body && (
              <Block py="8">
                <Text fontSize="base" lineHeight="relaxed">
                  {recipe.body}
                </Text>
              </Block>
            )}
            <Grid cols="1-2" gap="6">
              <Block>
                <Title order={3} fontSize="xl" fontWeight="semibold" mb="4">
                  Ingredients
                </Title>
                {ingredients.map((ing) => (
                  <Group key={ing.id} items="baseline" gap="2" py="2">
                    <Text fontWeight="semibold">
                      {ing.amount}{ing.unit || ''}
                    </Text>
                    <Text>
                      {ing.name}
                      {ing.note ? ` (${ing.note})` : ''}
                    </Text>
                  </Group>
                ))}
              </Block>
              <Block>
                <Title order={3} fontSize="xl" fontWeight="semibold" mb="4">
                  Steps
                </Title>
                {steps.map((s) => (
                  <Block key={s.id} py="2">
                    <Text fontWeight="bold">Step {s.step}</Text>
                    {s.title && (
                      <Text fontWeight="semibold">{s.title}</Text>
                    )}
                    <Text>{s.body}</Text>
                  </Block>
                ))}
              </Block>
            </Grid>
            {recipe.nutrition && (
              <Block py="8">
                <Title order={4} fontSize="lg" fontWeight="semibold" mb="2">
                  Nutrition (per serving)
                </Title>
                <Text textColor="muted-foreground">
                  {recipe.nutrition.calories} kcal · {recipe.nutrition.protein}g protein · {recipe.nutrition.fat}g fat · {recipe.nutrition.carbs}g carbs
                </Text>
              </Block>
            )}
            <Button size="lg" href="#" onClick={onOrderClick}>
              Order in the restaurant
            </Button>
          </Block>
        ) : (
          <Text fontSize="sm" textColor="muted-foreground">
            No recipe data
          </Text>
        )}
      </Container>
    </Block>
  );
}
