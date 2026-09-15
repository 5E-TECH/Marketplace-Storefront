"use client";

import { CheckCircle2, MapPin, Truck, WalletCards } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { authService } from "@/services/auth.service";
import { orderService } from "@/services/order.service";
import type { CheckoutAddress, DeliveryPreview, Order } from "@/types/commerce";
import { Button, Price } from "./ui";

type CheckoutForm = { recipientName: string; phone: string; region: string; district: string; street: string };

const emptyForm: CheckoutForm = { recipientName: "", phone: "+998", region: "", district: "", street: "" };
const newIdempotencyKey = () => typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const toAddress = (form: CheckoutForm): CheckoutAddress => ({
  recipientName: form.recipientName.trim(),
  phone: form.phone,
  address: [form.region, form.district, form.street].map((value) => value.trim()).filter(Boolean).join(", "),
});
const canPreview = (form: CheckoutForm) => form.recipientName.trim().length >= 2 && /^\+998\d{9}$/.test(form.phone) && form.region.trim().length >= 2 && form.district.trim().length >= 2 && form.street.trim().length >= 5;

export function CheckoutContent() {
  const cart = useCart();
  const { flush: flushCart } = cart;
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState<DeliveryPreview | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(newIdempotencyKey());
  const previewRequest = useRef(0);
  const address = useMemo(() => toAddress(form), [form]);

  useEffect(() => {
    const session = authService.getSession();
    if (session) setForm((current) => ({ ...current, recipientName: current.recipientName || session.name || "", phone: session.phone }));
  }, []);

  useEffect(() => {
    const requestId = ++previewRequest.current;
    setPreview(null);
    if (!canPreview(form)) { setPreviewPending(false); return; }
    const timer = window.setTimeout(async () => {
      setPreviewPending(true);
      try {
        await flushCart();
        const next = await orderService.preview(address);
        if (previewRequest.current === requestId) { setPreview(next); setError(""); }
      } catch (caught) {
        if (previewRequest.current === requestId) setError(caught instanceof Error ? caught.message : "Yetkazib berish narxini hisoblab bo‘lmadi");
      } finally {
        if (previewRequest.current === requestId) setPreviewPending(false);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [address, flushCart, form]);

  const change = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || previewPending || cart.loading) return;
    setPending(true); setError("");
    try {
      await flushCart();
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

  return <section className="checkout-page"><div className="page-heading"><div><span>BUYURTMA</span><h1>Buyurtmani rasmiylashtirish</h1></div></div><form onSubmit={submit} className="checkout-layout"><div className="checkout-forms">
    <fieldset><legend><MapPin/> Qabul qiluvchi va manzil</legend><div className="form-grid">
      <label><span>Ism-familiya</span><input name="recipientName" value={form.recipientName} onChange={(event) => change("recipientName", event.target.value)} required minLength={2} autoComplete="name" placeholder="Ism-familiyangiz"/></label>
      <label><span>Telefon raqami</span><input name="phone" value={form.phone} onChange={(event) => change("phone", event.target.value.replace(/[^+\d]/g, "").slice(0, 13))} required pattern="\+998[0-9]{9}" inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67"/></label>
      <label><span>Viloyat yoki shahar</span><input name="region" value={form.region} onChange={(event) => change("region", event.target.value)} required minLength={2} autoComplete="address-level1" placeholder="Masalan, Toshkent shahri"/></label>
      <label><span>Tuman</span><input name="district" value={form.district} onChange={(event) => change("district", event.target.value)} required minLength={2} autoComplete="address-level2" placeholder="Masalan, Chilonzor tumani"/></label>
      <label className="form-wide"><span>Ko‘cha, uy va xonadon</span><textarea name="street" value={form.street} onChange={(event) => change("street", event.target.value)} required minLength={5} autoComplete="street-address" placeholder="Ko‘cha, uy va xonadon raqami"/></label>
    </div><p className="delivery-preview-status" aria-live="polite">{previewPending ? "Yetkazish narxi hisoblanmoqda…" : preview ? `Yetkazish avtomatik hisoblandi: ${preview.deliveryFee.toLocaleString("uz-UZ")} so‘m` : "Manzil to‘liq kiritilgach yetkazish narxi avtomatik hisoblanadi"}</p></fieldset>
    <fieldset><legend><WalletCards/> To‘lov usuli</legend><div className="payment-options payment-options--single"><label className="active"><input type="radio" checked readOnly/><span><b>Qabul qilganda to‘lash</b><small>Naqd yoki terminal orqali</small></span></label></div></fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div><aside className="order-summary"><h2>Sizning buyurtmangiz</h2>{cart.items.map((item) => <div className="checkout-line" key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<p><span>Mahsulotlar</span><Price value={preview?.subtotal ?? cart.subtotal}/></p><p><span>Yetkazish</span>{preview ? <Price value={preview.deliveryFee}/> : <b>{previewPending ? "Hisoblanmoqda…" : "Manzil bo‘yicha"}</b>}</p>{preview && <p><span>Posilkalar</span><b>{preview.packages.length || 1} ta</b></p>}<hr/><p className="order-total"><span>Jami</span><Price value={preview?.totalAmount ?? cart.subtotal}/></p><Button disabled={pending || previewPending || cart.loading || !canPreview(form)} type="submit" loading={pending}><Truck/> Buyurtma berish</Button><small>Ro‘yxatdan o‘tish shart emas. Yetkazish narxi backend tomonidan manzil asosida hisoblanadi.</small></aside></form></section>;
}
