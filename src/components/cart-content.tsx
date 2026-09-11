"use client";

import { PackageCheck, ShoppingBag, Store, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/providers/cart-provider";
import { groupCartItemsBySeller } from "@/lib/cart-groups";
import { Price } from "./ui";
import { CartItemRow } from "./cart-item-row";
import { CartSummary } from "./cart-summary";

export function CartContent() {
  const { items, subtotal, quantity, loading, error, clear, refresh } = useCart();
  const sellerGroups = useMemo(() => groupCartItemsBySeller(items), [items]);
  const discount = useMemo(() => items.reduce((total, item) => {
    const variant = item.product.variants?.find((entry) => String(entry.id) === String(item.variantId));
    const oldPrice = variant?.oldPrice ?? item.product.oldPrice ?? item.product.price;
    return total + Math.max(0, oldPrice - item.product.price) * item.quantity;
  }, 0), [items]);
  if (loading && !items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (error && !items.length) return <section className="page-empty" role="alert">{error}<button className="button button--primary" onClick={refresh}>Qayta urinish</button></section>;
  if (!items.length) return <section className="page-empty" data-testid="empty-cart"><span><ShoppingBag/></span><h1>Savatchangiz bo‘sh</h1><p>Mahsulot yonidagi “+” tugmasini bosing — tanlovingiz shu yerda saqlanadi.</p><Link className="button button--primary" href="/#products">Xaridni boshlash</Link></section>;
  return <section className="cart-page">
    {error && <p className="cart-error" role="alert">{error}</p>}
    <div className="page-heading"><div><span>SAVATCHA</span><h1>Savatingiz, <em>{quantity} mahsulot</em></h1></div></div>
    <div className="cart-page-layout">
      <div className="cart-seller-groups">
        <div className="cart-list-toolbar"><b>Barcha mahsulotlar</b><button disabled={loading} onClick={clear}><Trash2/> Savatni tozalash</button></div>
        <div className="cart-delivery-note"><PackageCheck/><span><small>YETKAZIB BERISH</small><b>Narx va muddat manzil tanlangach hisoblanadi</b></span></div>
        {sellerGroups.map((group) => <section className="cart-seller-group" data-testid="cart-seller-group" key={group.key}>
          <header><div><Store/><span><small>SOTUVCHI</small><b>{group.name}</b></span></div><Price value={group.subtotal}/></header>
          <div className="cart-page-items">{group.items.map((item) => <CartItemRow item={item} key={item.id}/>)}</div>
        </section>)}
      </div>
      <CartSummary quantity={quantity} subtotal={subtotal} discount={discount}/>
    </div>
  </section>;
}
