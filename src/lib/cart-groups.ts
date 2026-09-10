import type { CartItem } from "@/types/commerce";

export type SellerCartGroup = { key: string; name: string; items: CartItem[]; subtotal: number };

export const groupCartItemsBySeller = (items: CartItem[]): SellerCartGroup[] => {
  const groups = new Map<string, SellerCartGroup>();
  for (const item of items) {
    const shop = item.product.shop;
    const key = String(shop?.id ?? shop?.slug ?? shop?.name ?? item.product.category ?? "marketplace");
    const group = groups.get(key) ?? { key, name: shop?.name ?? "Marketplace sotuvchisi", items: [], subtotal: 0 };
    group.items.push(item);
    group.subtotal += item.product.price * item.quantity;
    groups.set(key, group);
  }
  return [...groups.values()];
};
