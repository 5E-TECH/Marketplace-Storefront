"use client";

import { Package, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { orderService } from "@/services/order.service";
import type { Order } from "@/types/commerce";
import { formatDate } from "@/lib/format";
import { Button, LoadingGrid, Price, StatePanel } from "./ui";

const paymentLabel = (order: Order) => order.payment !== "card" ? "Qabul qilganda to‘lash"
  : order.paymentStatus === "PAID" ? "Online to‘langan"
  : order.paymentStatus === "REFUNDED" ? "Qaytarilgan"
  : order.paymentStatus === "CANCELLED" || order.paymentStatus === "FAILED" ? "To‘lov amalga oshmadi"
  : "To‘lov kutilmoqda";

export function OrdersContent() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [reloading, setReloading] = useState(false);
  const load = useCallback(async () => {
    const result = await orderService.listForCurrentBuyer();
    return result;
  }, []);
  useEffect(() => {
    let active = true;
    void load().then((result) => { if (active) { setOrders(result.orders); setError(result.error ?? ""); } });
    return () => { active = false; };
  }, [load]);
  // Backend vaqtincha javob bermasa xaridor sahifani yangilamasdan qayta urina olishi kerak.
  const retry = async () => {
    setReloading(true);
    try {
      const result = await load();
      setOrders(result.orders);
      setError(result.error ?? "");
    } finally { setReloading(false); }
  };

  if (!orders) return <LoadingGrid count={3} label="Buyurtmalar yuklanmoqda"/>;
  if (!orders.length) return <StatePanel kind={error ? "error" : "empty"} icon={<Package/>}
    title={error ? "Buyurtmalarni yuklab bo‘lmadi" : "Buyurtmalar hali yo‘q"}
    description={error ? `Buyurtmalarni serverdan yuklab bo‘lmadi. ${error}` : "Birinchi buyurtmangiz shu yerda ko‘rinadi."}
    action={error
      ? <><Button loading={reloading} onClick={() => void retry()}><RefreshCw/> Qayta urinish</Button><Link className="button button--secondary" href="/#products">Xarid qilish</Link></>
      : <Link className="button button--primary" href="/#products">Xarid qilish</Link>}/>;

  return <section className="orders-page">
    <div className="page-heading"><div><span>BUYURTMALARIM</span><h1>Xaridlar tarixi</h1></div><button type="button" onClick={() => void retry()} disabled={reloading}><RefreshCw/> {reloading ? "Yangilanmoqda…" : "Yangilash"}</button></div>
    {error && <div className="catalog-notice catalog-notice--error" role="alert"><span>ALOQA YO‘Q</span><p>{error} Shu brauzerda saqlangan buyurtmalar ko‘rsatilmoqda.</p></div>}
    <div className="orders-list">{orders.map((order) => <article key={order.id}>
      <header><div><small>Buyurtma</small><b>{order.id}</b></div><div><small>Sana</small><b>{formatDate(order.createdAt)}</b></div><span>{order.status}</span></header>
      <div>{order.items.slice(0, 3).map((item) => <Link href={`/product/${item.productId}`} key={item.id}>{item.product.name} <small>× {item.quantity}</small></Link>)}</div>
      <footer><span>{paymentLabel(order)}</span><Price value={order.total}/><Link className="button button--secondary" href={`/orders/${encodeURIComponent(order.id)}`}>Kuzatish</Link></footer>
    </article>)}</div>
  </section>;
}
