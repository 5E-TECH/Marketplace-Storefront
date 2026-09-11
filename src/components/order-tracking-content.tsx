"use client";

import { CheckCircle2, Clock3, Package, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getGuestSessionId } from "@/lib/access-token";
import { clearCheckoutAttempt, readCheckoutAttempt } from "@/lib/checkout-attempt";
import { formatDate, formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { orderService } from "@/services/order.service";
import { mergeTrackedOrder, orderTrackingService, type TrackedOrder } from "@/services/order-tracking.service";
import type { Order } from "@/types/commerce";
import { Button } from "./ui";
import { OrderProgress } from "./order-progress";
import { OrderReceipt } from "./order-receipt";

export function OrderTrackingContent({ orderId, placed = false, storageWarning = false }: { orderId: string; placed?: boolean; storageWarning?: boolean }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const load = async () => {
      setLoading(true); setError(""); setNotFound(false);
      const scope = getGuestSessionId();
      const attempt = readCheckoutAttempt(scope);
      let saved = await orderService.find(orderId);
      let clearAttempt = Boolean(saved);
      if (!saved && attempt?.phase === "confirmed" && attempt.receipt.id === orderId) {
        saved = attempt.receipt;
        try { await orderService.record(saved); clearAttempt = true; } catch { /* Keep the session copy for reload recovery. */ }
      }
      if (active) setOrder(saved);
      try {
        const current = await orderTrackingService.get(orderId, controller.signal);
        if (!active) return;
        setTracking(current);
        if (saved) {
          const merged = mergeTrackedOrder(saved, current);
          setOrder(merged);
          try { await orderService.record(merged); } catch { /* Tracking must still render. */ }
        }
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        if (caught instanceof ApiError && caught.status === 404 && !saved) setNotFound(true);
        else if (!saved) setError(caught instanceof Error ? caught.message : "Buyurtma holatini olib bo‘lmadi.");
        else setError(caught instanceof ApiError && caught.status === 404 ? "Buyurtma saqlangan, ammo backendda hozircha topilmadi." : "Holatni yangilab bo‘lmadi. Saqlangan buyurtma ma’lumoti ko‘rsatilmoqda.");
      } finally {
        if (clearAttempt && attempt?.phase === "confirmed" && attempt.receipt.id === orderId) { try { clearCheckoutAttempt(scope); } catch { /* Harmless. */ } }
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; controller.abort(); };
  }, [orderId, retry]);

  if (loading && !order) return <section className="state-panel orders-page" role="status"><Clock3 className="state-panel__icon"/><h1>Buyurtma tekshirilmoqda...</h1></section>;
  if (notFound) return <section className="state-panel orders-page" data-testid="tracking-not-found"><Package className="state-panel__icon"/><h1>Buyurtma topilmadi</h1><p>Raqamni tekshiring yoki buyurtma berilgan brauzerdan qayta urinib ko‘ring.</p><Link className="button button--primary" href="/track-order">Boshqa raqamni tekshirish</Link></section>;
  if (!order && tracking) {
    const terminal = tracking.step === "cancelled" || tracking.step === "returned";
    return <section className="order-detail orders-page" data-testid="order-tracking"><header className="order-confirmation"><span>{terminal ? <XCircle/> : <Package/>}</span><p>BUYURTMA HOLATI</p><h1>{tracking.status}</h1><b>Buyurtma raqami: {tracking.id}</b>{tracking.estimatedDeliveryAt && <small>Kutilayotgan yetkazish vaqti: {formatDateTime(tracking.estimatedDeliveryAt)}</small>}</header><OrderProgress step={tracking.step} status={tracking.status}/><div className="order-detail-actions"><Button variant="secondary" loading={loading} onClick={() => setRetry((value) => value + 1)}><RefreshCw/> Holatni yangilash</Button><Link className="button button--primary" href="/track-order">Boshqa buyurtmani kuzatish</Link></div></section>;
  }
  if (!order) return <section className="state-panel orders-page" role="alert"><XCircle className="state-panel__icon"/><h1>Holatni olib bo‘lmadi</h1><p>{error}</p><Button onClick={() => setRetry((value) => value + 1)}><RefreshCw/> Qayta urinish</Button></section>;

  const step = tracking?.step ?? (order.status === "Yetkazildi" ? "delivered" : order.status === "Yo‘lda" ? "on_the_way" : order.status === "Tayyorlanmoqda" ? "preparing" : "received");
  const terminal = step === "cancelled" || step === "returned";
  return <section className="order-detail orders-page" data-testid="order-tracking">
    <header className="order-confirmation">
      <span>{terminal ? <XCircle/> : <CheckCircle2/>}</span>
      <p>{placed ? "BUYURTMANGIZ QABUL QILINDI" : "BUYURTMA HOLATI"}</p>
      <h1>{placed ? "Rahmat!" : order.status}</h1>
      <b>Buyurtma raqami: {order.id}</b>
      <small>{placed ? "Buyurtma raqamini saqlab qo‘ying. Shu sahifada yetkazib berish holatini kuzatishingiz mumkin." : `Buyurtma ${formatDate(order.createdAt)} kuni berilgan.`}</small>
    </header>
    {(storageWarning || error) && <p className="form-error" role="status">{storageWarning ? "Buyurtma tasdiqlandi, lekin brauzer tarixiga saqlanmadi. Buyurtma raqamini yozib oling." : error}</p>}
    <OrderProgress step={step} status={order.status}/>
    <OrderReceipt order={order} refreshing={loading} onRefresh={() => setRetry((value) => value + 1)}/>
    <div className="order-detail-actions"><Link className="button button--primary" href="/track-order">Boshqa buyurtmani kuzatish</Link><Link className="button button--secondary" href="/">Xaridni davom ettirish</Link></div>
  </section>;
}
