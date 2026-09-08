"use client";

import { CheckCircle2, CreditCard, MapPin, Store, Truck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { orderService } from "@/services/order.service";
import { authService, type AuthSession } from "@/services/auth.service";
import type { Order } from "@/types/commerce";
import { Button, Price } from "./ui";
import { PhoneAuthModal } from "./phone-auth-modal";

export function CheckoutContent() {
  const cart = useCart();
  const [payment, setPayment] = useState<Order["payment"]>("cash");
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);
  const [authOpen, setAuthOpen] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "courier">("pickup");
  useEffect(() => { const current = authService.getSession(); setSession(current); setAuthOpen(!current); }, []);
  const delivery = cart.subtotal >= 300_000 ? 0 : 25_000;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || cart.loading) return;
    if (!session) { setAuthOpen(true); return; }
    setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const order = await orderService.create({ name: String(form.get("name")), phone: session?.phone ?? String(form.get("phone")), email: String(form.get("email") || ""), address: deliveryMethod === "pickup" ? "Elchi topshirish punkti — Toshkent" : String(form.get("address")) }, payment, deliveryMethod === "pickup" ? 0 : delivery);
      setCompleted(order); await cart.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Buyurtma yaratilmadi"); }
    finally { setPending(false); }
  };
  if (completed) return <section className="checkout-success"><span><CheckCircle2/></span><p>BUYURTMA QABUL QILINDI</p><h1>Rahmat!</h1><b>Buyurtma raqami: {completed.id}</b>{completed.warning && <p role="alert">{completed.warning}</p>}<small>Buyurtma brauzeringizda saqlandi. Holatini profil sahifasida ko‘rishingiz mumkin.</small><div><Link className="button button--primary" href="/profile/orders">Buyurtmani ko‘rish</Link><Link className="button button--secondary" href="/">Bosh sahifa</Link></div></section>;
  if (cart.loading && !cart.items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (cart.error) return <section className="page-empty" role="alert">{cart.error}<button className="button button--primary" onClick={() => cart.refresh()}>Qayta urinish</button></section>;
  if (!cart.items.length) return <section className="page-empty"><h1>Rasmiylashtirish uchun savatcha bo‘sh</h1><Link className="button button--primary" href="/#products">Mahsulot tanlash</Link></section>;
  return <section className="checkout-page">{authOpen && <PhoneAuthModal onClose={() => setAuthOpen(false)} onVerified={(value) => { setSession(value); setAuthOpen(false); }}/>}<div className="page-heading"><div><span>CHECKOUT</span><h1>Buyurtmani rasmiylashtirish</h1></div>{session && <button type="button" onClick={() => setAuthOpen(true)}>{session.phone}</button>}</div><form onSubmit={submit} className="checkout-layout"><div className="checkout-forms"><fieldset><legend><Truck/> Yetkazib berish usuli</legend><div className="payment-options"><label className={deliveryMethod === "pickup" ? "active" : ""}><input type="radio" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")}/><Store/><span><b>Topshirish punkti</b><small>Bepul · qulay vaqtda olib keting</small></span></label><label className={deliveryMethod === "courier" ? "active" : ""}><input type="radio" checked={deliveryMethod === "courier"} onChange={() => setDeliveryMethod("courier")}/><Truck/><span><b>Kuryer orqali</b><small>Eshikkacha yetkazib berish</small></span></label></div></fieldset><fieldset><legend><MapPin/> Qabul qiluvchi va manzil</legend><div className="form-grid"><label><span>Ism-familiya</span><input name="name" required placeholder="Ismingiz"/></label><label><span>Tasdiqlangan telefon</span><input name="phone" readOnly value={session?.phone ?? "Telefon tasdiqlanmagan"}/></label><label><span>Email (ixtiyoriy)</span><input name="email" type="email" placeholder="email@example.com"/></label>{deliveryMethod === "pickup" ? <div className="form-wide pickup-point"><Store/><span><b>Elchi topshirish punkti</b><small>Toshkent shahri · har kuni 09:00–21:00</small></span></div> : <label className="form-wide"><span>Yetkazib berish manzili</span><textarea name="address" required placeholder="Shahar, ko‘cha, uy va xonadon"/></label>}</div></fieldset><fieldset><legend><CreditCard/> To‘lov usuli</legend><div className="payment-options"><label className={payment === "cash" ? "active" : ""}><input type="radio" checked={payment === "cash"} onChange={() => setPayment("cash")}/><span><b>Qabul qilganda</b><small>Naqd yoki terminal orqali</small></span></label><label className={payment === "card" ? "active" : ""}><input type="radio" checked={payment === "card"} onChange={() => setPayment("card")}/><span><b>Karta orqali</b><small>Demo rejim — to‘lov olinmaydi</small></span></label></div></fieldset>{error && <p className="form-error">{error}</p>}</div><aside className="order-summary"><h2>Sizning buyurtmangiz</h2>{cart.items.map((item) => <div className="checkout-line" key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<p><span>Yetkazish</span><b>{deliveryMethod === "pickup" || !delivery ? "Bepul" : "25 000 so‘m"}</b></p><hr/><p className="order-total"><span>Jami</span><Price value={cart.subtotal + (deliveryMethod === "pickup" ? 0 : delivery)}/></p>{!session && <button type="button" className="button button--secondary" onClick={() => setAuthOpen(true)}>Telefonni tasdiqlash</button>}<Button disabled={pending || cart.loading || !session} type="submit"><Truck/> {pending ? "Saqlanmoqda..." : session ? "Buyurtma berish" : "Telefonni tasdiqlang"}</Button><small>Hozircha ma’lumotlar faqat ushbu brauzerda saqlanadi.</small></aside></form></section>;
}
