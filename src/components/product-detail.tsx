"use client";

import { Check, ChevronRight, Clock3, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Product, ProductVariant } from "@/types/commerce";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { Button, Price } from "./ui";
import { ProductInformation } from "./product-information";

const optionColor = (variant: ProductVariant) => variant.color ?? (String(variant.attributes.color ?? "") || undefined);
const optionSize = (variant: ProductVariant) => variant.size ?? (String(variant.attributes.size ?? variant.attributes.storage ?? "") || undefined);
const selectable = (variant: ProductVariant) => variant.isActive !== false && variant.stock !== 0;
const unique = (values: (string | undefined)[]) => [...new Set(values.filter((value): value is string => Boolean(value)))];
const swatchColor = (value: string) => /^(#(?:[\da-f]{3}){1,2}|(?:rgb|hsl)a?\(|var\(--)/i.test(value) ? value : undefined;

export function ProductDetail({ product }: { product: Product }) {
  const variants = useMemo(() => product.variants?.filter((variant) => variant.id !== "") ?? [], [product.variants]);
  const initialVariant = variants.find(selectable) ?? variants[0];
  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(initialVariant ? String(initialVariant.id) : "");
  const [quantity, setQuantity] = useState(1);
  const cart = useCart();
  const router = useRouter();
  const favorites = useFavorites();
  const selectedVariant = variants.find((variant) => String(variant.id) === variantId) ?? initialVariant;
  const colors = unique(variants.map(optionColor).concat(product.colors));
  const sizes = unique(variants.map(optionSize));
  const selectedColor = selectedVariant ? optionColor(selectedVariant) ?? product.colors[0] : product.colors[0];
  const selectedSize = selectedVariant ? optionSize(selectedVariant) : undefined;
  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedOldPrice = selectedVariant?.oldPrice ?? product.oldPrice;
  const selectedProduct = selectedVariant ? { ...product, price: selectedPrice, oldPrice: selectedOldPrice } : product;
  const productActive = !["OUT_OF_STOCK", "ARCHIVED", "DRAFT"].includes(product.status ?? "ACTIVE");
  const available = productActive && Boolean(selectedVariant && selectable(selectedVariant));
  const monthly = Math.ceil(selectedPrice / 12 / 1000) * 1000;
  const stockText = !selectedVariant ? "Variant mavjud emas" : !available ? "Sotuvda yo‘q" : selectedVariant.stock !== undefined ? `${selectedVariant.stock} ta qoldi` : "Sotuvda mavjud";

  const selectVariant = (variant: ProductVariant) => {
    setVariantId(String(variant.id));
    setQuantity(1);
    if (variant.image) {
      const imageIndex = product.images.indexOf(variant.image);
      if (imageIndex >= 0) setActiveImage(imageIndex);
    }
  };
  const selectColor = (color: string) => {
    const match = variants.find((variant) => optionColor(variant) === color && (!selectedSize || optionSize(variant) === selectedSize)) ?? variants.find((variant) => optionColor(variant) === color);
    if (match) selectVariant(match);
  };
  const selectSize = (size: string) => {
    const match = variants.find((variant) => optionSize(variant) === size && (!selectedColor || optionColor(variant) === selectedColor)) ?? variants.find((variant) => optionSize(variant) === size);
    if (match) selectVariant(match);
  };
  const addToCart = () => selectedVariant && cart.add({ product: selectedProduct, quantity, color: selectedColor, variantId: selectedVariant.id });
  const buyNow = async () => {
    if (!selectedVariant) return;
    const added = await cart.add({ product: selectedProduct, quantity, color: selectedColor, variantId: selectedVariant.id });
    if (!added) return;
    router.push("/checkout");
  };

  return <>
    <div className="detail-layout">
      <section className="detail-gallery" aria-label="Mahsulot rasmlari">
        <div className="detail-thumbs">{product.images.map((image, index) => <button type="button" className={activeImage === index ? "active" : ""} aria-pressed={activeImage === index} aria-label={`${index + 1}-rasmni ko‘rish`} onMouseEnter={() => setActiveImage(index)} onClick={() => setActiveImage(index)} key={`${image}-${index}`}><Image src={image} alt="" fill sizes="72px"/></button>)}</div>
        <div className="detail-main-image"><Image src={product.images[activeImage]} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 48vw"/><div className="mobile-image-count">{activeImage + 1} / {product.images.length}</div></div>
      </section>

      <section className="detail-summary">
        <div className="detail-brand">{product.shop?.name ?? "ELCHI SELECT"} <span>Original</span></div>
        <h1>{product.name}</h1>
        <div className="detail-rating"><span><Star fill="currentColor"/> {product.rating}</span><a href="#reviews">{product.reviews} ta sharh</a></div>
        <p className="stock-status" data-testid="product-stock" data-available={available}>{stockText}</p>
        <p className="detail-lead" data-testid="product-description">{product.description}</p>

        {colors.length > 0 && variants.some(optionColor) && <div className="option-block"><div className="option-title"><b>Rang</b><span>{selectedColor}</span></div><div className="variant-options">{colors.filter((color) => variants.some((variant) => optionColor(variant) === color)).map((color) => <button type="button" className={selectedColor === color ? "active" : ""} onClick={() => selectColor(color)} key={color} aria-pressed={selectedColor === color}><i style={{ background: swatchColor(color) }}/><span>{color}</span>{selectedColor === color && <Check/>}</button>)}</div></div>}
        {sizes.length > 0 && <div className="option-block"><div className="option-title"><b>O‘lcham / xotira</b><span>{selectedSize}</span></div><div className="variant-options">{sizes.map((size) => <button type="button" className={selectedSize === size ? "active" : ""} onClick={() => selectSize(size)} key={size} aria-pressed={selectedSize === size}><span>{size}</span>{selectedSize === size && <Check/>}</button>)}</div></div>}

        <div className="purchase-card">
          <div className="purchase-price"><Price value={selectedPrice} oldValue={selectedOldPrice}/>{selectedOldPrice && <span>{Math.round((1 - selectedPrice / selectedOldPrice) * 100)}% tejaysiz</span>}</div>
          <button className="installment"><span><b>{formatPrice(monthly)} so‘m</b> × 12 oy</span><small>Foizsiz muddatli to‘lov</small><ChevronRight/></button>
          <div className="purchase-actions"><div className="quantity"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Kamaytirish"><Minus/></button><b>{quantity}</b><button type="button" disabled={!available || (selectedVariant?.stock !== undefined && quantity >= selectedVariant.stock)} onClick={() => setQuantity(quantity + 1)} aria-label="Ko‘paytirish"><Plus/></button></div><Button data-testid="product-add-to-cart" loading={cart.loading} disabled={!available} onClick={addToCart}><ShoppingBag/> {!selectedVariant ? "Variant mavjud emas" : !available ? "Sotuvda yo‘q" : "Savatchaga qo‘shish"}</Button><button className={`detail-heart ${favorites.has(product.id) ? "active" : ""}`} onClick={() => favorites.toggle(product)} aria-label={favorites.has(product.id) ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}><Heart fill={favorites.has(product.id) ? "currentColor" : "none"}/></button></div>
          <button className="quick-buy" disabled={cart.loading || !available} onClick={buyNow}>Bir klikda xarid qilish</button>
        </div>

        <div className="service-list"><div><span><Truck/></span><p><b>Ertaga yetkazib beramiz</b><small>Toshkent bo‘ylab kuryer yoki topshirish punktiga</small></p><ChevronRight/></div><div><span><ShieldCheck/></span><p><b>Xavfsiz to‘lov va kafolat</b><small>Karta, naqd yoki bo‘lib to‘lash mumkin</small></p><ChevronRight/></div><div><span><Clock3/></span><p><b>30 kun ichida qaytarish</b><small>Oson, tez va ortiqcha savollarsiz</small></p><ChevronRight/></div></div>
      </section>
    </div>

    <ProductInformation product={product}/>

    <div className="mobile-buy-bar"><div><Price value={selectedPrice}/><small>{stockText}</small></div><Button loading={cart.loading} disabled={!available} onClick={addToCart}><ShoppingBag/> Savatchaga</Button></div>
  </>;
}
