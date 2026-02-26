import { Block, Stack, Title, Text, Group, Button } from '@ui8kit/core';
import { If, Loop, Var } from '@ui8kit/dsl';

export interface MenuDetailPreviewProps {
  item: {
    title?: string;
    description?: string;
    category?: { title?: string };
    price?: { display?: string };
    compareAtPrice?: { display?: string };
    variants?: Array<{ id: string; title: string; priceModifier?: { display?: string } }>;
  };
  promotionBadge?: string;
  onOrderClick?: (e: React.MouseEvent) => void;
}

export function MenuDetailPreview({ item, promotionBadge, onOrderClick }: MenuDetailPreviewProps) {
  const variants = item.variants ?? [];

  return (
    <Block p="6" data-class="menu-detail-preview">
      <Stack gap="4">
        <If test="promotionBadge" value={!!promotionBadge}>
          <Text component="span" fontSize="sm"><Var name="promotionBadge" value={promotionBadge} /></Text>
        </If>
        <If test="item.category.title" value={!!item.category?.title}>
          <Text fontSize="xs" textColor="muted-foreground"><Var name="item.category.title" value={item.category?.title} /></Text>
        </If>
        <Title order={2}><Var name="item.title" value={item.title} /></Title>
        <Text fontSize="sm" textColor="muted-foreground"><Var name="item.description" value={item.description} /></Text>
        <Group items="baseline" gap="2">
          <Text fontSize="lg" fontWeight="semibold" textColor="primary"><Var name="item.price.display" value={item.price?.display} /></Text>
          <If test="item.compareAtPrice.display" value={!!item.compareAtPrice?.display}>
            <Text fontSize="sm" textColor="muted-foreground"><Var name="item.compareAtPrice.display" value={item.compareAtPrice?.display} /></Text>
          </If>
        </Group>
        <Group gap="2" flex="wrap">
          <Loop each="variants" as="v" data={variants}>
            {(v) => (
              <Button key={v.id} variant="outline" size="sm">
                <Var name="v.title" value={v.title} />
                <If test="v.priceModifier.display" value={!!v.priceModifier?.display}>
                  {' '}<Var name="v.priceModifier.display" value={v.priceModifier?.display} />
                </If>
              </Button>
            )}
          </Loop>
        </Group>
        <If test="onOrderClick" value={!!onOrderClick}>
          <Button size="sm" onClick={onOrderClick}>Order</Button>
        </If>
      </Stack>
    </Block>
  );
}
