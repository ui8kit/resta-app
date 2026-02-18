import { MainLayout } from '@/layouts';
import { SidebarContent } from '@/blocks';
import { Block, Container, Title, Text } from '@ui8kit/core';
import { If, Var } from '@ui8kit/dsl';

export interface PromotionDetailPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  item?: {
    id: string;
    title: string;
    description: string;
    validUntil?: string;
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
