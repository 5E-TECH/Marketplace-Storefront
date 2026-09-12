import Link from "next/link";
import { Price } from "./ui";

export function CartSummary({ quantity, subtotal, originalTotal }: { quantity: number; subtotal: number; originalTotal: number }) {
  const discount = Math.max(0, originalTotal - subtotal);
  return <aside className="order-summary">
    <h2>Buyurtmangiz</h2>
    <p><span>Mahsulotlar ({quantity})</span><b><Price value={originalTotal}/></b></p>
    {discount > 0 && <p className="summary-discount"><span>Chegirma</span><b>−{discount.toLocaleString("uz-UZ")} so‘m</b></p>}
    <p><span>Yetkazib berish</span><b>Manzil bo‘yicha</b></p>
    <hr/>
    <p className="order-total"><span>Mahsulotlar jami</span><Price value={subtotal}/></p>
    <Link className="button button--primary" href="/checkout">Rasmiylashtirishga o‘tish</Link>
    <small>Yetkazib berish narxi va muddati manzil tanlangach hisoblanadi</small>
  </aside>;
}
