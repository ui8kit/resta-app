import { MainLayout } from '@/layouts';
import { SidebarContent } from '@/blocks';
import { Block, Container, Title, Text } from '@ui8kit/core';
import { If, Var } from '@ui8kit/dsl';

export interface MenuDetailPageViewProps {
  navItems?: { id: string; title: string; url: string }[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  item?: {
    id: string;
    title: string;
    description: string;
    price: string;
    category: string;
    details?: string;
  };
}

export function MenuDetailPageView({
  navItems,
  sidebar,
  headerTitle,
  headerSubtitle,
  item,
}: MenuDetailPageViewProps) {
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
              <If test="item.category" value={!!item?.category}>
                <Text fontSize="sm" textColor="muted-foreground" data-class="menu-detail-category">
                  <Var name="item.category" value={item?.category} />
                </Text>
              </If>
              <If test="item.price" value={!!item?.price}>
                <Text fontSize="xl" fontWeight="semibold" textColor="primary" data-class="menu-detail-price">
                  <Var name="item.price" value={item?.price} />
                </Text>
              </If>
              <If test="item.description" value={!!item?.description}>
                <Text fontSize="lg" textColor="muted-foreground" data-class="menu-detail-description">
                  <Var name="item.description" value={item?.description} />
                </Text>
              </If>
              <If test="item.details" value={!!item?.details}>
                <Block py="6" data-class="menu-detail-body">
                  <Text fontSize="base" lineHeight="relaxed" data-class="menu-detail-text">
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
