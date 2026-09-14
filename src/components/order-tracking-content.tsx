"use client";

import { Check, Package, RefreshCw, Truck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { orderService } from "@/services/order.service";
import type { Order, OrderStatus, OrderTracking } from "@/types/commerce";
import { Price } from "./ui";

const steps: OrderStatus[] = ["Qabul qilindi", "Yig‘ilmoqda", "Yo‘lda", "Yetkazildi"];
const terminal = new Set<OrderStatus>(["Bekor qilindi", "Qaytarildi", "Yetkazildi"]);

export function OrderTrackingContent({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    setNotFound(false);
    try {
      const [snapshot, current] = await Promise.all([orderService.getLocal(orderId), orderService.track(orderId)]);
      setOrder(snapshot); setTracking(current);
    } catch (caught) {
      setOrder(await orderService.getLocal(orderId));
      const missing = caught instanceof ApiError && caught.status === 404;
      setNotFound(missing);
      if (missing || (caught instanceof ApiError && [401, 403].includes(caught.status))) { setTracking(null); setOrder(null); }
      setError(missing ? "Bu raqam bilan buyurtma topilmadi. Raqamni tekshirib qayta urinib ko‘ring." : caught instanceof ApiError && [401, 403].includes(caught.status) ? "Buyurtmani uni yaratgan brauzerda oching yoki o‘z hisobingizga kiring." : "Buyurtma holatini hozir yuklab bo‘lmadi. Birozdan keyin qayta urinib ko‘ring.");
    } finally { setLoading(false); }
  }, [orderId]);
  useEffect(() => {
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(true); };
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [load]);
  if (loading) return <section className="tracking-page" role="status"><div className="orders-loading">Buyurtma holati yuklanmoqda...</div></section>;
  if (!tracking) return <section className="page-empty"><span><Package/></span><h1>{notFound ? "Buyurtma topilmadi" : "Buyurtma holatini yuklab bo‘lmadi"}</h1><p>Buyurtma raqami: {orderId}</p><p role="alert">{error || "Buyurtma ma’lumoti mavjud emas."}</p><button className="button button--primary" onClick={() => void load()}>Qayta urinish</button><Link className="button button--secondary" href="/profile/orders">Buyurtmalarim</Link></section>;
  const current = steps.indexOf(tracking.status);
  return <section className="tracking-page"><div className="page-heading"><div><span>BUYURTMA HOLATI</span><h1>#{tracking.orderId}</h1></div><button onClick={() => void load()}><RefreshCw/> Yangilash</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="tracking-card"><div className="tracking-status"><Truck/><div><small>Hozirgi holat</small><h2>{tracking.status}</h2>{tracking.estimatedDeliveryAt && <p>Taxminiy yetkazish: {formatDate(tracking.estimatedDeliveryAt)}</p>}</div></div>
      {!terminal.has(tracking.status) && <ol className="tracking-steps">{steps.map((step, index) => <li className={index <= current ? "active" : ""} key={step}><i>{index < current ? <Check/> : index + 1}</i><span>{step}</span></li>)}</ol>}
      {tracking.packages.length > 0 && <div className="tracking-packages"><h2>Posilkalar</h2>{tracking.packages.map((item) => <article key={item.id}><div><b>{item.shopName || `Posilka #${item.id}`}</b><small>{item.status}</small></div>{item.trackingUrl && <a href={item.trackingUrl} target="_blank" rel="noopener noreferrer">Elchi orqali kuzatish</a>}</article>)}</div>}
    </div>
    {order && <div className="tracking-details"><h2>Buyurtma tafsilotlari</h2>{order.items.map((item) => <div key={item.id}><span>{item.product.name} × {item.quantity}</span><Price value={item.product.price * item.quantity}/></div>)}<hr/><div><b>Jami</b><Price value={order.total}/></div><p>{order.customer.name} · {order.customer.phone}<br/>{order.customer.address}</p></div>}
  </section>;
}
