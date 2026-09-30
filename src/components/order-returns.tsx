"use client";

import { Undo2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { hasAuthSession } from "@/lib/access-token";
import { errorMessage } from "@/lib/errors";
import { formatPrice } from "@/lib/format";
import { MAX_RETURN_COMMENT, RETURN_REASONS, RETURN_STATUS_LABELS, returnService, type ReturnableItem, type ReturnReason, type ReturnRequest } from "@/services/return.service";
import { Button, Modal, Price, QuantityStepper } from "./ui";

/** Qaytarish so'rovi holati — ro'yxat va sahifada bir xil ko'rinishda. */
export function ReturnStatusBadge({ status }: { status: ReturnRequest["status"] }) {
  return <span className={`return-status return-status--${status.toLowerCase()}`}>{RETURN_STATUS_LABELS[status]}</span>;
}

function ReturnRequestModal({ open, orderId, items, onClose, onCreated }: { open: boolean; orderId: string; items: ReturnableItem[]; onClose: () => void; onCreated: (created: ReturnRequest[]) => void }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason | "">("");
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    // Bitta tovar bo'lsa u oldindan tanlanadi.
    setQuantities(items.length === 1 ? { [items[0].orderItemId]: 1 } : {});
    setReason(""); setComment(""); setError("");
  }, [open, items]);
  const quantity = (item: ReturnableItem) => quantities[item.orderItemId] ?? 0;
  const setQuantity = (item: ReturnableItem, value: number) => { setError(""); setQuantities((current) => ({ ...current, [item.orderItemId]: Math.max(0, Math.min(item.available, value)) })); };
  const chosen = items.filter((item) => quantity(item) > 0);
  const total = chosen.reduce((sum, item) => sum + item.unitPrice * quantity(item), 0);
  const submit = async () => {
    setError("");
    if (!chosen.length) { setError("Qaytariladigan tovarni tanlang"); return; }
    if (!reason) { setError("Qaytarish sababini tanlang"); return; }
    if (reason === "OTHER" && !comment.trim()) { setError("“Boshqa” sababida izoh yozing"); return; }
    setPending(true);
    try {
      onCreated(await returnService.create(orderId, { items: chosen.map((item) => ({ orderItemId: item.orderItemId, quantity: quantity(item) })), reason, comment }));
    } catch (caught) {
      // Muddat o'tgan, miqdor ortiq va h.k. — backend tayyor matn qaytaradi.
      setError(errorMessage(caught, "So‘rovni yuborib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring."));
    } finally { setPending(false); }
  };
  return <Modal open={open} title="Qaytarish so‘rovi" onClose={onClose} dismissible={!pending} className="modal--return"
    description="Qaytariladigan tovar va sababni tanlang. Sotuvchi ko‘rib chiqadi, tasdiqlansa pul qaytariladi."
    footer={<><Button variant="secondary" onClick={onClose} disabled={pending}>Yopish</Button><Button loading={pending} onClick={() => void submit()}>So‘rovni yuborish</Button></>}>
    <fieldset className="return-items" disabled={pending}>
      <legend>Tovarlar</legend>
      {items.map((item) => <div className="return-item" key={item.orderItemId}>
        <label><input type="checkbox" checked={quantity(item) > 0} onChange={(event) => setQuantity(item, event.target.checked ? 1 : 0)}/><span><b>{item.name}</b><small>{formatPrice(item.unitPrice)} so‘m · qaytarish mumkin: {item.available} ta</small></span></label>
        {quantity(item) > 0 && item.available > 1 && <QuantityStepper value={quantity(item)} max={item.available} disabled={pending} onDecrease={() => setQuantity(item, Math.max(1, quantity(item) - 1))} onIncrease={() => setQuantity(item, quantity(item) + 1)}/>}
      </div>)}
    </fieldset>
    <label className="return-field"><span>Sabab</span>
      <select value={reason} disabled={pending} onChange={(event) => { setError(""); setReason(event.target.value as ReturnReason); }}>
        <option value="" disabled>Sababni tanlang</option>
        {RETURN_REASONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
    </label>
    <label className="return-field"><span>{reason === "OTHER" ? "Izoh (majburiy)" : "Izoh (ixtiyoriy)"}</span>
      <textarea value={comment} rows={3} maxLength={MAX_RETURN_COMMENT} disabled={pending} placeholder="Masalan: ekranda chiziq bor" onChange={(event) => { setError(""); setComment(event.target.value); }}/>
    </label>
    {total > 0 && <p className="return-total">Qaytariladigan summa: <Price value={total}/></p>}
    {error && <p className="form-error" role="alert">{error}</p>}
  </Modal>;
}

