"use client";

import { Check, CheckCircle2, ExternalLink, MapPin, ShoppingCart, Truck, WalletCards } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/providers/cart-provider";
import { clearCartSelection, readCartSelection } from "@/lib/cart-selection";
import { formatPrice } from "@/lib/format";
import { cartService } from "@/services/cart.service";
import { authService } from "@/services/auth.service";
import { orderService } from "@/services/order.service";
import { locationService, type DistrictOption, type RegionOption } from "@/services/location.service";
import type { CheckoutAddress, DeliveryPreview, Order, PaymentMethod } from "@/types/commerce";
import { Button, LoadingGrid, Price, StatePanel } from "./ui";
import { SelectField, type SelectOption } from "./select-field";
import { PaymentBrand } from "./payment-brand";
import { errorMessage } from "@/lib/errors";

type CheckoutForm = { recipientName: string; phone: string; regionId: string; region: string; districtId: string; district: string; street: string };

const emptyForm: CheckoutForm = { recipientName: "", phone: "", regionId: "", region: "", districtId: "", district: "", street: "" };
const newIdempotencyKey = () => typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const toAddress = (form: CheckoutForm): CheckoutAddress => ({
  recipientName: form.recipientName.trim(),
  phone: `+998${form.phone}`,
  address: [form.region, form.district, form.street].map((value) => value.trim()).filter(Boolean).join(", "),
  regionId: form.regionId,
  districtId: form.districtId,
});
/*
 * ⚠️ VAQTINCHA: Payme va Click variantlari o'chirilgan (C3.7 / C8.1, 2026-09-21).
 *
 * Frontend tomoni tayyor — `startPayment`, qaytish sahifasi va holat pollingi
 * yozilgan. LEKIN backend shartnomasi hali yo'q, uchta teshik bor:
 *   1. `order.service.ts` tanaga `returnUrl` qo'shadi, `CreatePaymentDto` esa
 *      atigi {salesOrderId, provider, amount} ni biladi va api-gateway
 *      `forbidNonWhitelisted: true` bilan ishlaydi → 400;
 *   2. `PaymentResultDto` da to'lov havolasi yo'q → qayerga yo'naltirish
 *      noma'lum (backendda URL yasash kodi ham yo'q);
 *   3. `POST /payments` mehmon uchun yopiq — handler `request.user.sub` ni
 *      ishlatadi → ro'yxatdan o'tmagan xaridorda 401.
 *      Bu MVP ning "mehmon buyurtma bera oladi" talabini buzadi.
 *
 * Shu sababli variantlar chiqarilmaydi: aks holda xaridor tugmani bosib
 * xato oladi. Backend kartasi bajarilgach quyidagi ikki qatorni qaytaring —
 * boshqa hech narsaga tegish shart emas.
 */
const paymentChoices: { method: PaymentMethod; title: string; note: string }[] = [
  { method: "cod", title: "Qabul qilganda", note: "Naqd yoki terminal orqali" },
  // { method: "payme", title: "Payme", note: "Karta bilan xavfsiz online to‘lov" },
  // { method: "click", title: "Click", note: "Karta bilan xavfsiz online to‘lov" },
];
const canPreview = (form: CheckoutForm) => form.recipientName.trim().length >= 2 && /^\d{9}$/.test(form.phone) && Boolean(form.regionId) && Boolean(form.districtId) && form.street.trim().length >= 5;

