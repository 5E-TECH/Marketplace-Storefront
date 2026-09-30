"use client";

import { Check, CircleX, CreditCard, ExternalLink, Package, RefreshCw, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { formatDate, formatPrice } from "@/lib/format";
import { canCancelOrder, isClosedOrder, MAX_CANCEL_REASON_LENGTH, orderService, paymentStartMessage } from "@/services/order.service";
import type { Order, OrderStatus, OrderTracking } from "@/types/commerce";
import { OrderReturns } from "./order-returns";
import { Button, LoadingGrid, Modal, Price, StatePanel } from "./ui";

const steps: OrderStatus[] = ["Qabul qilindi", "Yig‘ilmoqda", "Yo‘lda", "Yetkazildi"];
const terminal = new Set<OrderStatus>(["Bekor qilindi", "Qaytarildi", "Yetkazildi"]);

export function OrderTrackingContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [notice, setNotice] = useState("");
  // Faqat eng so'nggi so'rov natijasi qo'llanadi: bekor qilishdan oldin boshlangan fon yangilanishi yangi holatni bosib ketmasin.
  const loadSeq = useRef(0);
  const load = useCallback(async (quiet = false) => {
    const seq = ++loadSeq.current;
    if (!quiet) setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const next = await orderService.track(orderId);
      if (seq === loadSeq.current) setTracking(next);
    } catch (caught) {
      if (seq !== loadSeq.current) return;
      const missing = caught instanceof ApiError && caught.status === 404;
      setNotFound(missing);
      if (missing || (caught instanceof ApiError && [401, 403].includes(caught.status))) { setTracking(null); setOrder(null); }
      setError(missing ? "Bu raqam bilan buyurtma topilmadi. Raqamni tekshirib qayta urinib ko‘ring." : caught instanceof ApiError && [401, 403].includes(caught.status) ? "Buyurtmani uni yaratgan brauzerda oching yoki o‘z hisobingizga kiring." : "Buyurtma holatini hozir yuklab bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.");
    } finally { if (seq === loadSeq.current) setLoading(false); }
  }, [orderId]);
  // Buyurtma nusxasi o'zgarmaydi — bir marta olinadi; 30 soniyalik yangilanish faqat tracking'ni so'raydi.
  useEffect(() => {
    let active = true;
    void orderService.find(orderId).then((found) => { if (active) setOrder(found); }).catch(() => { /* Tracking holati baribir ko'rsatiladi. */ });
    return () => { active = false; };
  }, [orderId]);
  useEffect(() => {
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(true); };
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [load]);
  if (loading) return <section className="tracking-page"><LoadingGrid count={3} label="Buyurtma holati yuklanmoqda"/></section>;
  if (!tracking) return <StatePanel kind="error" icon={<Package/>} title={notFound ? "Buyurtma topilmadi" : "Buyurtma holatini yuklab bo‘lmadi"} description={`#${orderId} — ${error || "Buyurtma ma’lumoti mavjud emas."}`} action={<><Button onClick={() => void load()}>Qayta urinish</Button><Link className="button button--secondary" href="/profile/orders">Buyurtmalarim</Link></>}/>;
  const current = steps.indexOf(tracking.status);
  // Backend holati brauzer nusxasidan ustun: refunddan keyin yoki boshqa qurilmada ham to'g'ri ko'rinadi.
  const paymentStatus = tracking.payment?.status ?? order?.paymentStatus;
  const paymentProvider = tracking.payment?.provider ?? order?.paymentProvider;
  const isCard = Boolean(tracking.payment) || order?.payment === "card";
  const paymentLabel = !isCard ? "Qabul qilganda to‘lash" : paymentStatus === "PAID" ? "To‘langan" : paymentStatus === "CANCELLED" ? "Bekor qilingan" : paymentStatus === "FAILED" ? "To‘lov amalga oshmagan" : paymentStatus === "REFUNDED" ? "Qaytarilgan" : "To‘lov kutilmoqda";
  const retryPayment = async () => {
    setPaymentPending(true); setError("");
    // Brauzer nusxasi bo'lmasa buyurtma backend ro'yxatidan topiladi; provider tracking'dan olinadi.
    const found = order ?? await orderService.find(tracking.orderId);
    if (!found) { setError("Buyurtma ma’lumotini yuklab bo‘lmadi. Sahifani yangilab, qayta urinib ko‘ring."); setPaymentPending(false); return; }
    const target = found.paymentProvider ? found : { ...found, paymentProvider };
    try { window.location.assign(await orderService.startPayment(target)); }
    catch (caught) { setError(paymentStartMessage(caught)); setPaymentPending(false); }
  };
  const paid = paymentStatus === "PAID";
  const paidAmount = tracking.payment?.amount ?? order?.total;
  const cancelOrder = async () => {
    setCancelling(true); setCancelError("");
    try {
      const result = await orderService.cancel(tracking.orderId, cancelReason);
      setCancelOpen(false); setCancelReason("");
      setNotice(result.idempotent ? "Buyurtma allaqachon bekor qilingan." : result.status === "REFUNDED" ? "Buyurtma bekor qilindi. To‘langan summa kartangizga to‘liq qaytariladi." : "Buyurtma bekor qilindi.");
    } catch (caught) {
      setCancelError(caught instanceof ApiError && [401, 403].includes(caught.status) ? "Buyurtmani uni yaratgan brauzerda oching yoki o‘z hisobingizga kiring." : errorMessage(caught, "Buyurtmani hozir bekor qilib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring."));
    } finally { setCancelling(false); }
    // Natija qanday bo'lmasin, holat backenddan qayta olinadi (masalan, posilka shu orada yo'lga chiqqan bo'lsa tugma yo'qoladi).
    void load(true);
  };
  return <section className="tracking-page"><div className="page-heading"><div><h1>#{tracking.orderId}</h1></div><button onClick={() => void load()}><RefreshCw/> Yangilash</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {notice && <p className="form-success" role="status">{notice}</p>}
    <div className="tracking-card"><div className="tracking-status"><Truck/><div><small>Hozirgi holat</small><h2>{tracking.status}</h2>{tracking.estimatedDeliveryAt && <p>Taxminiy yetkazish: {formatDate(tracking.estimatedDeliveryAt)}</p>}</div></div>
      {!terminal.has(tracking.status) && <ol className="tracking-steps">{steps.map((step, index) => <li className={index <= current ? "active" : ""} key={step}><i>{index < current ? <Check/> : index + 1}</i><span>{step}</span></li>)}</ol>}
      {(order || tracking.payment) && <div className="tracking-payment"><CreditCard/><div><small>To‘lov holati</small><b>{paymentLabel}</b>{paymentProvider && <span>{paymentProvider === "PAYME" ? "Payme" : "Click"}</span>}</div>{isCard && paymentStatus !== "PAID" && paymentStatus !== "REFUNDED" && !isClosedOrder(tracking.status) && <button className="button button--primary" disabled={paymentPending} onClick={() => void retryPayment()}><ExternalLink/>{paymentPending ? "Ochilmoqda…" : "To‘lash"}</button>}</div>}
      {canCancelOrder(tracking) && <div className="tracking-cancel"><CircleX/><div><b>Buyurtmani bekor qilish</b><span>{paid ? "Posilka yo‘lga chiqmaguncha bekor qilsangiz, to‘langan summa to‘liq qaytariladi." : "Posilka yo‘lga chiqmaguncha buyurtmani bekor qilishingiz mumkin."}</span></div><Button variant="secondary" onClick={() => { setCancelError(""); setCancelOpen(true); }}>Bekor qilish</Button></div>}
      {tracking.packages.length > 0 && <div className="tracking-packages"><h2>Posilkalar</h2>{tracking.packages.map((item) => <article key={item.id}><div><b>{item.shopName || `Posilka #${item.id}`}</b><small>{item.status}</small></div>{item.trackingUrl && <a href={item.trackingUrl} target="_blank" rel="noopener noreferrer">Elchi orqali kuzatish</a>}</article>)}</div>}
    </div>
    <Modal open={cancelOpen} title="Buyurtma bekor qilinsinmi?" onClose={() => setCancelOpen(false)} dismissible={!cancelling} className="modal--confirm"
      description={`${paid ? paidAmount === undefined ? "To‘langan summa kartangizga to‘liq qaytariladi." : `To‘langan ${formatPrice(paidAmount)} so‘m kartangizga to‘liq qaytariladi.` : "Buyurtma bekor qilinadi, mahsulotlar sotuvga qaytadi."} Bu amalni ortga qaytarib bo‘lmaydi.`}
      footer={<><Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={cancelling}>Yo‘q, qolsin</Button><Button variant="danger" loading={cancelling} onClick={() => void cancelOrder()}>Ha, bekor qilinsin</Button></>}>
      <label className="cancel-reason"><span>Sabab (ixtiyoriy)</span><textarea value={cancelReason} maxLength={MAX_CANCEL_REASON_LENGTH} rows={3} placeholder="Masalan: fikrimdan qaytdim" disabled={cancelling} onChange={(event) => setCancelReason(event.target.value)} data-autofocus/></label>
      {cancelError && <p className="form-error" role="alert">{cancelError}</p>}
    </Modal>
    <OrderReturns orderId={tracking.orderId} delivered={tracking.status === "Yetkazildi" || tracking.packages.some((item) => item.status === "Yetkazildi")}/>
    {order && <div className="tracking-details"><h2>Buyurtma tafsilotlari</h2>{order.items.map((item) => <div key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<hr/><div><b>Jami</b><Price value={order.total}/></div><p>{order.customer.name} · {order.customer.phone}<br/>{order.customer.address}</p></div>}
  </section>;
}
