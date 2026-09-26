"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";

export function FloatingCart() {
  const { quantity, subtotal, loading, error, items } = useCart();
  // Savatcha va checkout sahifasida tugma o'sha sahifaning o'zini takrorlaydi va kontentni yopadi.
  const pathname = usePathname();
  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;
  const unavailable = Boolean(error) && !items.length && !loading;
  return <Link className="floating-cart" href="/cart" aria-label={unavailable ? "Savatchani yuklab bo‘lmadi" : quantity ? `Savatcha: ${quantity} ta mahsulot` : "Savatcha"} aria-busy={loading || undefined}>
    <span className="floating-cart-icon"><ShoppingCart/>{unavailable ? <b className="is-warning" aria-hidden>!</b> : quantity > 0 && <b>{quantity > 99 ? "99+" : quantity}</b>}</span>
    <span>{unavailable ? "Savatcha yuklanmadi" : quantity > 0 ? `${formatPrice(subtotal)} so‘m` : "Savatcha"}</span>
  </Link>;
}