export function CheckoutContent() {
  const cart = useCart();
  const { flush: flushCart } = cart;
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState<DeliveryPreview | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentPending, setPaymentPending] = useState(false);
  const [unpaid, setUnpaid] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [regionsPending, setRegionsPending] = useState(true);
  const [districtsPending, setDistrictsPending] = useState(false);
  const [regionsError, setRegionsError] = useState("");
  const [districtsError, setDistrictsError] = useState("");
  const [regionsReload, setRegionsReload] = useState(0);
  const [districtsReload, setDistrictsReload] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionReady, setSelectionReady] = useState(false);
  const idempotencyKey = useRef(newIdempotencyKey());
  const previewRequest = useRef(0);
  const address = useMemo(() => toAddress(form), [form]);
  const selectedItems = useMemo(() => {
    const selected = new Set(selectedIds);
    return cart.items.filter((item) => selected.has(item.id));
  }, [cart.items, selectedIds]);
  const selectedSubtotal = useMemo(() => selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [selectedItems]);

  useEffect(() => {
    if (cart.loading || selectionReady) return;
    setSelectedIds(readCartSelection(cart.items));
    setSelectionReady(true);
  }, [cart.items, cart.loading, selectionReady]);
  // To'lov sahifasidan orqaga qaytilganda savat bo'sh bo'ladi: bo'sh sahifa o'rniga o'sha buyurtmani ko'rsatamiz.
  useEffect(() => {
    let active = true;
    if (cart.loading || cart.items.length) { setUnpaid(null); return; }
    void orderService.lastUnpaidOnline().then((order) => { if (active) setUnpaid(order); }).catch(() => { /* Bo'sh savat paneli baribir ko'rsatiladi. */ });
    return () => { active = false; };
  }, [cart.items.length, cart.loading]);

  useEffect(() => {
    const session = authService.getSession();
    if (session) setForm((current) => ({ ...current, recipientName: current.recipientName || session.name || "", phone: session.phone.replace(/^\+?998/, "").replace(/\D/g, "").slice(0, 9) }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setRegionsPending(true);
    locationService.regions(controller.signal)
      .then((items) => { setRegions(items); setRegionsError(""); })
      .catch((caught) => { if (!controller.signal.aborted) setRegionsError(errorMessage(caught, "Viloyatlarni yuklab bo‘lmadi")); })
      .finally(() => { if (!controller.signal.aborted) setRegionsPending(false); });
    return () => controller.abort();
  }, [regionsReload]);

  useEffect(() => {
    if (!form.regionId) { setDistricts([]); setDistrictsPending(false); setDistrictsError(""); return; }
    const controller = new AbortController();
    setDistrictsPending(true);
    locationService.districts(form.regionId, controller.signal)
      .then((items) => { setDistricts(items); setDistrictsError(""); })
      .catch((caught) => { if (!controller.signal.aborted) setDistrictsError(errorMessage(caught, "Tumanlarni yuklab bo‘lmadi")); })
      .finally(() => { if (!controller.signal.aborted) setDistrictsPending(false); });
    return () => controller.abort();
  }, [form.regionId, districtsReload]);

  useEffect(() => {
    const requestId = ++previewRequest.current;
    setPreview(null);
    if (!selectionReady || !selectedItems.length || selectedItems.length !== cart.items.length || !canPreview(form)) { setPreviewPending(false); return; }
    const timer = window.setTimeout(async () => {
      setPreviewPending(true);
      try {
        await flushCart();
        const next = await orderService.preview(address);
        if (previewRequest.current === requestId) { setPreview(next); setError(""); }
      } catch (caught) {
        if (previewRequest.current === requestId) setError(errorMessage(caught, "Yetkazib berish narxini hisoblab bo‘lmadi"));
      } finally {
        if (previewRequest.current === requestId) setPreviewPending(false);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [address, cart.items.length, flushCart, form, selectedItems.length, selectionReady]);

  const change = (field: keyof CheckoutForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };
  const changeRegion = (option: SelectOption | null) => {
    setForm((current) => ({ ...current, regionId: option?.value ?? "", region: option?.label ?? "", districtId: "", district: "" }));
    setError(""); setDistrictsError("");
  };
  const changeDistrict = (option: SelectOption | null) => {
    setForm((current) => ({ ...current, districtId: option?.value ?? "", district: option?.label ?? "" }));
    setError(""); setDistrictsError("");
  };
  const regionOptions = useMemo(() => regions.map((region) => ({ value: region.id, label: region.name })), [regions]);
  const districtOptions = useMemo(() => districts.map((district) => ({ value: district.id, label: district.name })), [districts]);
  const openPayment = async (order: Order) => {
    setPaymentPending(true); setError("");
    try {
      const redirectUrl = await orderService.startPayment(order);
      window.location.assign(redirectUrl);
    } catch {
      // Backend xabari texnik bo'lishi mumkin; xaridorga nima qilishini aytamiz, buyurtma esa saqlanib qoladi.
      setError("To‘lov sahifasini hozir ochib bo‘lmadi. Buyurtmangiz saqlandi — birozdan keyin “To‘lovni davom ettirish” tugmasi orqali qayta urinib ko‘ring yoki buyurtma sahifasidan to‘lang.");
      setPaymentPending(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || previewPending || cart.loading) return;
    setPending(true); setError("");
    const selected = new Set(selectedIds);
    const deferredItems = cart.items.filter((item) => !selected.has(item.id));
    let deferredRemoved = false;
    try {
      await flushCart();
      for (const item of deferredItems) await cartService.remove(item.id);
      deferredRemoved = true;
      const delivery = await orderService.preview(address);
      setPreview(delivery);
      const order = await orderService.create(address, idempotencyKey.current, delivery, paymentMethod);
      deferredRemoved = false;
      try {
        for (const item of deferredItems) await cartService.add({ product: item.product, quantity: item.quantity, color: item.color, variantId: item.variantId });
      } catch {
        order.warning = [order.warning, "Belgilanmagan mahsulotlarning ayrimlarini savatga qayta tiklab bo‘lmadi."].filter(Boolean).join(" ");
      }
      clearCartSelection();
      setCompleted(order);
      idempotencyKey.current = newIdempotencyKey();
      await cart.refresh();
      if (paymentMethod !== "cod") await openPayment(order);
    } catch (caught) {
      if (deferredRemoved) {
        try {
          for (const item of deferredItems) await cartService.add({ product: item.product, quantity: item.quantity, color: item.color, variantId: item.variantId });
          await cart.refresh();
        } catch { /* Original checkout error is more useful to the buyer. */ }
      }
      setError(errorMessage(caught, "Buyurtma yaratilmadi. Qayta urinib ko‘ring"));
    }
    finally { setPending(false); }
  };

  if (completed) return <section className={`checkout-success${completed.payment === "card" ? " checkout-success--pending" : ""}`}><span>{completed.payment === "card" ? <WalletCards/> : <CheckCircle2/>}</span><p>{completed.payment === "card" ? "TO‘LOV KUTILMOQDA" : "BUYURTMA QABUL QILINDI"}</p><h1>{completed.payment === "card" ? "Buyurtma yaratildi" : "Rahmat!"}</h1><b>Buyurtma raqami: {completed.id}</b>{completed.warning && <p role="alert">{completed.warning}</p>}{error && <p className="form-error" role="alert">{error}</p>}<small>{completed.payment === "card" ? `${completed.paymentProvider === "PAYME" ? "Payme" : "Click"} orqali to‘lov yakunlanmaguncha buyurtma to‘langan hisoblanmaydi. Sahifa ochilmasa qayta urinishingiz mumkin.` : "Buyurtmangiz qabul qilindi. Sotuvchi uni tayyorlab, kuryerga topshiradi — holatini “Buyurtmalarim” bo‘limida kuzatib borasiz."}</small><div>{completed.payment === "card" && <button className="button button--primary" type="button" disabled={paymentPending} onClick={() => void openPayment(completed)}><ExternalLink/>{paymentPending ? "To‘lov sahifasi ochilmoqda…" : "To‘lovni davom ettirish"}</button>}<Link className={completed.payment === "card" ? "button button--secondary" : "button button--primary"} href={`/orders/${encodeURIComponent(completed.id)}`}>Buyurtmani kuzatish</Link><Link className="button button--secondary" href="/">Bosh sahifa</Link></div></section>;
  if ((cart.loading && !cart.items.length) || !selectionReady) return <LoadingGrid count={4} label="Savatcha yuklanmoqda"/>;
  if (cart.error) return <StatePanel kind="error" icon={<ShoppingCart/>} title="Savatchani yuklab bo‘lmadi" description={cart.error} action={<Button onClick={() => void cart.refresh()}>Qayta urinish</Button>}/>;
  if (!cart.items.length && unpaid) return <StatePanel icon={<WalletCards/>} title={`#${unpaid.id} buyurtmasi to‘lovni kutmoqda`} description={error || `Buyurtma yaratilgan, lekin to‘lov yakunlanmagan. ${unpaid.paymentProvider === "CLICK" ? "Click" : "Payme"} sahifasida to‘lovni yakunlang yoki buyurtma sahifasidan keyinroq to‘lang.`} action={<>
    <Button disabled={paymentPending} onClick={() => void openPayment(unpaid)}><ExternalLink/>{paymentPending ? "Ochilmoqda…" : "To‘lovni davom ettirish"}</Button>
    <Link className="button button--secondary" href={`/orders/${encodeURIComponent(unpaid.id)}`}>Buyurtmani kuzatish</Link>
    <Link className="button button--secondary" href="/#products">Yangi xarid</Link>
  </>}/>;
  if (!cart.items.length) return <StatePanel icon={<ShoppingCart/>} title="Rasmiylashtirish uchun savatcha bo‘sh" description="Avval katalogdan mahsulot tanlang — keyin bu yerda buyurtmani rasmiylashtirasiz." action={<Link className="button button--primary" href="/#products">Mahsulot tanlash</Link>}/>;
  if (!selectedItems.length) return <StatePanel icon={<ShoppingCart/>} title="Buyurtma uchun mahsulot tanlanmagan" description="Savatchaga qaytib, buyurtma qilmoqchi bo‘lgan mahsulotlarni belgilang." action={<Link className="button button--primary" href="/cart">Savatchaga qaytish</Link>}/>;

  return <section className="checkout-page"><div className="page-heading"><div><h1>Buyurtmani rasmiylashtirish</h1></div></div><form onSubmit={submit} className="checkout-layout"><div className="checkout-forms">
    <fieldset><legend><MapPin/> Qabul qiluvchi va manzil</legend><div className="form-grid">
      <label><span>Ism-familiya</span><input name="recipientName" value={form.recipientName} onChange={(event) => change("recipientName", event.target.value)} required minLength={2} autoComplete="name" placeholder="Ism-familiyangiz"/></label>
      <label><span>Telefon raqami</span><div className="phone-input"><b aria-hidden="true">+998</b><input name="phone" aria-label="Telefon raqami" value={form.phone} onChange={(event) => change("phone", event.target.value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9))} required pattern="[0-9]{9}" inputMode="numeric" autoComplete="tel-national" maxLength={9} placeholder="90 123 45 67"/></div></label>
      <SelectField label="Viloyat yoki shahar" name="region" value={form.regionId} options={regionOptions} onChange={changeRegion} placeholder="Viloyat yoki shaharni tanlang" disabled={regionsPending} loading={regionsPending} required autoComplete="address-level1"/>
      <SelectField label="Tuman" name="district" value={form.districtId} options={districtOptions} onChange={changeDistrict} placeholder={form.regionId ? "Tumanni tanlang" : "Avval viloyatni tanlang"} disabled={!form.regionId || districtsPending} loading={districtsPending} required autoComplete="address-level2"/>
      <label className="form-wide"><span>Ko‘cha, uy va xonadon</span><textarea name="street" value={form.street} onChange={(event) => change("street", event.target.value)} required minLength={5} autoComplete="street-address" placeholder="Ko‘cha, uy va xonadon raqami"/></label>
    </div><p className="delivery-preview-status" aria-live="polite">{previewPending ? "Yetkazish narxi hisoblanmoqda…" : preview ? `Yetkazish avtomatik hisoblandi: ${formatPrice(preview.deliveryFee)} so‘m` : selectedItems.length !== cart.items.length ? "Tanlangan mahsulotlar uchun yetkazish narxi buyurtma berishda hisoblanadi" : "Manzil to‘liq kiritilgach yetkazish narxi avtomatik hisoblanadi"}</p></fieldset>
    <fieldset><legend><WalletCards/> To‘lov usuli</legend><div className="payment-options">
      {paymentChoices.map(({ method, title, note }) => <label className={`payment-option${paymentMethod === method ? " active" : ""}`} key={method}>
        <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)}/>
        <PaymentBrand method={method}/>
        <span className="payment-option__copy"><b>{title}</b><small>{note}</small></span>
        <span className="payment-option__check" aria-hidden><Check/></span>
      </label>)}
    </div>{paymentMethod !== "cod" && <p className="payment-note">Buyurtma yaratilgach {paymentMethod === "payme" ? "Payme" : "Click"} sahifasiga o‘tasiz. To‘lov oynasini yopsangiz, buyurtma sahifasidan davom ettirishingiz mumkin.</p>}</fieldset>
    {regionsError && <div className="form-error form-error--action" role="alert"><span>Viloyatlar ro‘yxatini yuklab bo‘lmadi. {regionsError}</span><button type="button" onClick={() => setRegionsReload((value) => value + 1)}>Qayta urinish</button></div>}
    {districtsError && <div className="form-error form-error--action" role="alert"><span>Tumanlar ro‘yxatini yuklab bo‘lmadi. {districtsError}</span><button type="button" onClick={() => setDistrictsReload((value) => value + 1)}>Qayta urinish</button></div>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </div><aside className="order-summary"><h2>Sizning buyurtmangiz</h2>{selectedItems.map((item) => <div className="checkout-line" key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<p><span>Mahsulotlar</span><Price value={selectedSubtotal}/></p><p><span>Yetkazish</span>{preview ? <Price value={preview.deliveryFee}/> : <b>{previewPending ? "Hisoblanmoqda…" : "Manzil bo‘yicha"}</b>}</p>{preview && <p><span>Posilkalar</span><b>{preview.packages.length || 1} ta</b></p>}<hr/><p className="order-total"><span>Jami</span><Price value={selectedSubtotal + (preview?.deliveryFee ?? 0)}/></p><Button disabled={pending || previewPending || cart.loading || !canPreview(form)} type="submit" loading={pending}><Truck/> {paymentMethod === "cod" ? "Buyurtma berish" : "Buyurtma yaratish va to‘lash"}</Button><small>Faqat savatchada belgilangan mahsulotlar buyurtma qilinadi. Yetkazish narxi manzil asosida hisoblanadi.</small></aside></form></section>;
}
