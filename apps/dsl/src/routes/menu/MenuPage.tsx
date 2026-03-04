import { SidebarContent, MenuPageView } from '@/blocks';
import { context } from '@/data/context';
import { useCart, useMenuFilter } from '@/hooks';

export function MenuPage() {
  const cart = useCart();
  const menuFilter = useMenuFilter(context.menu, context.promotions);

  return (
    <MenuPageView
      navItems={context.navItems}
      sidebar={<SidebarContent title="Quick Links" links={context.sidebarLinks} />}
      headerTitle={context.site.title}
      headerSubtitle={context.site.subtitle}
      menu={context.menu}
      promotions={context.promotions}
      cart={cart.cart}
      cartCount={cart.cartCount}
      addToCart={cart.addToCart}
      removeFromCart={cart.removeFromCart}
      updateCartQuantity={cart.updateCartQuantity}
      setSelectedCategory={menuFilter.setSelectedCategory}
      categories={menuFilter.categories}
      filteredItems={menuFilter.filteredItems}
      allTabVariant={menuFilter.allTabVariant}
      getCategoryTabVariant={menuFilter.getCategoryTabVariant}
    />
  );
}
