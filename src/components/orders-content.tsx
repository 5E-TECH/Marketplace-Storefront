"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { orderService } from "@/services/order.service";
import type { Order } from "@/types/commerce";
import { formatDate } from "@/lib/format";
import { LoadingGrid, Price, StatePanel } from "./ui";

export function OrdersContent() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void orderService.listForCurrentBuyer().then((result) => { if (active) { setOrders(result.orders); setError(result.error ?? ""); } });
    return () => { active = false; };
  }, []);
  if (!orders) return <LoadingGrid count={3} label="Buyurtmalar yuklanmoqda"/>;
  if (!orders.length) return <StatePanel kind={error ? "error" : "empty"} icon={<Package/>} title="Buyurtmalar hali yo‘q" description={error ? `Buyurtmalarni serverdan yuklab bo‘lmadi. ${error}` : "Birinchi buyurtmangiz shu yerda ko‘rinadi."} action={<Link className="button button--primary" href="/#products">Xarid qilish</Link>}/>;
  return <section className="orders-page"><div className="page-heading"><div><span>BUYURTMALARIM</span><h1>Xaridlar tarixi</h1></div></div>{error && <div className="catalog-notice catalog-notice--error" role="alert"><p>{error} Shu brauzerda saqlangan buyurtmalar ko‘rsatilmoqda.</p></div>}<div className="orders-list">{orders.map((order) => <article key={order.id}><header><div><small>Buyurtma</small><b>{order.id}</b></div><div><small>Sana</small><b>{formatDate(order.createdAt)}</b></div><span>{order.status}</span></header><div>{order.items.slice(0, 3).map((item) => <Link href={`/product/${item.productId}`} key={item.id}>{item.product.name} <small>× {item.quantity}</small></Link>)}</div><footer><span>{order.payment === "card" ? order.paymentStatus === "PAID" ? "Online to‘langan" : "To‘lov kutilmoqda" : "Qabul qilganda to‘lash"}</span><Price value={order.total}/><Link className="button button--secondary" href={`/orders/${encodeURIComponent(order.id)}`}>Kuzatish</Link></footer></article>)}</div></section>;
}
