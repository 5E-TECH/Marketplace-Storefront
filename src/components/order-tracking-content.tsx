"use client";

import { Check, CreditCard, ExternalLink, Package, RefreshCw, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { orderService } from "@/services/order.service";
import type { Order, OrderStatus, OrderTracking } from "@/types/commerce";
import { Button, LoadingGrid, Price, StatePanel } from "./ui";

const steps: OrderStatus[] = ["Qabul qilindi", "Yig‘ilmoqda", "Yo‘lda", "Yetkazildi"];
const terminal = new Set<OrderStatus>(["Bekor qilindi", "Qaytarildi", "Yetkazildi"]);

export function OrderTrackingContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    setNotFound(false);
    try {
      setTracking(await orderService.track(orderId));
    } catch (caught) {
      const missing = caught instanceof ApiError && caught.status === 404;
      setNotFound(missing);
      if (missing || (caught instanceof ApiError && [401, 403].includes(caught.status))) { setTracking(null); setOrder(null); }
      setError(missing ? "Bu raqam bilan buyurtma topilmadi. Raqamni tekshirib qayta urinib ko‘ring." : caught instanceof ApiError && [401, 403].includes(caught.status) ? "Buyurtmani uni yaratgan brauzerda oching yoki o‘z hisobingizga kiring." : "Buyurtma holatini hozir yuklab bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.");
    } finally { setLoading(false); }
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
    catch { setError("To‘lov sahifasini hozir ochib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring."); setPaymentPending(false); }
  };
  return <section className="tracking-page"><div className="page-heading"><div><h1>#{tracking.orderId}</h1></div><button onClick={() => void load()}><RefreshCw/> Yangilash</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="tracking-card"><div className="tracking-status"><Truck/><div><small>Hozirgi holat</small><h2>{tracking.status}</h2>{tracking.estimatedDeliveryAt && <p>Taxminiy yetkazish: {formatDate(tracking.estimatedDeliveryAt)}</p>}</div></div>
      {!terminal.has(tracking.status) && <ol className="tracking-steps">{steps.map((step, index) => <li className={index <= current ? "active" : ""} key={step}><i>{index < current ? <Check/> : index + 1}</i><span>{step}</span></li>)}</ol>}
      {(order || tracking.payment) && <div className="tracking-payment"><CreditCard/><div><small>To‘lov holati</small><b>{paymentLabel}</b>{paymentProvider && <span>{paymentProvider === "PAYME" ? "Payme" : "Click"}</span>}</div>{isCard && paymentStatus !== "PAID" && paymentStatus !== "REFUNDED" && <button className="button button--primary" disabled={paymentPending} onClick={() => void retryPayment()}><ExternalLink/>{paymentPending ? "Ochilmoqda…" : "To‘lash"}</button>}</div>}
      {tracking.packages.length > 0 && <div className="tracking-packages"><h2>Posilkalar</h2>{tracking.packages.map((item) => <article key={item.id}><div><b>{item.shopName || `Posilka #${item.id}`}</b><small>{item.status}</small></div>{item.trackingUrl && <a href={item.trackingUrl} target="_blank" rel="noopener noreferrer">Elchi orqali kuzatish</a>}</article>)}</div>}
    </div>
    {order && <div className="tracking-details"><h2>Buyurtma tafsilotlari</h2>{order.items.map((item) => <div key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<hr/><div><b>Jami</b><Price value={order.total}/></div><p>{order.customer.name} · {order.customer.phone}<br/>{order.customer.address}</p></div>}
  </section>;
}
