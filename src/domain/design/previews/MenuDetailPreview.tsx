import { Block, Container, Title, Text, Group, Badge, Button, Field } from '@ui8kit/core';

export type MenuDetailPreviewItem = {
  id: string;
  title: string;
  description?: string;
  price?: { display: string };
  compareAtPrice?: { display: string };
  category?: { title: string };
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
        {item ? (
          <Block data-class="menu-detail-content">
            <Title fontSize="4xl" fontWeight="bold" data-class="menu-detail-title">
              {item.title}
            </Title>
            <Group gap="3" items="center" mt="2" mb="2">
              {item.category?.title && (
                <Text fontSize="sm" textColor="muted-foreground">
                  {item.category.title}
                </Text>
              )}
              {item.availability && (
                <Text fontSize="sm" textColor="muted-foreground">
                  {item.availability}
                </Text>
              )}
              {promotionBadge && (
                <Badge variant="outline">{promotionBadge}</Badge>
              )}
            </Group>
            <Group gap="3" items="baseline">
              {item.price?.display && (
                <Text fontSize="xl" fontWeight="semibold" textColor="primary">
                  {item.price.display}
                </Text>
              )}
              {hasCompareAt && (
                <Text fontSize="sm" textColor="muted-foreground" textDecoration="line-through">
                  {item.compareAtPrice?.display}
                </Text>
              )}
            </Group>
            {item.description && (
              <Text fontSize="lg" textColor="muted-foreground" mt="2">
                {item.description}
              </Text>
            )}
            {variants.length > 0 && (
              <Block py="4">
                <Text fontSize="sm" fontWeight="semibold" mb="2">
                  Portion / Option
                </Text>
                <Group gap="2" wrap="">
                  {variants.map((v) => (
                    <Button key={v.id} variant="outline" size="sm">
                      {v.title}
                      {v.priceModifier?.display ? ` ${v.priceModifier.display}` : ''}
                    </Button>
                  ))}
                </Group>
              </Block>
            )}
            {modifiers.length > 0 && (
              <Block py="2">
                <Text fontSize="sm" fontWeight="semibold" mb="2">
                  Add-ons
                </Text>
                {modifiers.map((m) => (
                  <Group key={m.id} items="center" justify="between" gap="3" py="1">
                    <Group items="center" gap="2">
                      <Field type="checkbox" />
                      <Text>{m.title}</Text>
                    </Group>
                    <Text textColor="muted-foreground">{m.price?.display}</Text>
                  </Group>
                ))}
              </Block>
            )}
            {item.details && (
              <Block py="6">
                <Text fontSize="base" lineHeight="relaxed">
                  {item.details}
                </Text>
              </Block>
            )}
            <Button size="lg" mt="4" href="#" onClick={onOrderClick}>
              Add to order
            </Button>
          </Block>
        ) : (
          <Text fontSize="sm" textColor="muted-foreground">
            No menu item data
          </Text>
        )}
      </Container>
    </Block>
  );
}
