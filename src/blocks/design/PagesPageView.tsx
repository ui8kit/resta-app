import { Block, Stack, Title, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@ui8kit/core';
import { MenuDetailPreview, RecipeDetailPreview, PromotionDetailPreview } from '@/domain/design/previews';
import { menuDetailSample, recipeDetailSample, promotionDetailSample } from '@/domain/design/fixtures/pages';

export function DesignPagesPageView() {
  const promotionBadge = '-15%';

  return (
    <Block component="section" py="8" data-class="design-pages-section">
      <Stack gap="8" max="w-4xl" mx="auto" px="4" items="stretch">
        <Title fontSize="2xl" fontWeight="bold" data-class="design-pages-title">
          Pages
        </Title>

        <Card data-class="design-pages-card">
          <CardHeader>
            <CardTitle order={4}>Menu Page</CardTitle>
            <CardDescription>Menu item detail</CardDescription>
          </CardHeader>
          <CardContent>
            <Block data-class="design-pages-preview" className="rounded-md border border-border overflow-hidden">
              <MenuDetailPreview item={menuDetailSample} promotionBadge={promotionBadge} />
            </Block>
          </CardContent>
        </Card>

        <Card data-class="design-pages-card">
          <CardHeader>
            <CardTitle order={4}>Recipe Page</CardTitle>
            <CardDescription>Recipe detail with ingredients and steps</CardDescription>
          </CardHeader>
          <CardContent>
            <Block data-class="design-pages-preview" className="rounded-md border border-border overflow-hidden">
              <RecipeDetailPreview recipe={recipeDetailSample} />
            </Block>
          </CardContent>
        </Card>

        <Card data-class="design-pages-card">
          <CardHeader>
            <CardTitle order={4}>Promotion Page</CardTitle>
            <CardDescription>Promo detail with discount and validity</CardDescription>
          </CardHeader>
          <CardContent>
            <Block data-class="design-pages-preview" className="rounded-md border border-border overflow-hidden">
              <PromotionDetailPreview item={promotionDetailSample} />
            </Block>
          </CardContent>
        </Card>
      </Stack>
    </Block>
  );
}
