"use client";

import { Plus, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useEffect, useRef, useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useCartActions } from "@/providers/cart-provider";
import { buyNowHref } from "@/lib/cart-selection";
import { getSafeImageSrc } from "@/lib/product-storage";
import { cartService } from "@/services/cart.service";
import type { Product } from "@/types/commerce";
import { FavoriteButton, Price, QuantityStepper } from "./ui";

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [failedImage, setFailedImage] = useState("");
  // Ro'yxatdagi barcha kartalar oldindan yuklanmaydi (server yuklamasi): faqat sichqoncha kelgan yoki fokuslangan karta.
  // Bosilganda mahsulot sahifasi tayyor turadi va darhol ochiladi.
  const [prefetch, setPrefetch] = useState(false);
  const imageBounds = useRef<{ left: number; width: number } | null>(null);
  const variant = product.variants?.find((item) => item.stock === undefined || item.stock > 0);
  const cart = useCartActions();
  const { pending, run } = useAsyncAction();
  const router = useRouter();
  // Savat yuklanmaguncha karta mahsulot savatda borligini bilmaydi — qo'shish/tez xarid miqdorni ikkilantirmasin.
  const busy = pending || !cart.ready;
  const cartItem = cart.items.find((item) => String(item.productId) === String(product.id) && String(item.variantId ?? "") === String(variant?.id ?? ""));
  const productHref = `/product/${encodeURIComponent(String(product.id))}`;
  useEffect(() => { cartService.rememberProduct(product); }, [product]);
  // Savatda bo'lsa o'sha miqdor bilan, bo'lmasa 1 dona qo'shib — checkout faqat shu mahsulot bilan ochiladi.
  const buyNow = () => {
    if (!variant) return;
    const href = buyNowHref(product.id, variant.id);
    if (cartItem) { router.push(href); return; }
    void run(async () => {
      if (await cart.add({ product, quantity: 1, color: variant.color ?? product.colors[0] ?? "", variantId: variant.id })) router.push(href);
    });
  };
  // Rasm ustida sichqoncha surilganda galereya varaqlanadi: kenglik bo'yicha qaysi bo'lakda turgani hisoblanadi.
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
  return <article className="product-card" data-product-id={product.id} onPointerEnter={() => setPrefetch(true)} onFocusCapture={() => setPrefetch(true)}>
    <div className="product-image" onPointerEnter={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); imageBounds.current = { left: bounds.left, width: bounds.width }; }} onPointerMove={(event) => selectImage(event.clientX)} onPointerLeave={() => { imageBounds.current = null; setActiveImage(0); }}>
      {(product.badge || discount > 0) && <span className="badge">{product.badge || `−${discount}%`}</span>}
      <Link href={productHref} prefetch={prefetch} className="product-image-link" aria-label={product.name}>
        <Image key={currentImage} src={imageSrc} alt={product.name} fill sizes="(max-width: 640px) 46vw, (max-width: 860px) 31vw, (max-width: 1050px) 24vw, 236px" onError={() => setFailedImage(currentImage)}/>
      </Link>
      <FavoriteButton product={product}/>
      {product.images.length > 1 && <span className="hover-dots">{product.images.map((_, index) => <i className={index === activeImage ? "active" : ""} key={index}/>)}</span>}
      <div className="product-cart-control">
        {cartItem
          ? <QuantityStepper className="product-cart-stepper" testId="product-card-stepper" value={cartItem.quantity} decreaseAction="remove" max={variant?.stock} disabled={pending}
              // Miqdor optimistik va debounce bilan yangilanadi (bir necha bosish — bitta PATCH): tugmani bloklamaymiz,
              // aks holda tez bosishlar yo'qoladi. Faqat o'chirish tarmoq amali sifatida kutiladi.
              onDecrease={() => { if (cartItem.quantity === 1) void run(() => cart.remove(cartItem.id)); else void cart.update(cartItem.id, cartItem.quantity - 1); }}
              onIncrease={() => { void cart.update(cartItem.id, cartItem.quantity + 1); }}/>
          : <button data-testid="product-card-add" type="button" className="product-add" disabled={busy || !variant} aria-busy={busy || undefined} aria-label={variant ? "Savatchaga qo‘shish" : "Mahsulot varianti mavjud emas"}
              onClick={() => void run(() => cart.add({ product, quantity: 1, color: variant?.color ?? product.colors[0] ?? "", variantId: variant?.id }))}><Plus/></button>}
      </div>
    </div>
    <div className="product-info">
      <Price value={product.price} oldValue={product.oldPrice}/>
      <Link className="product-title" href={productHref} prefetch={prefetch}><h3>{product.name}</h3></Link>
      <div className="product-meta">
        <span className="eyebrow">{product.shop?.name ?? product.category}</span>
        {product.rating > 0 && <span className="rating"><Star size={13} fill="currentColor" aria-hidden/><b>{product.rating.toFixed(1)}</b>{product.reviews > 0 && <span>({product.reviews})</span>}</span>}
      </div>
      <button data-testid="product-card-buy" type="button" className="product-buy-now" disabled={busy || !variant} aria-busy={busy || undefined} onClick={buyNow}>{variant ? "Buyurtma berish" : "Sotuvda yo‘q"}</button>
    </div>
  </article>;
});
