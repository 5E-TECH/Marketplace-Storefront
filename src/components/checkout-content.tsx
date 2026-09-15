"use client";

import { CheckCircle2, MapPin, Truck, WalletCards } from "lucide-react";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { orderService } from "@/services/order.service";
import type { CheckoutAddress, DeliveryPreview, Order } from "@/types/commerce";
import { Button, Price } from "./ui";

const emptyAddress: CheckoutAddress = { recipientName: "", phone: "+998", regionId: "", districtId: "", address: "" };
const newIdempotencyKey = () => typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function CheckoutContent() {
  const cart = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [preview, setPreview] = useState<DeliveryPreview | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(newIdempotencyKey());
  const change = (field: keyof CheckoutAddress, value: string) => { setAddress((current) => ({ ...current, [field]: value })); setPreview(null); setError(""); };
  const calculateDelivery = async () => {
    if (previewPending || pending) return;
    setPreviewPending(true); setError("");
    try { await cart.flush(); setPreview(await orderService.preview(address)); }
    catch (caught) { setPreview(null); setError(caught instanceof Error ? caught.message : "Yetkazib berish narxini hisoblab bo‘lmadi"); }
    finally { setPreviewPending(false); }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || cart.loading) return;
    setPending(true); setError("");
    try {
      await cart.flush();
      const delivery = preview ?? await orderService.preview(address);
      setPreview(delivery);
      const order = await orderService.create(address, idempotencyKey.current, delivery);
      setCompleted(order);
      idempotencyKey.current = newIdempotencyKey();
      await cart.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Buyurtma yaratilmadi. Qayta urinib ko‘ring"); }
    finally { setPending(false); }
  };
  if (completed) return <section className="checkout-success"><span><CheckCircle2/></span><p>BUYURTMA QABUL QILINDI</p><h1>Rahmat!</h1><b>Buyurtma raqami: {completed.id}</b>{completed.warning && <p role="alert">{completed.warning}</p>}<small>Buyurtma backendda yaratildi va tasdiqlandi. Endi u sotuvchi kabinetida ko‘rinadi.</small><div><Link className="button button--primary" href={`/orders/${encodeURIComponent(completed.id)}`}>Buyurtmani kuzatish</Link><Link className="button button--secondary" href="/">Bosh sahifa</Link></div></section>;
  if (cart.loading && !cart.items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (cart.error) return <section className="page-empty" role="alert">{cart.error}<button className="button button--primary" onClick={() => cart.refresh()}>Qayta urinish</button></section>;
  if (!cart.items.length) return <section className="page-empty"><h1>Rasmiylashtirish uchun savatcha bo‘sh</h1><Link className="button button--primary" href="/#products">Mahsulot tanlash</Link></section>;
  return <section className="checkout-page"><div className="page-heading"><div><span>CHECKOUT</span><h1>Buyurtmani rasmiylashtirish</h1></div></div><form onSubmit={submit} className="checkout-layout"><div className="checkout-forms">
    <fieldset><legend><MapPin/> Qabul qiluvchi va manzil</legend><div className="form-grid">
      <label><span>Ism-familiya</span><input value={address.recipientName} onChange={(event) => change("recipientName", event.target.value)} required minLength={2} autoComplete="name" placeholder="Ismingiz"/></label>
      <label><span>Telefon</span><input value={address.phone} onChange={(event) => change("phone", event.target.value.replace(/[^+\d]/g, "").slice(0, 13))} required pattern="\+998[0-9]{9}" inputMode="tel" autoComplete="tel" placeholder="+998901234567"/></label>
      <label><span>Viloyat ID</span><input value={address.regionId} onChange={(event) => change("regionId", event.target.value.trim())} required placeholder="Masalan: 10"/></label>
      <label><span>Tuman ID</span><input value={address.districtId} onChange={(event) => change("districtId", event.target.value.trim())} required placeholder="Masalan: 101"/></label>
      <label className="form-wide"><span>Ko‘cha, uy va xonadon</span><textarea value={address.address} onChange={(event) => change("address", event.target.value)} required minLength={5} autoComplete="street-address" placeholder="Ko‘cha, uy va xonadon"/></label>
    </div><Button type="button" variant="secondary" loading={previewPending} onClick={calculateDelivery}><Truck/> Yetkazishni hisoblash</Button></fieldset>
    <fieldset><legend><WalletCards/> To‘lov usuli</legend><div className="payment-options payment-options--single"><label className="active"><input type="radio" checked readOnly/><span><b>Qabul qilganda to‘lash</b><small>Naqd yoki terminal orqali</small></span></label></div></fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div><aside className="order-summary"><h2>Sizning buyurtmangiz</h2>{cart.items.map((item) => <div className="checkout-line" key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<p><span>Mahsulotlar</span><Price value={preview?.subtotal ?? cart.subtotal}/></p><p><span>Yetkazish</span>{preview ? <Price value={preview.deliveryFee}/> : <b>Hisoblanmagan</b>}</p>{preview && <p><span>Posilkalar</span><b>{preview.packages.length || 1} ta</b></p>}<hr/><p className="order-total"><span>Jami</span><Price value={preview?.totalAmount ?? cart.subtotal}/></p><Button disabled={pending || previewPending || cart.loading} type="submit" loading={pending}><Truck/> Buyurtma berish</Button><small>Ro‘yxatdan o‘tish shart emas. Buyurtma backendda yaratilib, COD sifatida tasdiqlanadi.</small></aside></form></section>;
}
