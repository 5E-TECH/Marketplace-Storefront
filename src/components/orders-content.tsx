"use client";

import { Package } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { orderService } from "@/services/order.service";
import type { Order } from "@/types/commerce";
import { formatDate } from "@/lib/format";
import { Price } from "./ui";

export function OrdersContent() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  useEffect(() => { orderService.list().then(setOrders); }, []);
  if (!orders) return <div className="orders-loading"/>;
  if (!orders.length) return <section className="page-empty"><span><Package/></span><h1>Buyurtmalar hali yo‘q</h1><p>Birinchi buyurtmangiz shu yerda ko‘rinadi.</p><Link className="button button--primary" href="/#products">Xarid qilish</Link></section>;
  return <section className="orders-page"><div className="page-heading"><div><span>BUYURTMALARIM</span><h1>Xaridlar tarixi</h1></div></div><div className="orders-list">{orders.map((order) => <article key={order.id}><header><div><small>Buyurtma</small><b>{order.id}</b></div><div><small>Sana</small><b>{formatDate(order.createdAt)}</b></div><span>{order.status}</span></header><div>{order.items.slice(0, 3).map((item) => <Link href={`/product/${item.productId}`} key={item.id}>{item.product.name} <small>× {item.quantity}</small></Link>)}</div><footer><span>{order.items.length} xil mahsulot</span><Price value={order.total}/><Link className="button button--secondary" href={`/orders/${encodeURIComponent(order.id)}`}>Kuzatish</Link></footer></article>)}</div></section>;
}
