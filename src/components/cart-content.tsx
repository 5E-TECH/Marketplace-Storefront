"use client";

import { Minus, Plus, ShoppingBag, Store, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "@/providers/cart-provider";
import { getSafeImageSrc } from "@/lib/product-storage";
import { productPath } from "@/lib/product-url";
import { groupCartItemsBySeller } from "@/lib/cart-groups";
import { Price } from "./ui";

export function CartContent() {
  const { items, subtotal, quantity, loading, error, update, remove, clear, refresh } = useCart();
  const sellerGroups = useMemo(() => groupCartItemsBySeller(items), [items]);
  if (loading && !items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (error && !items.length) return <section className="page-empty" role="alert">{error}<button className="button button--primary" onClick={refresh}>Qayta urinish</button></section>;
  if (!items.length) return <section className="page-empty" data-testid="empty-cart"><span><ShoppingBag/></span><h1>Savatchangiz bo‘sh</h1><p>Mahsulot yonidagi “+” tugmasini bosing — tanlovingiz shu yerda saqlanadi.</p><Link className="button button--primary" href="/#products">Xaridni boshlash</Link></section>;
  return <section className="cart-page">
    {error && <p className="cart-error" role="alert">{error}</p>}
    <div className="page-heading"><div><span>SAVATCHA</span><h1>{quantity} ta mahsulot</h1></div><button disabled={loading} onClick={clear}><Trash2/> Hammasini tozalash</button></div>
    <div className="cart-page-layout">
      <div className="cart-seller-groups">
        {sellerGroups.map((group) => <section className="cart-seller-group" data-testid="cart-seller-group" key={group.key}>
          <header><div><Store/><span><small>SOTUVCHI</small><b>{group.name}</b></span></div><Price value={group.subtotal}/></header>
          <div className="cart-page-items">{group.items.map((item) => <article className="cart-page-item" data-testid="cart-page-item" key={item.id}>
            <Link href={productPath(item.product)}><Image src={getSafeImageSrc(item.product.image)} alt={item.product.name} fill sizes="130px"/></Link>
            <div><small>{item.product.shop?.name ?? item.product.category}</small><Link href={productPath(item.product)}><h2>{item.product.name}</h2></Link><span className="item-color">Rang <i style={{ background: item.color }}/></span><div className="quantity"><button disabled={loading || item.quantity <= 1} onClick={() => update(item.id, item.quantity - 1)} aria-label={`${item.product.name} miqdorini kamaytirish`}><Minus/></button><b data-testid="cart-item-quantity">{item.quantity}</b><button disabled={loading} onClick={() => update(item.id, item.quantity + 1)} aria-label={`${item.product.name} miqdorini oshirish`}><Plus/></button></div></div>
            <div className="cart-page-price"><Price value={item.product.price * item.quantity}/><button data-testid="cart-page-remove" disabled={loading} onClick={() => remove(item.id)} aria-label={`${item.product.name}ni o‘chirish`}><Trash2/></button></div>
          </article>)}</div>
        </section>)}
      </div>
      <aside className="order-summary" data-testid="cart-summary"><h2>Buyurtma</h2><p><span>Mahsulotlar ({quantity})</span><b><Price value={subtotal}/></b></p><p><span>Yetkazib berish</span><b>{subtotal >= 300_000 ? "Bepul" : "25 000 so‘m"}</b></p><hr/><p className="order-total"><span>Jami</span><Price value={subtotal + (subtotal >= 300_000 ? 0 : 25_000)}/></p><Link className="button button--primary" href="/checkout">Rasmiylashtirish</Link><small>Xavfsiz to‘lov · Oson qaytarish</small></aside>
    </div>
  </section>;
}
