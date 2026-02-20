import { Block, Container, Title, Text, Badge } from '@ui8kit/core';
import { If, Else } from '@ui8kit/dsl';

export type PromotionDetailPreviewItem = {
  id: string;
  title: string;
  description?: string;
  validUntil?: string;
  badge?: string;
  discount?: { type: string; couponCode?: string };
  details?: string;
};

export type PromotionDetailPreviewProps = {
  item?: PromotionDetailPreviewItem;
};

export function PromotionDetailPreview({ item }: PromotionDetailPreviewProps) {
  return (
    <Block component="article" data-class="promotion-detail-preview">
      <Container max="w-2xl" py="8">
        <If test="item" value={!!item}>
          <Block data-class="promotion-detail-content">
            <Title fontSize="4xl" fontWeight="bold">
              {item!.title}
            </Title>
            <If test="item.badge" value={!!item?.badge}>
              <Badge variant="outline" mt="2">{item?.badge}</Badge>
            </If>
            <If test="item.discount.type" value={!!item?.discount?.type}>
              <Text fontSize="sm" textColor="muted-foreground" mt="2">
                Discount type: {item?.discount?.type}
              </Text>
            </If>
            <If test="item.discount.couponCode" value={!!item?.discount?.couponCode}>
              <Text fontSize="sm" textColor="muted-foreground">
                Coupon: {item?.discount?.couponCode}
              </Text>
            </If>
            <If test="item.validUntil" value={!!item?.validUntil}>
              <Text fontSize="sm" textColor="muted-foreground">
                Valid until: {item?.validUntil}
              </Text>
            </If>
            <If test="item.description" value={!!item?.description}>
              <Text fontSize="lg" textColor="muted-foreground" mt="2">
                {item?.description}
              </Text>
            </If>
            <If test="item.details" value={!!item?.details}>
              <Block py="8">
                <Text fontSize="base" lineHeight="relaxed">
                  {item?.details}
                </Text>
              </Block>
            </If>
          </Block>
        </If>
        <Else>
          <Text fontSize="sm" textColor="muted-foreground">
            No promotion data
          </Text>
        </Else>
      </Container>
    </Block>
  );
}
