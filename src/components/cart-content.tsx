"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/providers/cart-provider";
import { getSafeImageSrc } from "@/lib/product-storage";
import { Price } from "./ui";

export function CartContent() {
  const { items, subtotal, quantity, loading, error, update, remove, clear } = useCart();
  if (loading && !items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (error && !items.length) return <section className="page-empty" role="alert">{error}</section>;
  if (!items.length) return <section className="page-empty"><span><ShoppingBag/></span><h1>Savatchangiz bo‘sh</h1><p>Mahsulot yonidagi “+” tugmasini bosing — tanlovingiz shu yerda saqlanadi.</p><Link className="button button--primary" href="/#products">Xaridni boshlash</Link></section>;
  return <section className="cart-page">{error && <p className="cart-error" role="alert">{error}</p>}<div className="page-heading"><div><span>SAVATCHA</span><h1>{quantity} ta mahsulot</h1></div><button disabled={loading} onClick={clear}><Trash2/> Hammasini tozalash</button></div><div className="cart-page-layout"><div className="cart-page-items">{items.map((item) => <article className="cart-page-item" key={item.id}><Link href={`/product/${item.productId}`}><Image src={getSafeImageSrc(item.product.image)} alt={item.product.name} fill sizes="130px"/></Link><div><small>{item.product.shop?.name ?? item.product.category}</small><Link href={`/product/${item.productId}`}><h2>{item.product.name}</h2></Link><span className="item-color">Rang <i style={{ background: item.color }}/></span><div className="quantity"><button disabled={loading || item.quantity <= 1} onClick={() => update(item.id, item.quantity - 1)}><Minus/></button><b>{item.quantity}</b><button disabled={loading} onClick={() => update(item.id, item.quantity + 1)}><Plus/></button></div></div><div className="cart-page-price"><Price value={item.product.price * item.quantity}/><button disabled={loading} onClick={() => remove(item.id)} aria-label="O‘chirish"><Trash2/></button></div></article>)}</div><aside className="order-summary"><h2>Buyurtma</h2><p><span>Mahsulotlar ({quantity})</span><b><Price value={subtotal}/></b></p><p><span>Yetkazib berish</span><b>{subtotal >= 300_000 ? "Bepul" : "25 000 so‘m"}</b></p><hr/><p className="order-total"><span>Jami</span><Price value={subtotal + (subtotal >= 300_000 ? 0 : 25_000)}/></p><Link className="button button--primary" href="/checkout">Rasmiylashtirish</Link><small>Xavfsiz to‘lov · Oson qaytarish</small></aside></div></section>;
}
