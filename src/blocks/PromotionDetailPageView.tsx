import { MainLayout } from '@/layouts';
import { Block, Container, Title, Text, Badge } from '@ui8kit/core';
import { If, Var } from '@ui8kit/dsl';

type PromotionDiscount = {
  type: 'percentage' | 'fixed' | 'combo';
  value: number;
  appliesTo?: {
    categoryIds?: string[];
    productIds?: string[];
  };
  couponCode?: string;
};

export interface PromotionDetailPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  item?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    validUntil?: string;
    badge?: string;
    discount?: PromotionDiscount;
    details?: string;
  };
}

export function PromotionDetailPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  item,
}: PromotionDetailPageViewProps) {
  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="article" data-class="promotion-detail-section">
        <Container max="w-2xl" py="16">
          <If test="item" value={!!item}>
            <Block data-class="promotion-detail-content">
              <Title fontSize="4xl" fontWeight="bold" data-class="promotion-detail-title">
                <Var name="item.title" value={item?.title} />
              </Title>
              <If test="item.badge" value={!!item?.badge}>
                <Badge variant="outline" data-class="promotion-detail-badge">
                  <Var name="item.badge" value={item?.badge} />
                </Badge>
              </If>
              <If test="item.discount.type" value={!!item?.discount?.type}>
                <Text fontSize="sm" textColor="muted-foreground" data-class="promotion-detail-discount-type">
                  Discount type: <Var name="item.discount.type" value={item?.discount?.type} />
                </Text>
              </If>
              <If test="item.discount.couponCode" value={!!item?.discount?.couponCode}>
                <Text fontSize="sm" textColor="muted-foreground" data-class="promotion-detail-coupon">
                  Coupon: <Var name="item.discount.couponCode" value={item?.discount?.couponCode} />
                </Text>
              </If>
              <If test="item.validUntil" value={!!item?.validUntil}>
                <Text fontSize="sm" textColor="muted-foreground" data-class="promotion-detail-valid">
                  Valid until: <Var name="item.validUntil" value={item?.validUntil} />
                </Text>
              </If>
              <If test="item.description" value={!!item?.description}>
                <Text fontSize="lg" textColor="muted-foreground" data-class="promotion-detail-description">
                  <Var name="item.description" value={item?.description} />
                </Text>
              </If>
              <If test="item.details" value={!!item?.details}>
                <Block py="6" data-class="promotion-detail-body">
                  <Text fontSize="base" lineHeight="relaxed" data-class="promotion-detail-text">
                    <Var name="item.details" value={item?.details} />
                  </Text>
                </Block>
              </If>
            </Block>
          </If>
        </Container>
      </Block>
    </MainLayout>
  );
}
