"use client";

import { Check, ChevronRight, Clock3, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/commerce";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { Button, Price } from "./ui";
import { ProductInformation } from "./product-information";

export function ProductDetail({ product }: { product: Product }) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeColor, setActiveColor] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const cart = useCart();
  const router = useRouter();
  const favorites = useFavorites();
  const selectedColor = product.colors[activeColor];
  const selectedVariant = product.variants?.find((variant) => variant.color === selectedColor) ?? product.variants?.[activeColor];
  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedOldPrice = selectedVariant?.oldPrice ?? product.oldPrice;
  const selectedProduct = selectedVariant ? { ...product, price: selectedPrice, oldPrice: selectedOldPrice } : product;
  const monthly = Math.ceil(selectedPrice / 12 / 1000) * 1000;
  const buyNow = async () => {
    if (!selectedVariant) return;
    const added = await cart.add({ product: selectedProduct, quantity, color: selectedColor, variantId: selectedVariant.id });
    if (!added) return;
    router.push("/checkout");
  };

  return <>
    <div className="detail-layout">
      <section className="detail-gallery">
        <div className="detail-thumbs">{product.images.map((image, index) => <button className={activeImage === index ? "active" : ""} onMouseEnter={() => setActiveImage(index)} onClick={() => setActiveImage(index)} key={image}><Image src={image} alt="" fill sizes="72px"/></button>)}</div>
        <div className="detail-main-image"><Image src={product.images[activeImage]} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 48vw"/><div className="mobile-image-count">{activeImage + 1} / {product.images.length}</div></div>
      </section>

      <section className="detail-summary">
        <div className="detail-brand">{product.shop?.name ?? "ELCHI SELECT"} <span>Original</span></div>
        <h1>{product.name}</h1>
        <div className="detail-rating"><span><Star fill="currentColor"/> {product.rating}</span><a href="#reviews">{product.reviews} ta sharh</a><i/> <span>500+ buyurtma</span></div>
        <p className="detail-lead">{product.description}</p>

        <div className="option-block"><div className="option-title"><b>Rang</b><span>{activeColor === 0 ? "Asosiy" : `Variant ${activeColor + 1}`}</span></div><div className="color-options">{product.colors.map((color, index) => <button className={activeColor === index ? "active" : ""} onClick={() => setActiveColor(index)} key={color} aria-label={`${index + 1}-rang`}><i style={{ background: color }}/>{activeColor === index && <Check/>}</button>)}</div></div>

        <div className="purchase-card">
          <div className="purchase-price"><Price value={selectedPrice} oldValue={selectedOldPrice}/>{selectedOldPrice && <span>{Math.round((1 - selectedPrice / selectedOldPrice) * 100)}% tejaysiz</span>}</div>
          <button className="installment"><span><b>{formatPrice(monthly)} so‘m</b> × 12 oy</span><small>Foizsiz muddatli to‘lov</small><ChevronRight/></button>
          <div className="purchase-actions"><div className="quantity"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Kamaytirish"><Minus/></button><b>{quantity}</b><button onClick={() => setQuantity(quantity + 1)} aria-label="Ko‘paytirish"><Plus/></button></div><Button disabled={cart.loading || !selectedVariant || selectedVariant.stock === 0} onClick={() => cart.add({ product: selectedProduct, quantity, color: selectedColor, variantId: selectedVariant?.id })}><ShoppingBag/> {!selectedVariant ? "Variant mavjud emas" : selectedVariant.stock === 0 ? "Sotuvda yo‘q" : "Savatchaga qo‘shish"}</Button><button className={`detail-heart ${favorites.has(product.id) ? "active" : ""}`} onClick={() => favorites.toggle(product)} aria-label={favorites.has(product.id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}><Heart fill={favorites.has(product.id) ? "currentColor" : "none"}/></button></div>
          <button className="quick-buy" disabled={cart.loading || !selectedVariant || selectedVariant.stock === 0} onClick={buyNow}>Bir klikda xarid qilish</button>
        </div>

        <div className="service-list"><div><span><Truck/></span><p><b>Ertaga yetkazib beramiz</b><small>Toshkent bo‘ylab kuryer yoki topshirish punktiga</small></p><ChevronRight/></div><div><span><ShieldCheck/></span><p><b>Xavfsiz to‘lov va kafolat</b><small>Karta, naqd yoki bo‘lib to‘lash mumkin</small></p><ChevronRight/></div><div><span><Clock3/></span><p><b>30 kun ichida qaytarish</b><small>Oson, tez va ortiqcha savollarsiz</small></p><ChevronRight/></div></div>
      </section>
    </div>

    <ProductInformation product={product}/>

    <div className="mobile-buy-bar"><div><Price value={selectedPrice}/><small>Ertaga yetkazamiz</small></div><Button disabled={cart.loading || !selectedVariant || selectedVariant.stock === 0} onClick={() => cart.add({ product: selectedProduct, quantity, color: selectedColor, variantId: selectedVariant?.id })}><ShoppingBag/> Savatchaga</Button></div>
  </>;
}
