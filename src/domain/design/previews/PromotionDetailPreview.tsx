import { Block, Container, Title, Text, Badge } from '@ui8kit/core';

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
        {item ? (
          <Block data-class="promotion-detail-content">
            <Title fontSize="4xl" fontWeight="bold">
              {item.title}
            </Title>
            {item.badge && (
              <Badge variant="outline" mt="2">{item.badge}</Badge>
            )}
            {item.discount?.type && (
              <Text fontSize="sm" textColor="muted-foreground" mt="2">
                Discount type: {item.discount.type}
              </Text>
            )}
            {item.discount?.couponCode && (
              <Text fontSize="sm" textColor="muted-foreground">
                Coupon: {item.discount.couponCode}
              </Text>
            )}
            {item.validUntil && (
              <Text fontSize="sm" textColor="muted-foreground">
                Valid until: {item.validUntil}
              </Text>
            )}
            {item.description && (
              <Text fontSize="lg" textColor="muted-foreground" mt="2">
                {item.description}
              </Text>
            )}
            {item.details && (
              <Block py="8">
                <Text fontSize="base" lineHeight="relaxed">
                  {item.details}
                </Text>
              </Block>
            )}
          </Block>
        ) : (
          <Text fontSize="sm" textColor="muted-foreground">
            No promotion data
          </Text>
        )}
      </Container>
    </Block>
  );
}
