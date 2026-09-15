"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/providers/cart-provider";

export function FloatingCart() {
  const { quantity, subtotal, loading } = useCart();
  return <Link className="floating-cart" href="/cart" aria-label={quantity ? `Savatcha: ${quantity} ta mahsulot` : "Savatcha"} aria-busy={loading || undefined}>
    <span className="floating-cart-icon"><ShoppingBag/>{quantity > 0 && <b>{quantity > 99 ? "99+" : quantity}</b>}</span>
    <span>{quantity > 0 ? `${formatPrice(subtotal)} so‘m` : "Savatcha"}</span>
  </Link>;
}
