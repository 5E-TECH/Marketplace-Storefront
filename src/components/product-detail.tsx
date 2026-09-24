"use client";

import { Check, Clock3, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSafeImageSrc } from "@/lib/product-storage";
import type { Product, ProductReviewsResult } from "@/types/commerce";
import { useCart } from "@/providers/cart-provider";
import { cartService } from "@/services/cart.service";
import { Button, FavoriteButton, Price, QuantityStepper } from "./ui";
import { ProductInformation } from "./product-information";
import { ProductReviews } from "./product-reviews";

export function ProductDetail({ product, reviews }: { product: Product; reviews: ProductReviewsResult }) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const cart = useCart();
  const router = useRouter();
  useEffect(() => { cartService.rememberProduct(product); }, [product]);
  const selectedVariant = product.variants?.find((variant) => variant.color === product.colors[activeColor]) ?? product.variants?.[activeColor] ?? product.variants?.[0];
  const selectedColor = product.colors[activeColor] ?? selectedVariant?.color ?? "";
  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedOldPrice = selectedVariant?.oldPrice ?? product.oldPrice;
  const maxQuantity = selectedVariant?.stock;
  const selectedProduct = selectedVariant ? { ...product, price: selectedPrice, oldPrice: selectedOldPrice } : product;
  useEffect(() => { if (maxQuantity !== undefined) setQuantity((current) => Math.min(Math.max(1, maxQuantity), current)); }, [maxQuantity]);
  const buyNow = async () => {
    if (!selectedVariant) return;
    const added = await cart.add({ product: selectedProduct, quantity, color: selectedColor, variantId: selectedVariant.id });
    if (!added) return;
    router.push("/checkout");
  };

  return <>
    <div className="detail-layout">
      <section className={`detail-gallery${product.images.length > 1 ? "" : " detail-gallery--single"}`}>
        {product.images.length > 1 && <div className="detail-thumbs">{product.images.map((image, index) => <button type="button" className={activeImage === index ? "active" : ""} onMouseEnter={() => setActiveImage(index)} onClick={() => setActiveImage(index)} key={image} aria-label={`${index + 1}-rasm`} aria-current={activeImage === index || undefined}><Image src={getSafeImageSrc(image)} alt="" fill sizes="72px"/></button>)}</div>}
        <div className="detail-main-image"><Image src={getSafeImageSrc(product.images[activeImage])} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 48vw"/><div className="mobile-image-count">{activeImage + 1} / {product.images.length}</div></div>
      </section>

      <section className="detail-summary">
        {product.shop?.name && <div className="detail-brand">{product.shop.name}</div>}
        <h1>{product.name}</h1>
        <div className="detail-rating">{(reviews.error ? product.rating : reviews.rating) > 0 && <span><Star fill="currentColor"/> {reviews.error ? product.rating : reviews.rating.toFixed(1)}</span>}<a href="#reviews">{(reviews.error ? product.reviews : reviews.total) > 0 ? `${reviews.error ? product.reviews : reviews.total} ta sharh` : "Hali sharh yo‘q"}</a></div>
        {product.description && <p className="detail-lead">{product.description}</p>}

        {product.colors.length > 0 && <div className="option-block"><div className="option-title"><b>Rang</b><span>{selectedVariant?.name ?? selectedColor}</span></div><div className="color-options">{product.colors.map((color, index) => <button className={activeColor === index ? "active" : ""} onClick={() => setActiveColor(index)} key={color} aria-label={`${color} rang`}><i style={{ background: color }}/>{activeColor === index && <Check/>}</button>)}</div></div>}

        <div className="purchase-card">
          <div className="purchase-price"><Price value={selectedPrice} oldValue={selectedOldPrice}/>{selectedOldPrice && selectedOldPrice > selectedPrice && <span className="purchase-discount">{Math.round((1 - selectedPrice / selectedOldPrice) * 100)}% tejaysiz</span>}</div>
          <div className="purchase-actions">
            <QuantityStepper value={quantity} max={maxQuantity} onDecrease={() => setQuantity((current) => Math.max(1, current - 1))} onIncrease={() => setQuantity((current) => maxQuantity === undefined ? current + 1 : Math.min(maxQuantity, current + 1))}/>
            <Button disabled={cart.loading || !selectedVariant || selectedVariant.stock === 0} onClick={() => cart.add({ product: selectedProduct, quantity, color: selectedColor, variantId: selectedVariant?.id })}><ShoppingBag/> {!selectedVariant ? "Variant mavjud emas" : selectedVariant.stock === 0 ? "Sotuvda yo‘q" : "Savatchaga qo‘shish"}</Button>
            <FavoriteButton product={product} variant="boxed"/>
          </div>
          <button className="quick-buy" disabled={cart.loading || !selectedVariant || selectedVariant.stock === 0} onClick={buyNow}>Bir klikda xarid qilish</button>
        </div>

        <div className="service-list"><div><span><Truck/></span><p><b>Manzil bo‘yicha yetkazib berish</b><small>Narx va muddat rasmiylashtirishda hisoblanadi</small></p></div><div><span><ShieldCheck/></span><p><b>Qabul qilganda to‘lash</b><small>Hozirgi checkout COD to‘lov usulini qo‘llaydi</small></p></div><div><span><Clock3/></span><p><b>Buyurtmani kuzatish</b><small>Holatini buyurtmalar sahifasida tekshirishingiz mumkin</small></p></div></div>
      </section>
    </div>

    <ProductInformation product={product}/>
    <ProductReviews productId={product.id} reviews={reviews}/>

    <div className="mobile-buy-bar"><div><Price value={selectedPrice}/><small>Yetkazish manzil bo‘yicha</small></div><Button disabled={cart.loading || !selectedVariant || selectedVariant.stock === 0} onClick={() => cart.add({ product: selectedProduct, quantity, color: selectedColor, variantId: selectedVariant?.id })}><ShoppingBag/> Savatchaga</Button></div>
  </>;
}
