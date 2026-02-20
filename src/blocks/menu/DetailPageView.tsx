import { useState } from 'react';
import { MainLayout } from '@/layouts';
import { Block, Container, Title, Text, Group, Badge, Button, Field, Toast } from '@ui8kit/core';
import { If, Var, Loop } from '@ui8kit/dsl';

type MenuPrice = {
  amount: number;
  currency: string;
  display: string;
};

type MenuCategory = {
  id: string;
  title: string;
};

type CatalogItemVariant = {
  id: string;
  title: string;
  priceModifier: MenuPrice;
};

type CatalogItemModifier = {
  id: string;
  title: string;
  price: MenuPrice;
  type: 'checkbox' | 'radio';
};

type PromotionItem = {
  id: string;
  title: string;
  badge?: string;
};

export interface MenuDetailPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  item?: {
    id: string;
    slug: string;
    title: string;
    description: string;
    price: MenuPrice;
    compareAtPrice?: MenuPrice;
    category: MenuCategory;
    details?: string;
    availability?: 'available' | 'unavailable' | 'limited';
    variants?: CatalogItemVariant[];
    modifiers?: CatalogItemModifier[];
    promotionIds?: string[];
  };
  promotions?: { items?: PromotionItem[] };
}

export function MenuDetailPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  item,
  promotions,
}: MenuDetailPageViewProps) {
  const [showToast, setShowToast] = useState(false);
  const variants = item?.variants ?? [];
  const modifiers = item?.modifiers ?? [];
  const promotion = (promotions?.items ?? []).find((entry) => entry.id === item?.promotionIds?.[0]);
  const hasCompareAt = !!item?.compareAtPrice?.display;

  return (
    <MainLayout
      mode="full"
      navItems={navItems}
      sidebar={sidebar}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
    >
      <Block component="article" data-class="menu-detail-section">
        <Container max="w-2xl" py="16">
          <If test="item" value={!!item}>
            <Block data-class="menu-detail-content">
              <Title fontSize="4xl" fontWeight="bold" data-class="menu-detail-title">
                <Var name="item.title" value={item?.title} />
              </Title>
              <Group gap="3" items="center" mt="2" mb="2">
                <If test="item.category.title" value={!!item?.category?.title}>
                  <Text fontSize="sm" textColor="muted-foreground" data-class="menu-detail-category">
                    <Var name="item.category.title" value={item?.category?.title} />
                  </Text>
                </If>
                <If test="item.availability" value={!!item?.availability}>
                  <Text fontSize="sm" textColor="muted-foreground" data-class="menu-detail-availability">
                    <Var name="item.availability" value={item?.availability} />
                  </Text>
                </If>
                <If test="promotion.badge" value={!!promotion?.badge}>
                  <Badge variant="outline" data-class="menu-detail-promo-badge">
                    <Var name="promotion.badge" value={promotion?.badge} />
                  </Badge>
                </If>
              </Group>
              <Group gap="3" items="baseline" data-class="menu-detail-price-row">
                <If test="item.price.display" value={!!item?.price?.display}>
                  <Text fontSize="xl" fontWeight="semibold" textColor="primary" data-class="menu-detail-price">
                    <Var name="item.price.display" value={item?.price?.display} />
                  </Text>
                </If>
                <If test="hasCompareAt" value={hasCompareAt}>
                  <Text
                    fontSize="sm"
                    textColor="muted-foreground"
                    textDecoration="line-through"
                    data-class="menu-detail-compare-price"
                  >
                    <Var name="item.compareAtPrice.display" value={item?.compareAtPrice?.display} />
                  </Text>
                </If>
              </Group>
              <If test="item.description" value={!!item?.description}>
                <Text fontSize="lg" textColor="muted-foreground" data-class="menu-detail-description">
                  <Var name="item.description" value={item?.description} />
                </Text>
              </If>
              <If test="variants.length > 0" value={variants.length > 0}>
                <Block py="4" data-class="menu-detail-variants">
                  <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="menu-detail-variants-title">
                    Portion / Option
                  </Text>
                  <Group gap="2" wrap="" data-class="menu-detail-variant-list">
                    <Loop each="variants" as="variant" data={variants}>
                      {(variant: CatalogItemVariant) => (
                        <Button variant="outline" size="sm" data-class="menu-detail-variant-btn">
                          <Var name="variant.title" value={variant.title} />
                          <If test="variant.priceModifier.display" value={!!variant.priceModifier?.display}>
                            <Text component="span" ml="1" data-class="menu-detail-variant-price">
                              <Var name="variant.priceModifier.display" value={variant.priceModifier?.display} />
                            </Text>
                          </If>
                        </Button>
                      )}
                    </Loop>
                  </Group>
                </Block>
              </If>
              <If test="modifiers.length > 0" value={modifiers.length > 0}>
                <Block py="2" data-class="menu-detail-modifiers">
                  <Text fontSize="sm" fontWeight="semibold" mb="2" data-class="menu-detail-modifiers-title">
                    Add-ons
                  </Text>
                  <Block data-class="menu-detail-modifier-list">
                    <Loop each="modifiers" as="modifier" data={modifiers}>
                      {(modifier: CatalogItemModifier) => (
                        <Group items="center" justify="between" gap="3" py="1" data-class="menu-detail-modifier-row">
                          <Group items="center" gap="2">
                            <Field type="checkbox" data-class="menu-detail-modifier-check" />
                            <Text data-class="menu-detail-modifier-label">
                              <Var name="modifier.title" value={modifier.title} />
                            </Text>
                          </Group>
                          <Text textColor="muted-foreground" data-class="menu-detail-modifier-price">
                            <Var name="modifier.price.display" value={modifier.price?.display} />
                          </Text>
                        </Group>
                      )}
                    </Loop>
                  </Block>
                </Block>
              </If>
              <If test="item.details" value={!!item?.details}>
                <Block py="6" data-class="menu-detail-body">
                  <Text fontSize="base" lineHeight="relaxed" data-class="menu-detail-text">
                    <Var name="item.details" value={item?.details} />
                  </Text>
                </Block>
              </If>
              <Button
                size="lg"
                data-class="menu-detail-cta"
                mt="4"
                onClick={() => setShowToast(true)}
              >
                Add to order
              </Button>
              <Toast visible={showToast} onClose={() => setShowToast(false)} duration={9000} />
            </Block>
          </If>
        </Container>
      </Block>
    </MainLayout>
  );
}
