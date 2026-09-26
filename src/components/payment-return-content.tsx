"use client";

import { CheckCircle2, CircleX, Clock3, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { isClosedOrder, orderService, paymentStartMessage } from "@/services/order.service";
import type { Order, PaymentProvider, PaymentStatus } from "@/types/commerce";

/** `next` — xaridor shu sahifadan keyin nima qilishini aytadi; qo'ng'iroq qilmasligi uchun har holatda to'ldiriladi. */
const copy: Record<PaymentStatus, { title: string; text: string; next: string }> = {
  PAID: { title: "To‘lov muvaffaqiyatli", text: "Buyurtmangiz to‘landi va qayta ishlashga yuborildi.", next: "Keyingi qadam: sotuvchi buyurtmani yig‘a boshlaydi. Yetkazish holatini buyurtma sahifasida kuzatib borasiz." },
  PENDING: { title: "To‘lov tekshirilmoqda", text: "Bank javobi hali kelmagan. Kartadan pul yechilgan bo‘lsa ham, tasdiq kelishi bir necha daqiqa olishi mumkin.", next: "Keyingi qadam: bu sahifani ochiq qoldiring yoki keyinroq buyurtma sahifasidan holatni tekshiring — buyurtma yo‘qolmaydi." },
  CANCELLED: { title: "To‘lov bekor qilindi", text: "Kartadan pul yechilmadi.", next: "Keyingi qadam: qayta to‘lashingiz yoki buyurtmani qoldirib, keyinroq buyurtma sahifasidan to‘lashingiz mumkin." },
  FAILED: { title: "To‘lov amalga oshmadi", text: "To‘lov tizimi operatsiyani yakunlamadi. Kartadan pul yechilmagan.", next: "Keyingi qadam: qayta urinib ko‘ring yoki boshqa to‘lov usulini tanlang." },
  REFUNDED: { title: "To‘lov qaytarildi", text: "To‘langan summa kartangizga qaytarilgan.", next: "Keyingi qadam: mablag‘ bankda ko‘rinishi uchun vaqt kerak bo‘lishi mumkin. Savolingiz bo‘lsa buyurtma raqamini ayting." },
};

/**
 * Xaridor provayder sahifasida to'lamay chiqib ketsa, provayder backendga hech narsa yubormaydi va to'lov
 * PENDING'da qoladi. Shu vaqtdan keyin sahifa "tekshirilmoqda" deb osilib turmaydi — qayta to'lash taklif qilinadi.
 */
export const PENDING_STALE_MS = 2 * 60_000;
const POLL_MS = 5_000;
const STALE_POLL_MS = 15_000;
const staleCopy = { title: "To‘lov hali tasdiqlanmadi", text: "Payme yoki Click sahifasida to‘lovni yakunlamagan bo‘lsangiz, qayta to‘lashingiz mumkin. Kartadan pul yechilgan bo‘lsa, holat o‘zi yangilanadi.", next: "Keyingi qadam: “Qayta to‘lash” tugmasini bosing yoki keyinroq buyurtma sahifasidan to‘lang — buyurtma saqlangan." };

/** Buyurtmaning o'zi bekor qilingan (masalan, admin tomonidan) — qayta to'lash taklif qilinmaydi. */
const closedNext = "Keyingi qadam: buyurtma bekor qilingan, uni qayta to‘lab bo‘lmaydi. Mahsulot kerak bo‘lsa, yangi buyurtma bering.";

type PaymentResultViewProps = { orderId: string; status: PaymentStatus; order: Order | null; reason?: string; orderClosed?: boolean; stale?: boolean; loading?: boolean; redirecting?: boolean; error?: string; onCheck: () => void; onRetry: () => void };

export function PaymentResultView({ orderId, status, order, reason = "", orderClosed = false, stale = false, loading = false, redirecting = false, error = "", onCheck, onRetry }: PaymentResultViewProps) {
  const stalePending = status === "PENDING" && stale && !orderClosed;
  const details = stalePending ? staleCopy : copy[status];
  const Icon = status === "PAID" ? CheckCircle2 : status === "PENDING" ? Clock3 : CircleX;
  const canRetryPayment = (["CANCELLED", "FAILED"].includes(status) || stalePending) && !orderClosed;
  return <section className={`payment-result payment-result--${status.toLowerCase()}`}><span><Icon/></span><small>BUYURTMA #{orderId}{status === "PAID" && order ? ` · ${formatPrice(order.total)} so‘m` : ""}</small><h1>{details.title}</h1><p>{reason && ["CANCELLED", "FAILED"].includes(status) ? reason : details.text}</p><p className="payment-result__next">{orderClosed && status !== "REFUNDED" ? closedNext : details.next}</p>{status === "PENDING" && <p className="payment-auto-refresh" role="status"><RefreshCw className={loading ? "payment-result-spinner" : ""}/> Holat har {stalePending ? STALE_POLL_MS / 1000 : POLL_MS / 1000} soniyada avtomatik tekshiriladi</p>}{error && <p className="form-error" role="alert">{error}</p>}<div>{status === "PENDING" && <button className="button button--primary" disabled={loading} onClick={onCheck}><RefreshCw/> {loading ? "Tekshirilmoqda…" : "Hozir tekshirish"}</button>}{canRetryPayment && <button className="button button--primary" disabled={redirecting} onClick={onRetry}>{redirecting ? "To‘lov sahifasi ochilmoqda…" : "Qayta to‘lash"}</button>}<Link className="button button--secondary" href={`/orders/${encodeURIComponent(orderId)}`}>Buyurtmaga qaytish</Link><Link className="button button--secondary" href="/">Bosh sahifa</Link></div></section>;
}

export function PaymentReturnContent({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [reason, setReason] = useState("");
  const [provider, setProvider] = useState<PaymentProvider>();
  const [orderClosed, setOrderClosed] = useState(false);
  const [stale, setStale] = useState(false);
  const pendingSince = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const check = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await orderService.paymentStatus(orderId);
      if (mounted.current) {
        setStatus(result.status); setReason(result.reason ?? ""); setProvider(result.provider); setOrderClosed(isClosedOrder(result.orderStatus));
        if (result.status !== "PENDING") { pendingSince.current = null; setStale(false); }
        else { pendingSince.current ??= Date.now(); setStale(Date.now() - pendingSince.current >= PENDING_STALE_MS); }
      }
    }
    catch { if (mounted.current) setError("To‘lov holatini hozir tasdiqlab bo‘lmadi. Bu buyurtma bekor qilindi degani emas — qayta tekshiring yoki buyurtma sahifasini oching."); }
    finally { if (mounted.current) setLoading(false); }
  }, [orderId]);
  useEffect(() => {
    mounted.current = true;
    void orderService.find(orderId).then((saved) => { if (mounted.current) setOrder(saved); }).catch(() => { /* Buyurtma topilmasa ham holat ko'rsatiladi. */ });
    void check();
    return () => { mounted.current = false; };
  }, [check, orderId]);
  useEffect(() => {
    if (status !== "PENDING" || loading) return;
    const timer = window.setTimeout(() => void check(), stale ? STALE_POLL_MS : POLL_MS);
    return () => window.clearTimeout(timer);
  }, [check, loading, stale, status]);

  const retryPayment = async () => {
    if (!order) { setError("Bu qurilmada buyurtma ma’lumoti yo‘q. “Buyurtmaga qaytish” tugmasi orqali o‘ting va o‘sha sahifadan to‘lang."); return; }
    setRedirecting(true); setError("");
    // Backend tracking'da provider qaytarsa, brauzer nusxasida u bo'lmasa ham qayta to'lash ishlaydi.
    const target = order.paymentProvider ? order : { ...order, paymentProvider: provider };
    try { window.location.assign(await orderService.startPayment(target)); }
    catch (caught) { setError(paymentStartMessage(caught)); setRedirecting(false); }
  };

  if (!orderId) return <section className="payment-result payment-result--error"><span><TriangleAlert/></span><h1>Buyurtma raqami topilmadi</h1><p>To‘lovdan qaytish havolasi to‘liq emas. Buyurtmalar ro‘yxatidan kerakli buyurtmani oching.</p><Link className="button button--primary" href="/profile/orders">Buyurtmalarim</Link></section>;
  if (loading && !status) return <section className="payment-result" role="status"><span><RefreshCw className="payment-result-spinner"/></span><h1>To‘lov tekshirilmoqda</h1><p>Sahifani yopmang. Bu odatda bir necha soniya oladi.</p></section>;
  if (error && !status) return <section className="payment-result payment-result--error"><span><TriangleAlert/></span><h1>Holatni tekshirib bo‘lmadi</h1><p role="alert">{error}</p><div><button className="button button--primary" onClick={() => void check()}>Qayta tekshirish</button><Link className="button button--secondary" href={`/orders/${encodeURIComponent(orderId)}`}>Buyurtmaga o‘tish</Link></div></section>;

  return <PaymentResultView orderId={orderId} status={status ?? "PENDING"} order={order} reason={reason} orderClosed={orderClosed} stale={stale} loading={loading} redirecting={redirecting} error={error} onCheck={() => void check()} onRetry={() => void retryPayment()}/>;
}
