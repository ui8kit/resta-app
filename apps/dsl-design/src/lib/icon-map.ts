import * as LucideIcons from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcons.LucideIcon> = {
  Home: LucideIcons.Home,
  Menu: LucideIcons.Menu,
  UtensilsCrossed: LucideIcons.UtensilsCrossed,
  ShoppingCart: LucideIcons.ShoppingCart,
  User: LucideIcons.User,
  Settings: LucideIcons.Settings,
  Sun: LucideIcons.Sun,
  Moon: LucideIcons.Moon,
  ChevronRight: LucideIcons.ChevronRight,
  Heart: LucideIcons.Heart,
};

export function getIconByName(name: string): LucideIcons.LucideIcon | null {
  return ICON_MAP[name] ?? null;
}
