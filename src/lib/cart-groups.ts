import type { CartItem } from "@/types/commerce";

export type CartGroup = { id: string; name: string; items: CartItem[]; subtotal: number };

export function groupCartItems(items: CartItem[]): CartGroup[] {
  const groups = new Map<string, CartGroup>();
  for (const item of items) {
    const key = String(item.shopId);
    const name = item.product.shop?.name ?? (key === "marketplace" ? "Elchi Market" : `Do‘kon #${key}`);
    const group = groups.get(key) ?? { id: key, name, items: [], subtotal: 0 };
    group.items.push(item);
    group.subtotal += item.product.price * item.quantity;
    groups.set(key, group);
  }
  return [...groups.values()];
}
