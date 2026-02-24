import { MainLayout } from '@/layouts';
import { Block, Grid, Card, CardHeader, CardTitle, CardDescription, CardContent, Text, Badge, Group, Button, Sheet, Stack, Icon } from '@/components';
import { DomainNavButton } from '@/partials';
import { ShoppingCart } from 'lucide-react';
import type { CartEntry, MenuCategory, MenuItem, NavItem, PromotionItem } from '@/types';
import { useCart, useMenuFilter } from '@/hooks';
import { Fragment } from 'react';

interface MenuPageViewProps {
  navItems?: NavItem[];
  sidebar: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  menu: { title?: string; subtitle?: string; categories?: MenuCategory[]; items?: MenuItem[] };
  promotions?: { items?: PromotionItem[] };
}

export function MenuPageView(props: MenuPageViewProps) {
  const { navItems, sidebar, headerTitle, headerSubtitle, menu, promotions } = props;

  const { cart, cartCount, addToCart, removeFromCart, updateCartQuantity } = useCart();
  const {
    setSelectedCategory,
    categories,
    filteredItems,
    allTabVariant,
    getCategoryTabVariant,
  } = useMenuFilter(menu, promotions);

  return (
    <MainLayout mode={"full"} navItems={navItems} sidebar={sidebar} headerTitle={headerTitle} headerSubtitle={headerSubtitle}>
      <Block component="section" data-class="menu-section">
        <Group w="full" justify="end" items="center" mb="6" data-class="menu-top-bar">
          <label htmlFor="menu-cart-sheet" className="inline-flex items-center justify-center gap-2 rounded bg-background px-3 py-2 text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors shrink-0" aria-label="Open cart" data-class="menu-cart-trigger">
            <Icon lucideIcon={ShoppingCart} size="sm">
            </Icon>
            {cartCount > 0 ? (<><Badge variant="secondary" data-class="menu-cart-badge">{cartCount}</Badge></>) : null}
          </label>
        </Group>
        <Sheet id="menu-cart-sheet" side="right" size="lg" title="Cart" openLabel="Open cart" closeLabel="Close cart" data-class="menu-cart-sheet">
          <Stack gap="4" items="stretch" data-class="menu-cart-content">
            {cart.length === 0 ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="menu-cart-empty"> Cart is empty </Text></>) : (<>{cart.map((entry, index) => (
            <Fragment key={entry.id ?? index}>
            <Group w="full" justify="between" items="center" gap="2" data-class="menu-cart-item"><Stack gap="0" min="w-0" data-class="menu-cart-item-info"><Text fontSize="sm" fontWeight="medium" data-class="menu-cart-item-title">{entry.title}</Text><Text fontSize="xs" textColor="muted-foreground" data-class="menu-cart-item-price">{entry.price.display} × {entry.quantity}</Text></Stack><Group gap="1" items="center" justify="end" shrink="0" data-class="menu-cart-item-actions"><Button variant="ghost" size="xs" rounded="xs" onClick={() => updateCartQuantity(entry.itemId, -1)} data-class="menu-cart-item-minus" aria-label="Decrease quantity"> − </Button><Text fontSize="sm" data-class="menu-cart-item-qty" className="min-w-6 text-center">{entry.quantity}</Text><Button variant="ghost" size="xs" rounded="xs" onClick={() => updateCartQuantity(entry.itemId, 1)} data-class="menu-cart-item-plus" aria-label="Increase quantity"> + </Button><Button variant="link" size="xs" rounded="xs" onClick={() => removeFromCart(entry.itemId)} data-class="menu-cart-item-remove"> Remove </Button></Group></Group>
            </Fragment>
            ))}</>)}
          </Stack>
        </Sheet>
        <Block py="16" data-class="menu-header">
          {menu.title ? (<><Text component="h2" fontSize="3xl" fontWeight="bold" textAlign="center" data-class="menu-title">{menu.title}</Text></>) : null}
          {menu.subtitle ? (<><Text fontSize="lg" textColor="muted-foreground" textAlign="center" max="w-xl" mx="auto" data-class="menu-subtitle">{menu.subtitle}</Text></>) : null}
        </Block>
        {categories.length > 0 ? (<><Group justify="center" gap="4" flex="wrap" data-class="menu-category-tabs" mb="6"><Button size="sm" variant={allTabVariant} onClick={() => setSelectedCategory(null)} data-class="menu-category-tab"> All </Button>{categories.map((category, index) => (
        <Fragment key={category.id ?? index}>
        <Button size="sm" variant={getCategoryTabVariant(category.id)} onClick={() => setSelectedCategory(category.id)} data-class="menu-category-tab">{category.title}</Button>
        </Fragment>
        ))}</Group></>) : null}
        <Grid cols="1-2-3" gap="6" data-class="menu-grid">
          {filteredItems.map((item, index) => (
          <Fragment key={item.id ?? index}>
          <Card data-class="menu-item-card"><CardHeader>{item.hasPromotion ? (<><Badge variant="outline" data-class="menu-item-promo-badge" mb="2">{item.promotionBadge}</Badge></>) : null}{item.title ? (<><CardTitle order={4} data-class="menu-item-title">{item.title}</CardTitle></>) : null}{item.category.title ? (<><Text fontSize="sm" textColor="muted-foreground" data-class="menu-item-category">{item.category.title}</Text></>) : null}{item.description ? (<><CardDescription data-class="menu-item-description">{item.description}</CardDescription></>) : null}</CardHeader><CardContent data-class="menu-item-footer"><Group justify="between" items="center" gap="4" mb="4">{item.price.display ? (<><Text fontSize="lg" fontWeight="semibold" textColor="primary" data-class="menu-item-price">{item.price.display}</Text></>) : null}{item.hasCompareAt ? (<><Text fontSize="sm" textColor="muted-foreground" style={{ textDecoration: 'line-through' }} data-class="menu-item-compare-price">{item.compareAtPrice.display}</Text></>) : null}</Group><Group justify="between" items="center" gap="4"><DomainNavButton href={`/menu/${item.id}`} size={"sm"} data-class={"menu-item-link"}>View / Order</DomainNavButton><Button variant="outline" size="sm" onClick={() => addToCart(item)} data-class="menu-item-add-intent"> Add to cart </Button></Group>{item.availability ? (<><Text fontSize="xs" textColor="muted-foreground" data-class="menu-item-availability" mt="2"> Availability: {item.availability}</Text></>) : null}</CardContent></Card>
          </Fragment>
          ))}
        </Grid>
      </Block>
    </MainLayout>
  );
}
