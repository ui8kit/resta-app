import { useState, Fragment } from 'react';
import { MainLayout } from '@/layouts';
import { Block, Container, Title, Text, Group, Badge, Button, Field, Toast } from '@/components';
import type { CatalogItemModifier, CatalogItemVariant, MenuCategory, MenuPrice, NavItem, PromotionItem } from '@/types';

interface MenuDetailPageViewProps {
  navItems?: NavItem[];
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

export function MenuDetailPageView(props: MenuDetailPageViewProps) {
  const { navItems, sidebar, headerTitle, headerSubtitle, item, promotions } = props;

  const [showToast, setShowToast] = useState(false);
  const variants = item?.variants ?? [];
  const modifiers = item?.modifiers ?? [];
  const promotion = (promotions?.items ?? []).find((entry) => entry.id === item?.promotionIds?.[0]);
  const hasCompareAt = !!item?.compareAtPrice?.display;

  return (
    <MainLayout mode={"full"} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <Block component="article" data-class="menu-detail-section">
        <Container max="w-2xl" py="16">
          {item ? (<><Block data-class="menu-detail-content"><Title fontSize="4xl" fontWeight="bold" data-class="menu-detail-title">{item.title}</Title><Group gap="4" items="center" mt="2" mb="2">{item.category.title ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="menu-detail-category">{item.category.title}</Text></>) : null}{item.availability ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="menu-detail-availability">{item.availability}</Text></>) : null}{promotion?.badge ? (<><Badge variant="outline" data-class="menu-detail-promo-badge">{promotion.badge}</Badge></>) : null}</Group><Group gap="4" items="baseline" data-class="menu-detail-price-row">{item.price.display ? (<><Text fontSize="xl" fontWeight="semibold" textColor="primary" data-class="menu-detail-price">{item.price.display}</Text></>) : null}{hasCompareAt ? (<><Text fontSize="sm" textColor="muted-foreground" style={{ textDecoration: 'line-through' }} data-class="menu-detail-compare-price">{item.compareAtPrice.display}</Text></>) : null}</Group>{item.description ? (<><Text fontSize="lg" textColor="muted-foreground" data-class="menu-detail-description">{item.description}</Text></>) : null}{variants.length > 0 ? (<><Block py="4" data-class="menu-detail-variants"><Text fontSize="sm" fontWeight="semibold" mb="2" data-class="menu-detail-variants-title"> Portion / Option </Text><Group gap="2" flex="wrap" data-class="menu-detail-variant-list">{variants.map((variant, index) => (
          <Fragment key={variant.id ?? index}>
          <Button variant="outline" size="sm" data-class="menu-detail-variant-btn">{variant.title}{variant.priceModifier.display ? (<><Text component="span" ml="1" data-class="menu-detail-variant-price">{variant.priceModifier.display}</Text></>) : null}</Button>
          </Fragment>
          ))}</Group></Block></>) : null}{modifiers.length > 0 ? (<><Block py="2" data-class="menu-detail-modifiers"><Text fontSize="sm" fontWeight="semibold" mb="2" data-class="menu-detail-modifiers-title"> Add-ons </Text><Block data-class="menu-detail-modifier-list">{modifiers.map((modifier, index) => (
          <Fragment key={modifier.id ?? index}>
          <Group items="center" justify="between" gap="4" py="2" data-class="menu-detail-modifier-row"><Group items="center" gap="2"><Field type={"checkbox"} data-class={"menu-detail-modifier-check"} /><Text data-class="menu-detail-modifier-label">{modifier.title}</Text></Group><Text textColor="muted-foreground" data-class="menu-detail-modifier-price">{modifier.price.display}</Text></Group>
          </Fragment>
          ))}</Block></Block></>) : null}{item.details ? (<><Block py="8" data-class="menu-detail-body"><Text fontSize="base" lineHeight="relaxed" data-class="menu-detail-text">{item.details}</Text></Block></>) : null}<Button size="lg" data-class="menu-detail-cta" mt="4" onClick={() => setShowToast(true)}> Add to order </Button><Toast visible={showToast} onClose={() => setShowToast(false)} duration={9000} /></Block></>) : null}
        </Container>
      </Block>
    </MainLayout>
  );
}
