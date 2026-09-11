import { ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { productPath } from "@/lib/product-url";
import type { Order } from "@/types/commerce";
import { Button, Price } from "./ui";

export function OrderReceipt({ order, refreshing, onRefresh }: { order: Order; refreshing: boolean; onRefresh: () => void }) {
  return <div className="order-detail-grid">
    <article className="order-detail-card"><h2>Buyurtma tarkibi</h2>{order.items.map((item) => <Link href={productPath(item.product)} className="order-product" key={item.id}><span>{item.product.name}<small>× {item.quantity}</small></span><Price value={item.product.price * item.quantity}/></Link>)}<hr/><p><span>Mahsulotlar</span><Price value={order.subtotal}/></p><p><span>Yetkazish</span><Price value={order.delivery}/></p><p className="order-detail-total"><span>To‘lov summasi</span><Price value={order.total}/></p><small>To‘lov usuli: {order.payment === "cash" ? "qo‘lga to‘lash" : "karta"}</small></article>
    <aside className="order-detail-card"><h2>Yetkazib berish</h2><p><span>Qabul qiluvchi</span><b>{order.customer.name}</b></p><p><span>Telefon</span><b>{order.customer.phone}</b></p><p><span>Manzil</span><b>{order.customer.address}</b></p><p><span>Kutilayotgan vaqt</span><b>{order.estimatedDeliveryAt ? formatDateTime(order.estimatedDeliveryAt) : "Aniqlanmoqda"}</b></p>{order.updatedAt && <small>Holat yangilandi: {formatDateTime(order.updatedAt)}</small>}{order.trackingUrl && <a className="button button--secondary" href={order.trackingUrl} target="_blank" rel="noopener noreferrer">Elchi kuzatuvi <ExternalLink/></a>}<Button variant="secondary" loading={refreshing} onClick={onRefresh}><RefreshCw/> Holatni yangilash</Button></aside>
  </div>;
}
