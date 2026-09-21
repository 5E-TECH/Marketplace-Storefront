"use client";

import { CheckCircle2, CircleX, Clock3, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { orderService } from "@/services/order.service";
import type { Order, PaymentStatus } from "@/types/commerce";

const copy: Record<PaymentStatus, { title: string; text: string }> = {
  PAID: { title: "To‘lov muvaffaqiyatli", text: "Buyurtmangiz to‘landi va qayta ishlashga yuborildi." },
  PENDING: { title: "To‘lov tekshirilmoqda", text: "Bank javobi hali kelmagan. Bir oz kuting yoki holatni qayta tekshiring." },
  CANCELLED: { title: "To‘lov bekor qilindi", text: "Kartadan pul yechilmadi. Buyurtma sahifasidan qayta to‘lashingiz mumkin." },
  FAILED: { title: "To‘lov amalga oshmadi", text: "To‘lov tizimi operatsiyani yakunlamadi. Qayta urinib ko‘ring yoki boshqa usulni tanlang." },
  REFUNDED: { title: "To‘lov qaytarildi", text: "To‘langan summa kartangizga qaytarilgan. Bankda ko‘rinishi uchun vaqt kerak bo‘lishi mumkin." },
};

type PaymentResultViewProps = { orderId: string; status: PaymentStatus; order: Order | null; reason?: string; loading?: boolean; redirecting?: boolean; error?: string; onCheck: () => void; onRetry: () => void };

export function PaymentResultView({ orderId, status, order, reason = "", loading = false, redirecting = false, error = "", onCheck, onRetry }: PaymentResultViewProps) {
  const details = copy[status];
  const Icon = status === "PAID" ? CheckCircle2 : status === "PENDING" ? Clock3 : CircleX;
  const canRetryPayment = order && ["CANCELLED", "FAILED"].includes(status);
  return <section className={`payment-result payment-result--${status.toLowerCase()}`}><span><Icon/></span><small>BUYURTMA #{orderId}</small><h1>{details.title}</h1><p>{reason && ["CANCELLED", "FAILED"].includes(status) ? reason : details.text}</p>{status === "PENDING" && <p className="payment-auto-refresh" role="status"><RefreshCw className={loading ? "payment-result-spinner" : ""}/> Holat har 5 soniyada avtomatik tekshiriladi</p>}{error && <p className="form-error" role="alert">{error}</p>}<div>{status === "PENDING" && <button className="button button--primary" disabled={loading} onClick={onCheck}><RefreshCw/> {loading ? "Tekshirilmoqda…" : "Hozir tekshirish"}</button>}{canRetryPayment && <button className="button button--primary" disabled={redirecting} onClick={onRetry}>{redirecting ? "To‘lov sahifasi ochilmoqda…" : "Qayta to‘lash"}</button>}<Link className="button button--secondary" href={`/orders/${encodeURIComponent(orderId)}`}>Buyurtmaga qaytish</Link><Link className="button button--secondary" href="/">Bosh sahifa</Link></div></section>;
}

export function PaymentReturnContent({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const check = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await orderService.paymentStatus(orderId);
      if (mounted.current) { setStatus(result.status); setReason(result.reason ?? ""); }
    }
    catch { if (mounted.current) setError("To‘lov holatini hozir tekshirib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring."); }
    finally { if (mounted.current) setLoading(false); }
  }, [orderId]);
  useEffect(() => {
    mounted.current = true;
    void orderService.getLocal(orderId).then((saved) => { if (mounted.current) setOrder(saved); });
    void check();
    return () => { mounted.current = false; };
  }, [check, orderId]);
  useEffect(() => {
    if (status !== "PENDING" || loading) return;
    const timer = window.setTimeout(() => void check(), 5_000);
    return () => window.clearTimeout(timer);
  }, [check, loading, status]);

  const retryPayment = async () => {
    if (!order) return;
    setRedirecting(true); setError("");
    try { window.location.assign(await orderService.startPayment(order)); }
    catch { setError("To‘lov sahifasini ochib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring."); setRedirecting(false); }
  };

  if (!orderId) return <section className="payment-result payment-result--error"><span><TriangleAlert/></span><h1>Buyurtma raqami topilmadi</h1><p>To‘lovdan qaytish havolasi to‘liq emas. Buyurtmalar ro‘yxatidan kerakli buyurtmani oching.</p><Link className="button button--primary" href="/profile/orders">Buyurtmalarim</Link></section>;
  if (loading && !status) return <section className="payment-result" role="status"><span><RefreshCw className="payment-result-spinner"/></span><h1>To‘lov tekshirilmoqda</h1><p>Sahifani yopmang. Bu odatda bir necha soniya oladi.</p></section>;
  if (error && !status) return <section className="payment-result payment-result--error"><span><TriangleAlert/></span><h1>Holatni tekshirib bo‘lmadi</h1><p role="alert">{error}</p><div><button className="button button--primary" onClick={() => void check()}>Qayta tekshirish</button><Link className="button button--secondary" href={`/orders/${encodeURIComponent(orderId)}`}>Buyurtmaga o‘tish</Link></div></section>;

  return <PaymentResultView orderId={orderId} status={status ?? "PENDING"} order={order} reason={reason} loading={loading} redirecting={redirecting} error={error} onCheck={() => void check()} onRetry={() => void retryPayment()}/>;
}
