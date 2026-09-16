"use client";

import { Heart, Minus, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { useCartActions } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { getSafeImageSrc } from "@/lib/product-storage";
import { cartService } from "@/services/cart.service";
import type { Product } from "@/types/commerce";
import { Price } from "./ui";

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [failedImage, setFailedImage] = useState("");
  const [cartPending, setCartPending] = useState(false);
  const cartPendingRef = useRef(false);
  const imageBounds = useRef<{ left: number; width: number } | null>(null);
  const variant = product.variants?.find((item) => item.stock === undefined || item.stock > 0);
  const cart = useCartActions();
  const favorites = useFavorites();
  const cartItem = cart.items.find((item) => String(item.productId) === String(product.id) && String(item.variantId ?? "") === String(variant?.id ?? ""));
  const isFavorite = favorites.has(product.id);
  useEffect(() => { cartService.rememberProduct(product); }, [product]);
  const runCartAction = async (action: () => Promise<unknown>) => {
    if (cartPendingRef.current) return;
    cartPendingRef.current = true;
    setCartPending(true);
    try { await action(); }
    finally { cartPendingRef.current = false; setCartPending(false); }
  };
  const selectImage = (clientX: number) => {
    const bounds = imageBounds.current;
    if (!bounds || !product.images.length) return;
    const index = Math.min(product.images.length - 1, Math.floor(((clientX - bounds.left) / bounds.width) * product.images.length));
    const nextImage = Math.max(0, index);
    if (nextImage !== activeImage) setActiveImage(nextImage);
  };
  const currentImage = product.images[activeImage] ?? product.image;
  const imageSrc = failedImage === currentImage ? "/placeholder-product.svg" : getSafeImageSrc(currentImage);
  const discount = product.oldPrice && product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  return <article className="product-card">
    <div className="product-image" onPointerEnter={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); imageBounds.current = { left: bounds.left, width: bounds.width }; }} onPointerMove={(event) => selectImage(event.clientX)} onPointerLeave={() => { imageBounds.current = null; setActiveImage(0); }}>
      {(product.badge || discount > 0) && <span className="badge">{product.badge || `−${discount}%`}</span>}
      <Link href={`/product/${product.id}`} prefetch={false} className="product-image-link" aria-label={product.name}>
        <Image key={currentImage} src={imageSrc} alt={product.name} fill sizes="(max-width: 640px) 45vw, (max-width: 860px) 30vw, (max-width: 1050px) 24vw, 240px" onError={() => setFailedImage(currentImage)}/>
      </Link>
      <button className={`favorite ${isFavorite ? "active" : ""}`} type="button" disabled={!favorites.hydrated || favorites.isPending(product.id)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void favorites.toggle(product); }} aria-label={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}><Heart size={19} fill={isFavorite ? "currentColor" : "none"}/></button>
      <span className="hover-dots">{product.images.map((_, index) => <i className={index === activeImage ? "active" : ""} key={index}/>)}</span>
    </div>
    <div className="product-info"><span className="eyebrow">{product.shop?.name ?? product.category}</span><Link href={`/product/${product.id}`} prefetch={false}><h3>{product.name}</h3></Link>
      {(product.rating > 0 || product.reviews > 0) && <div className="rating"><Star size={14} fill="currentColor"/><b>{product.rating}</b><span>({product.reviews})</span></div>}
      <div className="product-bottom"><Price value={product.price} oldValue={product.oldPrice}/>{cartItem ? <div className="product-cart-stepper" data-testid="product-card-stepper">
        <button disabled={cartPending} onClick={() => runCartAction(() => cartItem.quantity === 1 ? cart.remove(cartItem.id) : cart.update(cartItem.id, cartItem.quantity - 1))} aria-label="Kamaytirish"><Minus/></button>
        <b aria-label={`${cartItem.quantity} ta`}>{cartItem.quantity}</b>
        <button disabled={cartPending || (variant?.stock !== undefined && cartItem.quantity >= variant.stock)} onClick={() => runCartAction(() => cart.update(cartItem.id, cartItem.quantity + 1))} aria-label="Ko‘paytirish"><Plus/></button>
      </div> : <button data-testid="product-card-add" disabled={cartPending || !variant} aria-busy={cartPending || undefined} onClick={() => runCartAction(() => cart.add({ product, quantity: 1, color: variant?.color ?? product.colors[0] ?? "", variantId: variant?.id }))} aria-label={variant ? "Savatchaga qo‘shish" : "Mahsulot varianti mavjud emas"}><Plus/></button>}</div>
    </div>
  </article>;
});
