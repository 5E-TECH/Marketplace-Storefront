"use client";

import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/providers/cart-provider";
import { getSafeImageSrc } from "@/lib/product-storage";
import { productPath } from "@/lib/product-url";
import { Button, Price } from "./ui";

export function CartDrawer() {
  const { items, subtotal, open, loading, error, setOpen, update, remove } = useCart();

  return <>
    <button className={`cart-backdrop ${open ? "open" : ""}`} onClick={() => setOpen(false)} aria-label="Savatchani yopish"/>
    <aside className={`cart-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
      <header><div><ShoppingBag/><b>Savatcha</b><span>{items.length}</span></div><button onClick={() => setOpen(false)} aria-label="Yopish"><X/></button></header>
      <div className="cart-items">
        {error && <p className="cart-error">{error}</p>}
        {!items.length ? <div className="empty-cart"><span><ShoppingBag/></span><h3>Savatchangiz bo‘sh</h3><p>Yoqtirgan mahsulotingizni tanlang — bu yerda kutib turadi.</p><Button onClick={() => setOpen(false)}>Xaridni boshlash</Button></div> : items.map((item) =>
          <article className="cart-item" key={item.id}>
            <Link href={productPath(item.product)} onClick={() => setOpen(false)}><Image src={getSafeImageSrc(item.product.image)} alt={item.product.name} fill sizes="90px"/></Link>
            <div><Link href={productPath(item.product)} onClick={() => setOpen(false)}><b>{item.product.name}</b></Link><small>Rang: <i style={{ background: item.color }}/></small><Price value={item.product.price * item.quantity}/><div className="cart-item-actions"><button disabled={loading || item.quantity <= 1} onClick={() => update(item.id, item.quantity - 1)} aria-label="Kamaytirish"><Minus/></button><span>{item.quantity}</span><button disabled={loading} onClick={() => update(item.id, item.quantity + 1)} aria-label="Ko‘paytirish"><Plus/></button><button data-testid="cart-remove-item" disabled={loading} onClick={() => remove(item.id)} aria-label="O‘chirish"><Trash2/></button></div></div>
          </article>)}
      </div>
      {!!items.length && <footer><p><span>Jami</span><Price value={subtotal}/></p><Link className="button button--primary" href="/checkout" onClick={() => setOpen(false)}>Buyurtma berish</Link><Link className="cart-page-link" href="/cart" onClick={() => setOpen(false)}>Savatchani to‘liq ko‘rish</Link><small>Yetkazib berish keyingi bosqichda hisoblanadi</small></footer>}
    </aside>
  </>;
}
