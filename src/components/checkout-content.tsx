"use client";

import { Banknote, CheckCircle2, MapPin, RefreshCw, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getGuestSessionId } from "@/lib/access-token";
import { checkoutAddress, checkoutCartSignature, emptyCheckoutForm, validateCheckoutForm, type CheckoutForm } from "@/lib/checkout-form";
import { checkoutWasRejected, clearCheckoutAttempt, readCheckoutAttempt, saveCheckoutAttempt, submitCheckoutAttempt, type CheckoutAttempt } from "@/lib/checkout-attempt";
import { useCart } from "@/providers/cart-provider";
import { authService } from "@/services/auth.service";
import { checkoutErrorMessage, checkoutService, type CheckoutAddress, type DeliveryQuote } from "@/services/checkout.service";
import { locationService, type CheckoutDistrict, type CheckoutRegion } from "@/services/location.service";
import { orderService } from "@/services/order.service";
import { Button, Price } from "./ui";

type QuoteState = { key: string; quote?: DeliveryQuote; error?: string };

export function CheckoutContent() {
  const router = useRouter();
  const cart = useCart();
  const [form, setForm] = useState<CheckoutForm>(emptyCheckoutForm);
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutForm, boolean>>>({});
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null);
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(null);
  const attemptRef = useRef<CheckoutAttempt | null>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [regions, setRegions] = useState<CheckoutRegion[]>([]);
  const [districts, setDistricts] = useState<CheckoutDistrict[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [regionsError, setRegionsError] = useState("");
  const [districtsError, setDistrictsError] = useState("");
  const [regionsRetry, setRegionsRetry] = useState(0);
  const [districtsRetry, setDistrictsRetry] = useState(0);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const selectedRegion = regions.find((item) => item.id === form.regionId);
  const selectedDistrict = districts.find((item) => item.id === form.districtId && item.regionId === form.regionId);
  const errors = validateCheckoutForm(form, regions, districts);
  const validForm = Object.keys(errors).length === 0 && !regionsLoading && !districtsLoading && !regionsError && !districtsError;
  const cartSignature = checkoutCartSignature(cart.items);
  const addressJson = selectedRegion && selectedDistrict ? JSON.stringify(checkoutAddress(form, regions, districts)) : "";
  // Include all quantities/prices, not just the number of rows. Old quotes never enable submit.
  const quoteKey = JSON.stringify([addressJson, cartSignature, quoteRetry]);
  const canQuote = hydrated && validForm && cart.items.length > 0 && !cart.loading && !cart.error && !attempt;
  const currentQuote = canQuote && quoteState?.key === quoteKey ? quoteState : null;
  const quote = currentQuote?.quote;
  const quoteLoading = canQuote && !currentQuote;

  useEffect(() => {
    const restore = () => {
      const saved = readCheckoutAttempt(getGuestSessionId());
      attemptRef.current = saved;
      setAttempt(saved);
      setHydrated(true);
      if (!saved) {
        const session = authService.getSession();
        setForm((current) => ({ ...current, phone: session?.phone ?? current.phone }));
      }
    };
    queueMicrotask(restore);
    window.addEventListener("elchi:guest-merged", restore);
    return () => window.removeEventListener("elchi:guest-merged", restore);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setRegionsLoading(true);
    setRegionsError("");
    locationService.listRegions(controller.signal)
      .then((items) => {
        if (!items.length) throw new Error("Viloyatlar ro‘yxati bo‘sh keldi");
        setRegions(items);
        setForm((current) => items.some((item) => item.id === current.regionId) ? current : { ...current, regionId: "", districtId: "" });
      })
      .catch((caught: unknown) => { if (!controller.signal.aborted) setRegionsError(checkoutErrorMessage(caught)); })
      .finally(() => { if (!controller.signal.aborted) setRegionsLoading(false); });
    return () => controller.abort();
  }, [regionsRetry]);

  useEffect(() => {
    if (!form.regionId || !regions.some((item) => item.id === form.regionId)) {
      queueMicrotask(() => { setDistricts([]); setDistrictsError(""); setDistrictsLoading(false); });
      return;
    }
    const controller = new AbortController();
    setDistricts([]);
    setDistrictsLoading(true);
    setDistrictsError("");
    locationService.listDistricts(form.regionId, controller.signal)
      .then((items) => {
        if (!items.length) throw new Error("Bu viloyat uchun tumanlar ro‘yxati bo‘sh keldi");
        setDistricts(items);
        setForm((current) => current.regionId === form.regionId && items.some((item) => item.id === current.districtId) ? current : { ...current, districtId: "" });
      })
      .catch((caught: unknown) => { if (!controller.signal.aborted) setDistrictsError(checkoutErrorMessage(caught)); })
      .finally(() => { if (!controller.signal.aborted) setDistrictsLoading(false); });
    return () => controller.abort();
  }, [districtsRetry, form.regionId, regions]);

  useEffect(() => {
    if (!canQuote) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkoutService.preview(JSON.parse(addressJson) as CheckoutAddress, controller.signal);
        if (!controller.signal.aborted) setQuoteState({ key: quoteKey, quote: result });
      } catch (caught) {
        if (!controller.signal.aborted) setQuoteState({ key: quoteKey, error: checkoutErrorMessage(caught) });
      }
    }, 450);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [addressJson, canQuote, quoteKey]);

  const update = (key: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value, ...(key === "regionId" ? { districtId: "" } : {}) }));
    setError("");
  };
  const fieldProps = (key: keyof CheckoutForm) => ({
    "aria-invalid": Boolean(touched[key] && errors[key]),
    "aria-describedby": touched[key] && errors[key] ? `checkout-${key}-error` : undefined,
    onBlur: () => setTouched((current) => ({ ...current, [key]: true })),
  });
  const fieldError = (key: keyof CheckoutForm) => touched[key] && errors[key]
    ? <small className="field-error" id={`checkout-${key}-error`}>{errors[key]}</small> : null;

  const checkpoint = (next: CheckoutAttempt) => {
    if (next.scope !== getGuestSessionId()) throw new Error("Sessiya o‘zgardi. Buyurtmani boshlagan akkauntingizga qayting.");
    attemptRef.current = next;
    setAttempt(next);
    saveCheckoutAttempt(next);
  };

  const placeOrder = async () => {
    if (busy.current || !hydrated) return;
    if (!cart.beginCheckout()) return;
    const operationScope = getGuestSessionId();
    busy.current = true;
    setPending(true);
    setError("");
    try {
      let current = attemptRef.current;
      if (!current) {
        if (!validForm) {
          setTouched({ name: true, phone: true, regionId: true, districtId: true, street: true });
          return;
        }
        if (!quote || cart.loading || cart.error || !cart.items.length) {
          setError("Savat va yetkazib berish narxi yangilanishini kuting.");
          return;
        }
        const address = checkoutAddress(form, regions, districts);
        current = {
          version: 1, key: crypto.randomUUID(), scope: getGuestSessionId(), phase: "creating",
          payload: { paymentMethod: "cod", address },
          receipt: {
            id: "", createdAt: new Date().toISOString(), status: "Yangi",
            customer: { name: address.recipientName, phone: address.phone, address: address.address },
            items: structuredClone(cart.items), subtotal: cart.subtotal, delivery: quote.total,
            total: cart.subtotal + quote.total, payment: "cash",
          },
        };
      }
      // Persist before sending, so a reload can retry with the original key/order ID.
      checkpoint(current);
      const completed = await submitCheckoutAttempt(current, checkpoint);
      if (completed.scope !== getGuestSessionId()) return;
      attemptRef.current = completed;
      setAttempt(completed);
      // The server has already confirmed. Browser storage failures must never invite a new order.
      let saved = true;
      try { saveCheckoutAttempt(completed); await orderService.record(completed.receipt); }
      catch { saved = false; setWarning("Buyurtma tasdiqlandi, lekin shu brauzerdagi tarixga saqlanmadi. Buyurtma raqamini yozib oling."); }
      await cart.refresh();
      router.replace(`/orders/${encodeURIComponent(completed.receipt.id)}?placed=1${saved ? "" : "&saved=0"}`);
    } catch (caught) {
      if (attemptRef.current?.scope === operationScope && attemptRef.current.phase === "creating" && checkoutWasRejected(caught)) {
        try {
          clearCheckoutAttempt(attemptRef.current.scope);
          attemptRef.current = null;
          setAttempt(null);
          setQuoteRetry((value) => value + 1);
        } catch { /* Keep the saved attempt if storage cannot be cleared. */ }
      }
      setError(checkoutErrorMessage(caught));
    } finally { cart.endCheckout(); busy.current = false; setPending(false); }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void placeOrder(); };
  const leaveSuccess = () => {
    if (attempt) { try { clearCheckoutAttempt(attempt.scope); } catch { /* Receipt remains recoverable on reload. */ } }
  };

  if (!hydrated) return <section className="page-empty" role="status">Buyurtma ma’lumotlari yuklanmoqda...</section>;
  if (attempt?.phase === "confirmed") return <section className="checkout-success" data-testid="checkout-success">
    <span><CheckCircle2/></span><p>BUYURTMA TASDIQLANDI</p><h1>Rahmat!</h1>
    <b>Buyurtma raqami: {attempt.receipt.id}</b>
    <small>Buyurtmangiz qabul qilindi. To‘lovni mahsulotni olganingizda amalga oshirasiz.</small>
    <Price value={attempt.receipt.total}/>
    {warning && <p className="form-error" role="status">{warning}</p>}
    <div><Link className="button button--primary" href="/profile/orders" onClick={leaveSuccess}>Buyurtmani ko‘rish</Link><Link className="button button--secondary" href="/" onClick={leaveSuccess}>Xaridni davom ettirish</Link></div>
  </section>;

  // The cart may already be empty after create. Confirmation recovery takes precedence.
  if (attempt) return <section className="checkout-page checkout-recovery" data-testid="checkout-recovery">
    <h1>{attempt.phase === "confirming" ? "Buyurtmani tasdiqlash" : "Buyurtmani tekshirish"}</h1>
    {attempt.receipt.id && <p>Buyurtma raqami: <b>{attempt.receipt.id}</b></p>}
    <p>{attempt.receipt.customer.name} · {attempt.receipt.customer.phone}</p>
    <p>{attempt.receipt.customer.address}</p>
    <div className="order-summary">{attempt.receipt.items.map((item) => <div className="checkout-line" key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<p><span>Yetkazish</span><Price value={attempt.receipt.delivery}/></p><p className="order-total"><span>Jami</span><Price value={attempt.receipt.total}/></p></div>
    <p>{pending ? "Buyurtmangiz qayta ishlanmoqda..." : "Yakuniy javob olinmadi. Davom etish tugmasi shu buyurtmani qayta tekshiradi."}</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button data-testid="retry-checkout" loading={pending} disabled={cart.loading} onClick={() => void placeOrder()}><RefreshCw/> {attempt.phase === "confirming" ? "Tasdiqlashni davom ettirish" : "Buyurtmani qayta tekshirish"}</Button>
  </section>;

  if (cart.loading && !cart.items.length) return <section className="page-empty" role="status">Savatcha yuklanmoqda...</section>;
  if (cart.error) return <section className="page-empty" role="alert"><p>{cart.error}</p><Button loading={cart.loading} onClick={cart.refresh}>Savatni qayta yuklash</Button></section>;
  if (!cart.items.length) return <section className="page-empty"><h1>Rasmiylashtirish uchun savatcha bo‘sh</h1><Link className="button button--primary" href="/#products">Mahsulot tanlash</Link></section>;

  return <section className="checkout-page">
    <div className="page-heading"><div><span>BUYURTMA</span><h1>Buyurtmani rasmiylashtirish</h1></div><Link href="/cart">Savatga qaytish</Link></div>
    <form onSubmit={submit} className="checkout-layout" noValidate>
      <div className="checkout-forms">
        <fieldset disabled={pending}><legend><MapPin/> Qabul qiluvchi va manzil</legend>
          <div className="form-grid">
            <label><span>Ism-familiya</span><input name="name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Ismingiz" {...fieldProps("name")}/>{fieldError("name")}</label>
            <label><span>Telefon</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={13} value={form.phone} onChange={(event) => update("phone", event.target.value.replace(/[^\d+]/g, "").slice(0, 13))} placeholder="+998901234567" {...fieldProps("phone")}/>{fieldError("phone")}</label>
            <label><span>Viloyat</span><select name="regionId" required disabled={regionsLoading || Boolean(regionsError)} value={form.regionId} onChange={(event) => update("regionId", event.target.value)} {...fieldProps("regionId")}><option value="">{regionsLoading ? "Viloyatlar yuklanmoqda..." : "Viloyatni tanlang"}</option>{regions.map((region) => <option value={region.id} key={region.id}>{region.name}</option>)}</select>{regionsError ? <span className="location-error" role="alert">{regionsError}<button type="button" onClick={() => setRegionsRetry((value) => value + 1)}>Qayta yuklash</button></span> : fieldError("regionId")}</label>
            <label><span>Tuman</span><select name="districtId" required disabled={!selectedRegion || districtsLoading || Boolean(districtsError)} value={form.districtId} onChange={(event) => update("districtId", event.target.value)} {...fieldProps("districtId")}><option value="">{districtsLoading ? "Tumanlar yuklanmoqda..." : "Tumanni tanlang"}</option>{districts.map((district) => <option value={district.id} key={district.id}>{district.name}</option>)}</select>{districtsError ? <span className="location-error" role="alert">{districtsError}<button type="button" onClick={() => setDistrictsRetry((value) => value + 1)}>Qayta yuklash</button></span> : fieldError("districtId")}</label>
            <label className="form-wide"><span>Ko‘cha, uy va xonadon</span><textarea name="address" autoComplete="street-address" required minLength={5} maxLength={300} value={form.street} onChange={(event) => update("street", event.target.value)} placeholder="Amir Temur ko‘chasi, 1-uy, 12-xonadon" {...fieldProps("street")}/>{fieldError("street")}</label>
          </div>
        </fieldset>
        <fieldset disabled={pending}><legend><Banknote/> To‘lov usuli</legend><div className="payment-options payment-options--single"><label className="active"><input type="radio" name="payment" value="cod" checked readOnly/><Banknote/><span><b>Qo‘lga to‘lash</b><small>Buyurtmani qabul qilganda to‘laysiz</small></span></label></div></fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
      <aside className="order-summary" data-testid="checkout-summary">
        <h2>Sizning buyurtmangiz</h2>
        {cart.items.map((item) => <div className="checkout-line" key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}
        <p><span>Mahsulotlar</span><Price value={cart.subtotal}/></p>
        <p aria-live="polite"><span>Yetkazish</span>{quoteLoading ? <b role="status">Hisoblanmoqda...</b> : quote ? <span data-testid="delivery-price"><Price value={quote.total}/></span> : <b>—</b>}</p>
        {!validForm && <small>Yetkazish narxini bilish uchun qabul qiluvchi va manzilni to‘ldiring.</small>}
        {currentQuote?.error && <div className="delivery-error"><p role="alert">{currentQuote.error}</p><Button type="button" variant="secondary" onClick={() => setQuoteRetry((value) => value + 1)}><RefreshCw/> Qayta hisoblash</Button></div>}
        <hr/><p className="order-total"><span>Jami</span>{quote ? <Price value={cart.subtotal + quote.total}/> : <b>—</b>}</p>
        <Button data-testid="confirm-checkout" loading={pending} disabled={cart.loading || regionsLoading || districtsLoading} type="submit"><Truck/> Buyurtmani tasdiqlash</Button>
        <small>Ro‘yxatdan o‘tmasdan ham buyurtma berishingiz mumkin.</small>
      </aside>
    </form>
  </section>;
}
