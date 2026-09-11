"use client";

import { Heart, Minus, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useRef, useState } from "react";
import { useCartActions } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { getSafeImageSrc } from "@/lib/product-storage";
import { productPath } from "@/lib/product-url";
import type { Product } from "@/types/commerce";
import { Price } from "./ui";

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const imageBounds = useRef<{ left: number; width: number } | null>(null);
  const variant = product.variants?.find((item) => item.isActive !== false && (item.stock === undefined || item.stock > 0));
  const cart = useCartActions();
  const favorites = useFavorites();
  const isFavorite = favorites.has(product.id);
  const cartItem = variant ? cart.items.find((item) => String(item.productId) === String(product.id) && String(item.variantId) === String(variant.id)) : undefined;
  const decrement = () => cartItem && (cartItem.quantity <= 1 ? cart.remove(cartItem.id) : cart.update(cartItem.id, cartItem.quantity - 1));
  const selectImage = (clientX: number) => {
    const bounds = imageBounds.current;
    if (!bounds || product.images.length < 2) return;
    const index = Math.min(product.images.length - 1, Math.floor(((clientX - bounds.left) / bounds.width) * product.images.length));
    const nextImage = Math.max(0, index);
    if (nextImage !== activeImage) setActiveImage(nextImage);
  };
  return <article className="product-card">
    <div className="product-image" onPointerEnter={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); imageBounds.current = { left: bounds.left, width: bounds.width }; }} onPointerMove={(event) => selectImage(event.clientX)} onPointerLeave={() => { imageBounds.current = null; setActiveImage(0); }}>
      {product.badge && <span className="badge">{product.badge}</span>}
      <Link href={productPath(product)} className="product-image-link" aria-label={product.name}>
        <Image key={product.images[activeImage]} src={getSafeImageSrc(product.images[activeImage])} alt={product.name} fill sizes="(max-width: 640px) 45vw, (max-width: 1000px) 30vw, 190px"/>
      </Link>
      <button className={`favorite ${isFavorite ? "active" : ""}`} type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); favorites.toggle(product); }} aria-label={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}><Heart size={19} fill={isFavorite ? "currentColor" : "none"}/></button>
      <span className="hover-dots">{product.images.map((_, index) => <i className={index === activeImage ? "active" : ""} key={index}/>)}</span>
    </div>
    <div className="product-info"><span className="eyebrow">{product.shop?.name ?? product.category}</span><Link href={productPath(product)}><h3>{product.name}</h3></Link>
      <div className="rating"><Star size={14} fill="currentColor"/><b>{product.rating}</b><span>({product.reviews})</span></div>
      <div className="product-bottom"><Price value={product.price} oldValue={product.oldPrice}/>{cartItem
        ? <div className="product-cart-stepper" data-testid="product-card-stepper"><button disabled={cart.loading} onClick={decrement} aria-label={`${product.name} miqdorini kamaytirish`}><Minus/></button><b>{cartItem.quantity}</b><button disabled={cart.loading || (variant?.stock !== undefined && cartItem.quantity >= variant.stock)} onClick={() => cart.update(cartItem.id, cartItem.quantity + 1)} aria-label={`${product.name} miqdorini oshirish`}><Plus/></button></div>
        : <button data-testid="product-card-add" disabled={!variant || cart.loading} onClick={() => cart.add({ product, quantity: 1, color: variant?.color ?? product.colors[0], variantId: variant?.id })} aria-label={variant ? "Savatchaga qo‘shish" : "Mahsulot varianti mavjud emas"}><Plus/></button>}</div>
    </div>
  </article>;
});
