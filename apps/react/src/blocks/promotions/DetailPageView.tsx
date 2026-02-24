import { MainLayout } from '@/layouts';
import { Block, Container, Title, Text, Badge } from '@/components';
import type { NavItem, PromotionDiscount } from '@/types';

interface PromotionDetailPageViewProps {
  navItems?: NavItem[];
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

export function PromotionDetailPageView(props: PromotionDetailPageViewProps) {
  const { navItems, sidebar, headerTitle, headerSubtitle, item } = props;

  return (
    <MainLayout mode={"full"} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <Block component="article" data-class="promotion-detail-section">
        <Container max="w-2xl" py="16">
          {item ? (<><Block data-class="promotion-detail-content"><Title fontSize="4xl" fontWeight="bold" data-class="promotion-detail-title">{item.title}</Title>{item.badge ? (<><Badge variant="outline" data-class="promotion-detail-badge">{item.badge}</Badge></>) : null}{item.discount.type ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="promotion-detail-discount-type"> Discount type: {item.discount.type}</Text></>) : null}{item.discount.couponCode ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="promotion-detail-coupon"> Coupon: {item.discount.couponCode}</Text></>) : null}{item.validUntil ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="promotion-detail-valid"> Valid until: {item.validUntil}</Text></>) : null}{item.description ? (<><Text fontSize="lg" textColor="muted-foreground" data-class="promotion-detail-description">{item.description}</Text></>) : null}{item.details ? (<><Block py="8" data-class="promotion-detail-body"><Text fontSize="base" lineHeight="relaxed" data-class="promotion-detail-text">{item.details}</Text></Block></>) : null}</Block></>) : null}
        </Container>
      </Block>
    </MainLayout>
  );
}
