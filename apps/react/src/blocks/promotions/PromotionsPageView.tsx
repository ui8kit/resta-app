import { MainLayout } from '@/layouts';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text, Badge } from '@/components';
import { DomainNavButton } from '@/partials';
import type { NavItem, PromotionItem } from '@/types';
import { Fragment } from 'react';

interface PromotionsPageViewProps {
  navItems?: NavItem[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  promotions: { title?: string; subtitle?: string; items?: PromotionItem[] };
}

export function PromotionsPageView(props: PromotionsPageViewProps) {
  const { navItems, sidebar, headerTitle, headerSubtitle, promotions } = props;

  const items = promotions.items ?? [];

  return (
    <MainLayout mode={"full"} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <Block component="section" data-class="promotions-section">
        <Block py="16" data-class="promotions-header">
          {promotions.title ? (<><Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="promotions-title">{promotions.title}</Text></>) : null}
          {promotions.subtitle ? (<><Text fontSize="lg" textColor="muted-foreground" textAlign="center" max="w-xl" mx="auto" data-class="promotions-subtitle">{promotions.subtitle}</Text></>) : null}
        </Block>
        <Grid cols="1-2-3" gap="6" data-class="promotions-grid">
          {items.map((item, index) => (
          <Fragment key={item.id ?? index}>
          <Card data-class="promotions-item-card"><CardHeader>{item.title ? (<><CardTitle order={4} data-class="promotions-item-title">{item.title}</CardTitle></>) : null}{item.badge ? (<><Badge variant="outline" data-class="promotions-item-badge">{item.badge}</Badge></>) : null}{item.description ? (<><CardDescription data-class="promotions-item-description">{item.description}</CardDescription></>) : null}{item.discount.type ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="promotions-item-discount-type"> Discount type: {item.discount.type}</Text></>) : null}{item.discount.couponCode ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="promotions-item-coupon"> Coupon: {item.discount.couponCode}</Text></>) : null}{item.validUntil ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="promotions-item-valid"> Valid until: {item.validUntil}</Text></>) : null}</CardHeader><CardContent data-class="promotions-item-actions"><DomainNavButton href={`/promotions/${item.id}`} size={"sm"} data-class={"promotions-item-link"}>View Details</DomainNavButton></CardContent></Card>
          </Fragment>
          ))}
        </Grid>
      </Block>
    </MainLayout>
  );
}
