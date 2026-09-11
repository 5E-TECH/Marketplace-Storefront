"use client";

import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getSafeImageSrc } from "@/lib/product-storage";
import { productPath } from "@/lib/product-url";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import type { CartItem } from "@/types/commerce";
import { Price } from "./ui";

export function CartItemRow({ item }: { item: CartItem }) {
  const cart = useCart();
  const favorites = useFavorites();
  const variant = item.product.variants?.find((entry) => String(entry.id) === String(item.variantId));
  const oldUnitPrice = variant?.oldPrice ?? item.product.oldPrice;
  const isFavorite = favorites.has(item.productId);
  const decrease = () => item.quantity <= 1 ? cart.remove(item.id) : cart.update(item.id, item.quantity - 1);
  return <article className="cart-page-item" data-testid="cart-page-item">
    <Link className="cart-item-image" href={productPath(item.product)}><Image src={getSafeImageSrc(item.product.image)} alt={item.product.name} fill sizes="130px"/></Link>
    <div className="cart-item-info"><small>{item.product.shop?.name ?? item.product.category}</small><Link href={productPath(item.product)}><h2>{item.product.name}</h2></Link><div className="cart-item-options">{variant?.name && <span>Variant: <b>{variant.name}</b></span>}<span className="item-color">Rang <i style={{ background: item.color }}/></span></div><div className="quantity"><button disabled={cart.loading} onClick={decrease} aria-label={`${item.product.name} miqdorini kamaytirish`}><Minus/></button><b data-testid="cart-item-quantity">{item.quantity}</b><button disabled={cart.loading || (variant?.stock !== undefined && item.quantity >= variant.stock)} onClick={() => cart.update(item.id, item.quantity + 1)} aria-label={`${item.product.name} miqdorini oshirish`}><Plus/></button></div></div>
    <div className="cart-page-price"><Price value={item.product.price * item.quantity} oldValue={oldUnitPrice ? oldUnitPrice * item.quantity : undefined}/><div><button className={isFavorite ? "active" : ""} disabled={favorites.loading} onClick={() => favorites.toggle(item.product)} aria-label={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}><Heart fill={isFavorite ? "currentColor" : "none"}/></button><button data-testid="cart-page-remove" disabled={cart.loading} onClick={() => cart.remove(item.id)} aria-label={`${item.product.name}ni o‘chirish`}><Trash2/></button></div></div>
  </article>;
}
