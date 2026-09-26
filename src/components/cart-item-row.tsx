"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAsyncAction } from "@/hooks/use-async-action";
import { getSafeImageSrc } from "@/lib/product-storage";
import type { CartItem } from "@/types/commerce";
import { FavoriteButton, Price, QuantityStepper } from "./ui";

type Props = { item: CartItem; selected: boolean; onSelect: (id: string, selected: boolean) => void; onUpdate: (id: string, quantity: number) => Promise<void>; onRemove: (id: string) => Promise<void> };

export function CartItemRow({ item, selected, onSelect, onUpdate, onRemove }: Props) {
  const { pending, run } = useAsyncAction();
  const variant = item.product.variants?.find((candidate) => String(candidate.id) === String(item.variantId));
  const oldTotal = item.product.oldPrice ? item.product.oldPrice * item.quantity : undefined;
  return <article className="cart-page-item" data-testid="cart-item">
    <label className="cart-checkbox"><input type="checkbox" checked={selected} onChange={(event) => onSelect(item.id, event.target.checked)} aria-label={`${item.product.name} mahsulotini tanlash`}/><span/></label>
    <Link className="cart-item-image" href={`/product/${item.productId}`} prefetch={false}><Image src={getSafeImageSrc(item.product.image)} alt={item.product.name} fill sizes="(max-width: 720px) 92px, 130px"/></Link>
    <div className="cart-item-details">
      <Link href={`/product/${item.productId}`} prefetch={false}><h2>{item.product.name}</h2></Link>
      {variant?.name && <small>Variant: {variant.name}</small>}
      {item.color && <span className="item-color">Rang <i style={{ background: item.color }}/></span>}
      <div className="cart-row-actions">
        <QuantityStepper value={item.quantity} decreaseAction="remove" max={variant?.stock} disabled={pending}
          // Miqdor optimistik va debounce bilan yangilanadi — tez bosishlar yo'qolmasligi uchun tugma bloklanmaydi.
          onDecrease={() => { if (item.quantity === 1) void run(() => onRemove(item.id)); else void onUpdate(item.id, item.quantity - 1); }}
          onIncrease={() => { void onUpdate(item.id, item.quantity + 1); }}/>
        <FavoriteButton product={item.product} variant="inline"/>
        <button type="button" disabled={pending} onClick={() => void run(() => onRemove(item.id))} aria-label="O‘chirish"><Trash2/> <span>O‘chirish</span></button>
      </div>
    </div>
    <div className="cart-page-price"><Price value={item.product.price * item.quantity} oldValue={oldTotal}/></div>
  </article>;
}
