import Link from "next/link";
import { Price } from "./ui";

export function CartSummary({ quantity, subtotal, discount }: { quantity: number; subtotal: number; discount: number }) {
  const originalTotal = subtotal + discount;
  return <aside className="order-summary cart-order-summary" data-testid="cart-summary"><h2>Buyurtmangiz</h2><p><span>Mahsulotlar ({quantity})</span><Price value={originalTotal}/></p>{discount > 0 && <p className="cart-discount"><span>Chegirmalar</span><b>− <Price value={discount}/></b></p>}<p><span>Yetkazib berish</span><b>Manzil tanlangach hisoblanadi</b></p><hr/><p className="order-total"><span>Jami</span><Price value={subtotal}/></p><Link className="button button--primary" href="/checkout">Rasmiylashtirishga o‘tish</Link><small>Yetkazish narxi va muddati tasdiqlashdan oldin ko‘rsatiladi.</small></aside>;
}
