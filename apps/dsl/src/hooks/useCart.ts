import { useState } from 'react';
import type { CartEntry, MenuItem } from '@/types';

export type MenuItemWithComputed = MenuItem & {
  promotionBadge: string;
  hasPromotion: boolean;
  hasCompareAt: boolean;
};

export function useCart() {
  const [cart, setCart] = useState<CartEntry[]>([]);

  const cartCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);

  function addToCart(item: MenuItemWithComputed) {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.itemId === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.itemId === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { itemId: item.id, title: item.title, price: item.price, quantity: 1 }];
    });
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((entry) => entry.itemId !== itemId));
  }

  function updateCartQuantity(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((entry) =>
          entry.itemId === itemId ? { ...entry, quantity: entry.quantity + delta } : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  }

  return {
    cart,
    cartCount,
    addToCart,
    removeFromCart,
    updateCartQuantity,
  };
}
