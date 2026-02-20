import { MainLayout } from '@/layouts';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text, Badge } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';
import { DomainNavButton } from '@/partials';

type PromotionDiscount = {
  type: 'percentage' | 'fixed' | 'combo';
  value: number;
  appliesTo?: {
    categoryIds?: string[];
    productIds?: string[];
  };
  couponCode?: string;
};

export type PromotionItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  validUntil?: string;
  badge?: string;
  discount?: PromotionDiscount;
  image?: { src: string; alt?: string };
  details?: string;
};

export interface PromotionsPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  promotions: { title?: string; subtitle?: string; items?: PromotionItem[] };
}

export function PromotionsPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  promotions,
}: PromotionsPageViewProps) {
  const items = promotions.items ?? [];
  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="section" data-class="promotions-section">
        <Block py="16" data-class="promotions-header">
          <If test="promotions.title" value={!!promotions.title}>
            <Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="promotions-title">
              <Var name="promotions.title" value={promotions.title} />
            </Text>
          </If>
          <If test="promotions.subtitle" value={!!promotions.subtitle}>
            <Text
              fontSize="lg"
              textColor="muted-foreground"
              textAlign="center"
              max="w-xl"
              mx="auto"
              data-class="promotions-subtitle"
            >
              <Var name="promotions.subtitle" value={promotions.subtitle} />
            </Text>
          </If>
        </Block>
        <Grid cols="1-2-3" gap="6" data-class="promotions-grid">
          <Loop each="items" as="item" data={items}>
            {(item: PromotionItem) => (
              <Card data-class="promotions-item-card">
                <CardHeader>
                  <If test="item.title" value={!!item.title}>
                    <CardTitle order={4} data-class="promotions-item-title">
                      <Var name="item.title" value={item.title} />
                    </CardTitle>
                  </If>
                  <If test="item.badge" value={!!item.badge}>
                    <Badge variant="outline" data-class="promotions-item-badge">
                      <Var name="item.badge" value={item.badge} />
                    </Badge>
                  </If>
                  <If test="item.description" value={!!item.description}>
                    <CardDescription data-class="promotions-item-description">
                      <Var name="item.description" value={item.description} />
                    </CardDescription>
                  </If>
                  <If test="item.discount.type" value={!!item.discount?.type}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="promotions-item-discount-type">
                      Discount type: <Var name="item.discount.type" value={item.discount?.type} />
                    </Text>
                  </If>
                  <If test="item.discount.couponCode" value={!!item.discount?.couponCode}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="promotions-item-coupon">
                      Coupon: <Var name="item.discount.couponCode" value={item.discount?.couponCode} />
                    </Text>
                  </If>
                  <If test="item.validUntil" value={!!item.validUntil}>
                    <Text fontSize="sm" textColor="muted-foreground" data-class="promotions-item-valid">
                      Valid until: <Var name="item.validUntil" value={item.validUntil} />
                    </Text>
                  </If>
                </CardHeader>
                <CardContent data-class="promotions-item-actions">
                  <DomainNavButton href={`/promotions/${item.id}`} size="sm" data-class="promotions-item-link">
                    View Details
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
