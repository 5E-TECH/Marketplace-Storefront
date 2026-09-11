"use client";

import { PackageSearch } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { orderService } from "@/services/order.service";
import type { Order } from "@/types/commerce";
import { Button } from "./ui";

export function OrderSearchContent() {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { orderService.list().then(setOrders); }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = number.trim();
    if (!value || value.length > 100 || /[\u0000-\u001f\u007f]/.test(value)) { setError("Buyurtma raqamini to‘g‘ri kiriting."); return; }
    router.push(`/orders/${encodeURIComponent(value)}`);
  };
  return <section className="order-search orders-page">
    <div className="order-search-card"><span><PackageSearch/></span><p>BUYURTMANI KUZATISH</p><h1>Buyurtmangiz qayerda?</h1><small>Tasdiqlash sahifasida berilgan buyurtma raqamini kiriting.</small><form onSubmit={submit} noValidate><label htmlFor="order-number">Buyurtma raqami</label><div><input id="order-number" name="order-number" value={number} maxLength={100} onChange={(event) => { setNumber(event.target.value); setError(""); }} placeholder="Masalan: 12345" autoComplete="off"/><Button type="submit">Holatni ko‘rish</Button></div>{error && <small className="field-error" role="alert">{error}</small>}</form></div>
    {orders.length > 0 && <div className="saved-orders"><h2>Shu qurilmadagi buyurtmalar</h2>{orders.map((order) => <Link href={`/orders/${encodeURIComponent(order.id)}`} key={order.id}><span><b>№ {order.id}</b><small>{order.customer.name}</small></span><strong>{order.status}</strong></Link>)}</div>}
  </section>;
}