/**
 * Buyurtma sahifasidagi "Tovarni qaytarish" bloki: yetkazilgan tovar uchun so'rov formasi
 * va shu buyurtma bo'yicha yuborilgan so'rovlar holati. Faqat akkauntga kirgan xaridor uchun.
 */
export function OrderReturns({ orderId, delivered }: { orderId: string; delivered: boolean }) {
  const [signedIn, setSignedIn] = useState(false);
  const [data, setData] = useState<{ returnable: ReturnableItem[]; requests: ReturnRequest[] } | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<ReturnRequest[]>([]);
  const load = useCallback(async () => {
    try { setData(await returnService.forOrder(orderId)); setError(""); }
    catch (caught) { setError(errorMessage(caught, "Qaytarish ma’lumotini yuklab bo‘lmadi")); }
  }, [orderId]);
  useEffect(() => {
    const session = hasAuthSession();
    setSignedIn(session);
    if (session) void load();
  }, [load, delivered]);

  if (!signedIn) return delivered ? <section className="order-returns"><div className="order-returns__head"><div><h2>Tovarni qaytarish</h2><p>Qaytarish so‘rovini yuborish uchun akkauntingizga kiring.</p></div><Link className="button button--secondary" href={`/login?next=${encodeURIComponent(`/orders/${orderId}`)}`}>Kirish</Link></div></section> : null;
  if (error && !data) return delivered ? <section className="order-returns"><p className="form-error form-error--action" role="alert">{error}<button type="button" onClick={() => void load()}>Qayta urinish</button></p></section> : null;
  if (!data || (!data.returnable.length && !data.requests.length)) return null;
  return <section className="order-returns" aria-labelledby="order-returns-title">
    <div className="order-returns__head">
      <div><h2 id="order-returns-title">Tovarni qaytarish</h2><p>{data.returnable.length ? "Tovar yoqmadi yoki nuqsonli chiqdimi? Yetkazilgandan keyin 10 kun ichida qaytarish so‘rovini yuboring." : "Bu buyurtma bo‘yicha qaytarish so‘rovlari."}</p></div>
      {data.returnable.length > 0 && <Button variant="secondary" onClick={() => setOpen(true)}><Undo2/> Qaytarish so‘rovi</Button>}
    </div>
    {created.length > 0 && <p className="form-success" role="status">{created.length > 1 ? `${created.length} ta so‘rov yuborildi — har do‘kon uchun alohida.` : "Qaytarish so‘rovi yuborildi."} Sotuvchi ko‘rib chiqadi, holatini shu yerda kuzatasiz.</p>}
    {data.requests.length > 0 && <ul className="order-returns__list">{data.requests.map((request) => <li key={request.id}>
      <Link href={`/profile/returns/${encodeURIComponent(request.id)}`}>
        <span><b>So‘rov #{request.id}</b><small>{request.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}</small></span>
        <ReturnStatusBadge status={request.status}/>
        <Price value={request.requestedAmount}/>
      </Link>
    </li>)}</ul>}
    <ReturnRequestModal open={open} orderId={orderId} items={data.returnable} onClose={() => setOpen(false)} onCreated={(result) => { setOpen(false); setCreated(result); void load(); }}/>
  </section>;
}
