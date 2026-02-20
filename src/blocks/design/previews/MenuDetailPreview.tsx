import { Block, Container, Title, Text, Group, Badge, Button, Field } from '@ui8kit/core';
import { If, Else, Loop } from '@ui8kit/dsl';

export type MenuDetailPreviewItem = {
  id: string;
  title: string;
  description?: string;
  price?: { display: string };
  compareAtPrice?: { display: string };
  category?: { id?: string; title: string };
  details?: string;
  availability?: string;
  variants?: { id: string; title: string; priceModifier?: { display: string } }[];
  modifiers?: { id: string; title: string; price?: { display: string } }[];
  promotionIds?: string[];
};

export type MenuDetailPreviewProps = {
  item?: MenuDetailPreviewItem;
  promotionBadge?: string;
  onOrderClick?: (e: React.MouseEvent) => void;
};

export function MenuDetailPreview({ item, promotionBadge, onOrderClick }: MenuDetailPreviewProps) {
  const variants = item?.variants ?? [];
  const modifiers = item?.modifiers ?? [];
  const hasCompareAt = !!item?.compareAtPrice?.display;

  return (
    <Block component="article" data-class="menu-detail-preview">
      <Container max="w-2xl" py="8">
        <If test="item" value={!!item}>
          <Block data-class="menu-detail-content">
            <Title fontSize="4xl" fontWeight="bold" data-class="menu-detail-title">
              {item!.title}
            </Title>
            <Group gap="4" items="center" mt="2" mb="2">
              <If test="item.category.title" value={!!item?.category?.title}>
                <Text fontSize="sm" textColor="muted-foreground">
                  {item?.category?.title}
                </Text>
              </If>
              <If test="item.availability" value={!!item?.availability}>
                <Text fontSize="sm" textColor="muted-foreground">
                  {item?.availability}
                </Text>
              </If>
              <If test="promotionBadge" value={!!promotionBadge}>
                <Badge variant="outline">{promotionBadge}</Badge>
              </If>
            </Group>
            <Group gap="4" items="baseline">
              <If test="item.price.display" value={!!item?.price?.display}>
                <Text fontSize="xl" fontWeight="semibold" textColor="primary">
                  {item?.price?.display}
                </Text>
              </If>
              <If test="hasCompareAt" value={hasCompareAt}>
                <Text fontSize="sm" textColor="muted-foreground" style={{ textDecoration: 'line-through' }}>
                  {item?.compareAtPrice?.display}
                </Text>
              </If>
            </Group>
            <If test="item.description" value={!!item?.description}>
              <Text fontSize="lg" textColor="muted-foreground" mt="2">
                {item?.description}
              </Text>
            </If>
            <If test="variants.length > 0" value={variants.length > 0}>
              <Block py="4">
                <Text fontSize="sm" fontWeight="semibold" mb="2">
                  Portion / Option
                </Text>
                <Group gap="2" flex="wrap">
                  <Loop each="variants" as="v" data={variants}>
                    {(v) => (
                      <Button key={v.id} variant="outline" size="sm">
                        {v.title}
                        <If test="v.priceModifier.display" value={!!v.priceModifier?.display}>
                          {` ${v.priceModifier?.display}`}
                        </If>
                      </Button>
                    )}
                  </Loop>
                </Group>
              </Block>
            </If>
            <If test="modifiers.length > 0" value={modifiers.length > 0}>
              <Block py="2">
                <Text fontSize="sm" fontWeight="semibold" mb="2">
                  Add-ons
                </Text>
                <Loop each="modifiers" as="m" data={modifiers}>
                  {(m) => (
                    <Group key={m.id} items="center" justify="between" gap="4" py="2">
                      <Group items="center" gap="2">
                        <Field type="checkbox" />
                        <Text>{m.title}</Text>
                      </Group>
                      <Text textColor="muted-foreground">{m.price?.display}</Text>
                    </Group>
                  )}
                </Loop>
              </Block>
            </If>
            <If test="item.details" value={!!item?.details}>
              <Block py="8">
                <Text fontSize="base" lineHeight="relaxed">
                  {item?.details}
                </Text>
              </Block>
            </If>
            <Button size="lg" mt="4" href="#" onClick={onOrderClick}>
              Add to order
            </Button>
          </Block>
        </If>
        <Else>
          <Text fontSize="sm" textColor="muted-foreground">
            No menu item data
          </Text>
        </Else>
      </Container>
    </Block>
  );
}
