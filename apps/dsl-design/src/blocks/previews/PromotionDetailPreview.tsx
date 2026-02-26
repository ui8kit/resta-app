import { Block, Stack, Title, Text } from '@ui8kit/core';
import { If, Var } from '@ui8kit/dsl';

export interface PromotionDetailPreviewProps {
  item: {
    title?: string;
    description?: string;
    discount?: string;
    validity?: string;
  };
}

export function PromotionDetailPreview({ item }: PromotionDetailPreviewProps) {
  return (
    <Block p="6" data-class="promotion-detail-preview">
      <Stack gap="4">
        <If test="item.discount" value={!!item.discount}>
          <Text fontSize="sm" fontWeight="semibold"><Var name="item.discount" value={item.discount} /></Text>
        </If>
        <Title order={2}><Var name="item.title" value={item.title} /></Title>
        <Text fontSize="sm" textColor="muted-foreground"><Var name="item.description" value={item.description} /></Text>
        <If test="item.validity" value={!!item.validity}>
          <Text fontSize="xs" textColor="muted-foreground"><Var name="item.validity" value={item.validity} /></Text>
        </If>
      </Stack>
    </Block>
  );
}
