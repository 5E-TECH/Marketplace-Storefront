"use client";

import { Banknote, CheckCircle2, MapPin, Truck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { uzbekistanLocations } from "@/data/uzbekistan-locations";
import { useCart } from "@/providers/cart-provider";
import { authService } from "@/services/auth.service";
import { checkoutErrorMessage, checkoutService, type CheckoutAddress, type DeliveryQuote } from "@/services/checkout.service";
import { orderService } from "@/services/order.service";
import { Button, Price } from "./ui";

type FormState = { name: string; phone: string; regionId: string; districtId: string; street: string };
const initialForm: FormState = { name: "", phone: "", regionId: "", districtId: "", street: "" };
const phonePattern = /^\+998\d{9}$/;

const validateForm = (form: FormState): string | null => {
  if (form.name.trim().length < 2) return "Ism kamida 2 ta belgidan iborat bo‘lishi kerak.";
  if (!phonePattern.test(form.phone.trim())) return "Telefonni +998901234567 formatida kiriting.";
  const region = uzbekistanLocations.find((item) => item.id === form.regionId);
  if (!region) return "Viloyatni tanlang.";
  if (!region.districts.some((item) => item.id === form.districtId)) return "Tumanni tanlang.";
  if (form.street.trim().length < 5) return "Ko‘cha, uy va xonadon ma’lumotini to‘liq kiriting.";
  if (form.street.trim().length > 300) return "Manzil 300 ta belgidan oshmasligi kerak.";
  return null;
};

const addressFrom = (form: FormState): CheckoutAddress => ({ recipientName: form.name.trim(), phone: form.phone.trim(), regionId: form.regionId, districtId: form.districtId, address: form.street.trim() });

export function CheckoutContent() {
  const cart = useCart();
  const [form, setForm] = useState<FormState>(initialForm);
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const selectedRegion = useMemo(() => uzbekistanLocations.find((item) => item.id === form.regionId), [form.regionId]);
  const selectedDistrict = useMemo(() => selectedRegion?.districts.find((item) => item.id === form.districtId), [form.districtId, selectedRegion]);

  useEffect(() => {
    const session = authService.getSession();
    if (session) queueMicrotask(() => setForm((current) => ({ ...current, phone: session.phone })));
  }, []);

  const formError = validateForm(form);
  useEffect(() => {
    if (formError || !cart.items.length) {
      queueMicrotask(() => { setQuote(null); setQuoteError(""); setQuoteLoading(false); });
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError("");
      try { setQuote(await checkoutService.preview(addressFrom(form), controller.signal)); }
      catch (caught) { if (!controller.signal.aborted) { setQuote(null); setQuoteError(checkoutErrorMessage(caught)); } }
      finally { if (!controller.signal.aborted) setQuoteLoading(false); }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [cart.items.length, form, formError]);

  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value, ...(key === "regionId" ? { districtId: "" } : {}) }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || cart.loading) return;
    const validation = validateForm(form);
    if (validation) { setError(validation); return; }
    if (!quote) { setError(quoteError || "Yetkazib berish narxi hisoblanishini kuting."); return; }
    const payload = { paymentMethod: "cod" as const, address: addressFrom(form) };
    const signature = JSON.stringify(payload);
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
    setPending(true);
    setError("");
    const snapshot = [...cart.items];
    try {
      const orderId = await checkoutService.place(payload, attempt.current.key);
      await orderService.record({ id: orderId, createdAt: new Date().toISOString(), status: "Yangi", customer: { name: form.name.trim(), phone: form.phone.trim(), address: [selectedRegion?.name, selectedDistrict?.name, form.street.trim()].filter(Boolean).join(", ") }, items: snapshot, subtotal: cart.subtotal, delivery: quote.total, total: cart.subtotal + quote.total, payment: "cash" });
      setCompletedOrderId(orderId);
      await cart.refresh();
    } catch (caught) { setError(checkoutErrorMessage(caught)); }
    finally { setPending(false); }
  };

  if (completedOrderId) return <section className="checkout-success" data-testid="checkout-success"><span><CheckCircle2/></span><p>BUYURTMA TASDIQLANDI</p><h1>Rahmat!</h1><b>Buyurtma raqami: {completedOrderId}</b><small>Buyurtma backendda yaratildi va sotuvchiga yuborildi. Yetkazish holatini buyurtmalar sahifasida ko‘rishingiz mumkin.</small><div><Link className="button button--primary" href="/profile/orders">Buyurtmani ko‘rish</Link><Link className="button button--secondary" href="/">Bosh sahifa</Link></div></section>;
  if (cart.loading && !cart.items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (cart.error && !cart.items.length) return <section className="page-empty" role="alert">{cart.error}<button className="button button--primary" onClick={cart.refresh}>Qayta urinish</button></section>;
  if (!cart.items.length) return <section className="page-empty"><h1>Rasmiylashtirish uchun savatcha bo‘sh</h1><Link className="button button--primary" href="/#products">Mahsulot tanlash</Link></section>;

  return <section className="checkout-page"><div className="page-heading"><div><span>BUYURTMA</span><h1>Buyurtmani rasmiylashtirish</h1></div></div><form onSubmit={submit} className="checkout-layout" noValidate><div className="checkout-forms">
    <fieldset><legend><MapPin/> Qabul qiluvchi va manzil</legend><div className="form-grid"><label><span>Ism-familiya</span><input name="name" autoComplete="name" required minLength={2} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ismingiz"/></label><label><span>Telefon</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={form.phone} onChange={(event) => update("phone", event.target.value.replace(/[^\d+]/g, "").slice(0, 13))} placeholder="+998901234567"/></label><label><span>Viloyat</span><select name="regionId" required value={form.regionId} onChange={(event) => update("regionId", event.target.value)}><option value="">Viloyatni tanlang</option>{uzbekistanLocations.map((region) => <option value={region.id} key={region.id}>{region.name}</option>)}</select></label><label><span>Tuman</span><select name="districtId" required disabled={!selectedRegion} value={form.districtId} onChange={(event) => update("districtId", event.target.value)}><option value="">Tumanni tanlang</option>{selectedRegion?.districts.map((district) => <option value={district.id} key={district.id}>{district.name}</option>)}</select></label><label className="form-wide"><span>Ko‘cha, uy va xonadon</span><textarea name="address" required minLength={5} maxLength={300} value={form.street} onChange={(event) => update("street", event.target.value)} placeholder="Amir Temur ko‘chasi, 1-uy, 12-xonadon"/></label></div></fieldset>
    <fieldset><legend><Banknote/> To‘lov usuli</legend><div className="payment-options payment-options--single"><label className="active"><input type="radio" name="payment" value="cod" checked readOnly/><Banknote/><span><b>Qo‘lga to‘lash</b><small>Buyurtmani qabul qilganda naqd yoki terminal orqali</small></span></label></div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}
  </div><aside className="order-summary" data-testid="checkout-summary"><h2>Sizning buyurtmangiz</h2>{cart.items.map((item) => <div className="checkout-line" key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<p><span>Mahsulotlar</span><Price value={cart.subtotal}/></p><p><span>Yetkazish</span>{quoteLoading ? <b role="status">Hisoblanmoqda...</b> : quote ? <Price value={quote.total}/> : <b>—</b>}</p>{quoteError && <p className="delivery-error" role="alert">{quoteError}</p>}<hr/><p className="order-total"><span>Jami</span>{quote ? <Price value={cart.subtotal + quote.total}/> : <b>—</b>}</p><Button data-testid="confirm-checkout" disabled={pending || cart.loading || quoteLoading || !quote} type="submit"><Truck/> {pending ? "Tasdiqlanmoqda..." : "Buyurtmani tasdiqlash"}</Button><small>Ro‘yxatdan o‘tmasdan ham buyurtma berishingiz mumkin.</small></aside></form></section>;
}
