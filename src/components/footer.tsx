import Link from "next/link";
import { Container } from "./ui";

export function Footer() {
  const year = new Date().getUTCFullYear();
  return <footer><Container className="footer-grid"><div><Link className="logo logo--footer" href="/"><span>elchi</span><b>market</b></Link><p>O‘zbekistondagi do‘konlar va xaridorlarni bog‘laydigan onlayn bozor. Posilkalarni Elchi yetkazib beradi.</p></div><div><b>Xaridorlar uchun</b><Link href="/cart">Savatcha</Link><Link href="/favorites">Sevimlilar</Link><Link href="/profile/orders">Buyurtmalar</Link></div><div><b>Katalog</b><Link href="/katalog">Barcha kategoriyalar</Link><Link href="/qidiruv">Mahsulot qidirish</Link></div><div><b>Akkaunt</b><Link href="/login">Kirish</Link><Link href="/register">Ro‘yxatdan o‘tish</Link><Link href="/profile">Shaxsiy kabinet</Link></div></Container><Container><div className="copyright"><span>© {year} Elchi Market</span><span>Savollar bo‘lsa, buyurtma sahifasidagi sotuvchiga murojaat qiling</span></div></Container></footer>;
}
