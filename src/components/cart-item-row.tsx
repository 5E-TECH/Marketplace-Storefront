"use client";

import { Heart, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { getSafeImageSrc } from "@/lib/product-storage";
import { useFavorites } from "@/providers/favorites-provider";
import type { CartItem } from "@/types/commerce";
import { Price } from "./ui";

type Props = { item: CartItem; selected: boolean; onSelect: (id: string, selected: boolean) => void; onUpdate: (id: string, quantity: number) => Promise<void>; onRemove: (id: string) => Promise<void> };

export function CartItemRow({ item, selected, onSelect, onUpdate, onRemove }: Props) {
  const favorites = useFavorites();
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const variant = item.product.variants?.find((candidate) => String(candidate.id) === String(item.variantId));
  const oldTotal = item.product.oldPrice ? item.product.oldPrice * item.quantity : undefined;
  const isFavorite = favorites.has(item.productId);
  const run = async (action: () => Promise<void>) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try { await action(); }
    finally { pendingRef.current = false; setPending(false); }
  };
  return <article className="cart-page-item" data-testid="cart-item">
    <label className="cart-checkbox"><input type="checkbox" checked={selected} onChange={(event) => onSelect(item.id, event.target.checked)} aria-label={`${item.product.name} mahsulotini tanlash`}/><span/></label>
    <Link className="cart-item-image" href={`/product/${item.productId}`} prefetch={false}><Image src={getSafeImageSrc(item.product.image)} alt={item.product.name} fill sizes="(max-width: 720px) 92px, 130px"/></Link>
    <div className="cart-item-details">
      <Link href={`/product/${item.productId}`} prefetch={false}><h2>{item.product.name}</h2></Link>
      {variant?.name && <small>Variant: {variant.name}</small>}
      {item.color && <span className="item-color">Rang <i style={{ background: item.color }}/></span>}
      <div className="cart-row-actions">
        <div className="quantity">
          <button disabled={pending} onClick={() => run(() => item.quantity === 1 ? onRemove(item.id) : onUpdate(item.id, item.quantity - 1))} aria-label="Kamaytirish"><Minus/></button>
          <b>{item.quantity}</b>
          <button disabled={pending || (variant?.stock !== undefined && item.quantity >= variant.stock)} onClick={() => run(() => onUpdate(item.id, item.quantity + 1))} aria-label="Ko‘paytirish"><Plus/></button>
        </div>
        <button className={isFavorite ? "active" : ""} disabled={!favorites.hydrated || favorites.isPending(item.productId)} onClick={() => favorites.toggle(item.product)} aria-label={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}><Heart fill={isFavorite ? "currentColor" : "none"}/> <span>Sevimlilarga</span></button>
        <button disabled={pending} onClick={() => run(() => onRemove(item.id))} aria-label="O‘chirish"><Trash2/> <span>O‘chirish</span></button>
      </div>
    </div>
    <div className="cart-page-price"><Price value={item.product.price * item.quantity} oldValue={oldTotal}/></div>
  </article>;
}
