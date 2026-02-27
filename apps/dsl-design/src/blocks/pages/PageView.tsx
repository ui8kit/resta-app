import { DesignLayout } from '@/layouts';
import { Block, Stack, Title, Text } from '@ui8kit/core';
import { MenuDetailPreview, RecipeDetailPreview, PromotionDetailPreview } from '@/blocks/previews';
import type { PagesPreviewFixture, NavItem, SidebarLink } from '@/types';

export interface PagesPageViewProps {
  navItems?: NavItem[];
  sidebarLinks?: SidebarLink[];
  headerTitle?: string;
  headerSubtitle?: string;
  pagesPreview: PagesPreviewFixture;
}

export function PagesPageView({
  navItems,
  sidebarLinks,
  headerTitle,
  headerSubtitle,
  pagesPreview,
}: PagesPageViewProps) {
  const { menuDetail, recipeDetail, promotionDetail } = pagesPreview;
  const promotionBadge = '-15%';

  return (
    <DesignLayout
      navItems={navItems}
      sidebarLinks={sidebarLinks}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" py="8" data-class="design-pages-section">
        <Stack gap="8" max="w-4xl" mx="auto" items="stretch" data-class="design-pages-stack">
          <Title fontSize="2xl" fontWeight="bold" data-class="design-pages-title">
            Pages
          </Title>

          <Stack data-class="design-pages-preview-section">
            <Stack gap="2" mb="4">
              <Title order={4} data-class="design-pages-preview-title">Menu Page</Title>
              <Text fontSize="sm" textColor="muted-foreground">Menu item detail</Text>
            </Stack>
            <Stack rounded="md" border="" overflow="hidden" data-class="design-pages-preview">
              <MenuDetailPreview
                item={menuDetail as never}
                promotionBadge={promotionBadge}
                onOrderClick={() => {}}
              />
            </Stack>
          </Stack>

          <Stack data-class="design-pages-preview-section">
            <Stack gap="2" mb="4">
              <Title order={4} data-class="design-pages-preview-title">Recipe Page</Title>
              <Text fontSize="sm" textColor="muted-foreground">Recipe detail with ingredients and steps</Text>
            </Stack>
            <Stack rounded="md" border="" overflow="hidden" data-class="design-pages-preview">
              <RecipeDetailPreview
                recipe={recipeDetail as never}
                onOrderClick={() => {}}
              />
            </Stack>
          </Stack>

          <Stack data-class="design-pages-preview-section">
            <Stack gap="2" mb="4">
              <Title order={4} data-class="design-pages-preview-title">Promotion Page</Title>
              <Text fontSize="sm" textColor="muted-foreground">Promo detail with discount and validity</Text>
            </Stack>
            <Stack rounded="md" border="" overflow="hidden" data-class="design-pages-preview">
              <PromotionDetailPreview item={promotionDetail as never} />
            </Stack>
          </Stack>
        </Stack>
      </Block>
    </DesignLayout>
  );
}
