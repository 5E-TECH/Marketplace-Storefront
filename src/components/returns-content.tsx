"use client";

import { Check, PackageOpen, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { hasAuthSession } from "@/lib/access-token";
import { errorMessage } from "@/lib/errors";
import { formatDateTime, formatPrice } from "@/lib/format";
import { RETURN_STATUS_LABELS, returnReasonLabel, returnService, returnSteps, type ReturnRequest, type ReturnRequestDetails } from "@/services/return.service";
import { ReturnStatusBadge } from "./order-returns";
import { Button, LoadingGrid, Price, StatePanel } from "./ui";

const PAGE_SIZE = 10;

function LoginRequired({ next }: { next: string }) {
  return <StatePanel headingLevel={1} icon={<PackageOpen/>} title="Akkauntingizga kiring" description="Qaytarish so‘rovlari akkauntingizga bog‘langan. Ularni ko‘rish uchun tizimga kiring." action={<Link className="button button--primary" href={`/login?next=${encodeURIComponent(next)}`}>Kirish</Link>}/>;
}

/** Xaridorning barcha qaytarish so'rovlari: holati, tovarlari, summasi. */
export function ReturnsContent() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: ReturnRequest[]; total: number; totalPages: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (target: number) => {
    setLoading(true); setError("");
    try { setResult(await returnService.list({ page: target, limit: PAGE_SIZE })); }
    catch (caught) { setError(errorMessage(caught, "Qaytarish so‘rovlarini yuklab bo‘lmadi")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const session = hasAuthSession(); setSignedIn(session); if (session) void load(page); }, [load, page]);

  if (signedIn === false) return <LoginRequired next="/profile/returns"/>;
  if (!result && !error) return <LoadingGrid count={3} label="Qaytarish so‘rovlari yuklanmoqda"/>;
  if (!result) return <StatePanel headingLevel={1} kind="error" title="Qaytarish so‘rovlarini yuklab bo‘lmadi" description={error} action={<Button loading={loading} onClick={() => void load(page)}><RefreshCw/> Qayta urinish</Button>}/>;
  if (!result.items.length) return <StatePanel headingLevel={1} icon={<PackageOpen/>} title="Qaytarish so‘rovlari yo‘q" description="Yetkazilgan tovarni qaytarmoqchi bo‘lsangiz, buyurtma sahifasida “Qaytarish so‘rovi” tugmasini bosing." action={<Link className="button button--primary" href="/profile/orders">Buyurtmalarim</Link>}/>;
  return <section className="returns-page">
    <div className="page-heading"><div><h1>Qaytarishlarim</h1></div><button type="button" onClick={() => void load(page)} disabled={loading}><RefreshCw/> {loading ? "Yangilanmoqda…" : "Yangilash"}</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <ul className="returns-list">{result.items.map((request) => <li key={request.id}>
      <Link href={`/profile/returns/${encodeURIComponent(request.id)}`}>
        <span className="returns-list__main"><b>So‘rov #{request.id}</b><small>Buyurtma #{request.orderId}{request.shopName ? ` · ${request.shopName}` : ""} · {formatDateTime(request.createdAt)}</small><small>{request.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</small></span>
        <ReturnStatusBadge status={request.status}/>
        <Price value={request.refundedAmount ?? request.requestedAmount}/>
      </Link>
    </li>)}</ul>
    {result.totalPages > 1 && <nav className="returns-pagination" aria-label="Sahifalar">
      <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Oldingi</Button>
      <span>{page} / {result.totalPages}</span>
      <Button variant="secondary" disabled={page >= result.totalPages || loading} onClick={() => setPage(page + 1)}>Keyingi</Button>
    </nav>}
  </section>;
}

const actorLabel = (role: string) => role === "BUYER" ? "Siz" : role === "SELLER" || role === "OPERATOR" ? "Sotuvchi" : role === "ADMIN" || role === "SUPERADMIN" ? "Elchi Market" : "Tizim";

function statusMessage(value: ReturnRequestDetails): string {
  const refunded = value.refundedAmount ?? value.requestedAmount;
  switch (value.status) {
    case "SUBMITTED": return "So‘rovingiz sotuvchiga yuborildi. Sotuvchi ko‘rib chiqadi.";
    case "IN_REVIEW": return "Sotuvchi tovarni qabul qilib, tekshirmoqda.";
    case "APPROVED": return value.paymentMethod === "cod" ? "Qaytarish tasdiqlandi. Naqd to‘langan buyurtmada pul siz bilan bog‘lanib qaytariladi." : "Qaytarish tasdiqlandi. Pul tez orada kartangizga qaytariladi.";
    case "REJECTED": return "Qaytarish rad etildi.";
    case "REFUNDED": return `Pul qaytarildi: ${formatPrice(refunded)} so‘m.`;
  }
}

/** Bitta so'rov: joriy bosqich, rad etish sababi, tovarlar va to'liq tarix. */
export function ReturnDetailContent({ returnId }: { returnId: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [value, setValue] = useState<ReturnRequestDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setValue(await returnService.get(returnId)); }
    catch (caught) { setError(errorMessage(caught, "So‘rovni yuklab bo‘lmadi")); }
    finally { setLoading(false); }
  }, [returnId]);
  useEffect(() => { const session = hasAuthSession(); setSignedIn(session); if (session) void load(); }, [load]);

  if (signedIn === false) return <LoginRequired next={`/profile/returns/${returnId}`}/>;
  if (!value && !error) return <LoadingGrid count={2} label="Qaytarish so‘rovi yuklanmoqda"/>;
  if (!value) return <StatePanel headingLevel={1} kind="error" title="So‘rovni yuklab bo‘lmadi" description={`#${returnId} — ${error}`} action={<><Button loading={loading} onClick={() => void load()}>Qayta urinish</Button><Link className="button button--secondary" href="/profile/returns">Qaytarishlarim</Link></>}/>;
  const { steps, current } = returnSteps(value);
  return <section className="return-detail">
    <div className="page-heading"><div><Link href="/profile/returns">← Qaytarishlarim</Link><h1>Qaytarish #{value.id}</h1></div><button type="button" onClick={() => void load()} disabled={loading}><RefreshCw/> {loading ? "Yangilanmoqda…" : "Yangilash"}</button></div>
    <div className="tracking-card">
      <div className="return-detail__status"><div><small>Hozirgi holat</small><h2><ReturnStatusBadge status={value.status}/></h2><p>{statusMessage(value)}</p></div></div>
      {value.status === "REJECTED"
        ? <div className="return-detail__rejected" role="note"><b>Rad etish sababi</b><p>{value.decisionComment ?? "Sabab ko‘rsatilmagan"}</p></div>
        : <ol className={`tracking-steps${steps.length === 3 ? " tracking-steps--3" : ""}`} aria-label="Qaytarish bosqichlari">{steps.map((step, index) => <li className={index <= current ? "active" : ""} key={step}><i>{index < current ? <Check/> : index + 1}</i><span>{RETURN_STATUS_LABELS[step]}</span></li>)}</ol>}
    </div>
    <div className="tracking-details">
      <h2>So‘rov tafsilotlari</h2>
      <div><span className="return-detail__label">Buyurtma</span><Link href={`/orders/${encodeURIComponent(value.orderId)}`}>#{value.orderId}</Link></div>
      {value.shopName && <div><span className="return-detail__label">Do‘kon</span><b>{value.shopName}</b></div>}
      <div><span className="return-detail__label">Sabab</span><b>{returnReasonLabel(value.reason)}</b></div>
      {value.comment && <div><span className="return-detail__label">Izohingiz</span><b className="return-detail__text">{value.comment}</b></div>}
      {value.status !== "REJECTED" && value.decisionComment && <div><span className="return-detail__label">Qaror izohi</span><b className="return-detail__text">{value.decisionComment}</b></div>}
      <div><span className="return-detail__label">So‘ralgan summa</span><Price value={value.requestedAmount}/></div>
      {value.refundedAmount !== null && <div><span className="return-detail__label">Qaytarilgan summa</span><Price value={value.refundedAmount}/></div>}
      <div><span className="return-detail__label">Yuborilgan</span><b>{formatDateTime(value.createdAt)}</b></div>
      <hr/>
      {value.items.map((item) => <div key={item.id}><span>{item.productName} × {item.quantity}</span><Price value={item.lineTotal}/></div>)}
    </div>
    <div className="tracking-details">
      <h2>Holat tarixi</h2>
      <ol className="return-history">{value.history.map((entry, index) => <li key={`${entry.toStatus}-${index}`}>
        <b>{RETURN_STATUS_LABELS[entry.toStatus]}</b>
        <small>{actorLabel(entry.actorRole)} · {formatDateTime(entry.createdAt)}</small>
        {entry.comment && <p>{entry.comment}</p>}
      </li>)}</ol>
    </div>
  </section>;
}
