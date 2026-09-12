"use client";

import { ShoppingBag, Trash2, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { groupCartItems } from "@/lib/cart-groups";
import { useCart } from "@/providers/cart-provider";
import { CartItemRow } from "./cart-item-row";
import { CartSummary } from "./cart-summary";
import { Price } from "./ui";

export function CartContent() {
  const { items, subtotal, quantity, loading, error, update, remove, clear } = useCart();
  const groups = useMemo(() => groupCartItems(items), [items]);
  const originalTotal = useMemo(() => items.reduce((sum, item) => sum + (item.product.oldPrice ?? item.product.price) * item.quantity, 0), [items]);
  if (loading && !items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (error && !items.length) return <section className="page-empty" role="alert">{error}</section>;
  if (!items.length) return <section className="page-empty"><span><ShoppingBag/></span><h1>Savatchangiz bo‘sh</h1><p>Mahsulot yonidagi “+” tugmasini bosing — tanlovingiz shu yerda saqlanadi.</p><Link className="button button--primary" href="/#products">Xaridni boshlash</Link></section>;
  return <section className="cart-page">
    {error && <p className="cart-error" role="alert">{error}</p>}
    <div className="page-heading"><div><span>SAVATCHA</span><h1>Savatingiz, <em>{quantity} mahsulot</em></h1></div></div>
    <div className="cart-page-layout"><div className="cart-main">
      <div className="cart-toolbar"><b>Barcha mahsulotlar</b><button disabled={loading} onClick={clear}><Trash2/> Savatni tozalash</button></div>
      <div className="cart-delivery-note"><Truck/><span><b>Yetkazib berish</b><small>Narx va muddat buyurtmani rasmiylashtirishda manzil bo‘yicha hisoblanadi</small></span></div>
      {groups.map((group, index) => <section className="cart-seller-group" data-testid="cart-seller-group" data-shop-id={group.id} key={group.id}><header><div><span>{index + 1}-posilka · Sotuvchi</span><b>{group.name}</b><small>Alohida yetkaziladi</small></div><Price value={group.subtotal}/></header>{group.items.map((item) => <CartItemRow item={item} loading={loading} onUpdate={update} onRemove={remove} key={item.id}/>)}</section>)}
    </div><CartSummary quantity={quantity} subtotal={subtotal} originalTotal={originalTotal}/></div>
  </section>;
}
