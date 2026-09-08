"use client";

import { Heart, Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import { useCartActions } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { getSafeImageSrc } from "@/lib/product-storage";
import type { Product } from "@/types/commerce";
import { Price } from "./ui";

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const variant = product.variants?.find((item) => item.stock === undefined || item.stock > 0);
  const { add } = useCartActions();
  const favorites = useFavorites();
  const selectImage = (clientX: number, left: number, width: number) => {
    const index = Math.min(product.images.length - 1, Math.floor(((clientX - left) / width) * product.images.length));
    const nextImage = Math.max(0, index);
    if (nextImage !== activeImage) setActiveImage(nextImage);
  };
  return <article className="product-card">
    <div className="product-image" onMouseMove={(event) => selectImage(event.clientX, event.currentTarget.getBoundingClientRect().left, event.currentTarget.offsetWidth)} onMouseLeave={() => setActiveImage(0)}>
      {product.badge && <span className="badge">{product.badge}</span>}
      <Link href={`/product/${product.id}`} className="product-image-link" aria-label={product.name}>
        <Image key={product.images[activeImage]} src={getSafeImageSrc(product.images[activeImage])} alt={product.name} fill sizes="(max-width: 640px) 45vw, (max-width: 1000px) 30vw, 190px"/>
      </Link>
      <button className={`favorite ${favorites.has(product.id) ? "active" : ""}`} type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); favorites.toggle(product); }} aria-label={favorites.has(product.id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}><Heart size={19} fill={favorites.has(product.id) ? "currentColor" : "none"}/></button>
      <span className="hover-dots">{product.images.map((_, index) => <i className={index === activeImage ? "active" : ""} key={index}/>)}</span>
    </div>
    <div className="product-info"><span className="eyebrow">{product.shop?.name ?? product.category}</span><Link href={`/product/${product.id}`}><h3>{product.name}</h3></Link>
      <div className="rating"><Star size={14} fill="currentColor"/><b>{product.rating}</b><span>({product.reviews})</span></div>
      <div className="product-bottom"><Price value={product.price} oldValue={product.oldPrice}/><button disabled={!variant} onClick={() => add({ product, quantity: 1, color: variant?.color ?? product.colors[0], variantId: variant?.id })} aria-label={variant ? "Savatchaga qo‘shish" : "Mahsulot varianti mavjud emas"}><Plus/></button></div>
    </div>
  </article>;
});
