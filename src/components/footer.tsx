import Link from "next/link";
import { Banknote, PackageSearch, Truck } from "lucide-react";
import type { CatalogCategory } from "@/types/commerce";
import { Container } from "./ui";

const FOOTER_CATEGORIES = 6;

/** Footer: asosiy bo'limlar va mashhur kategoriyalar — har sahifadan kategoriyalarga ichki havola (qidiruv tizimi ham ko'radi). */
export function Footer({ categories = [] }: { categories?: CatalogCategory[] }) {
  const year = new Date().getUTCFullYear();
  return <footer className="site-footer">
    <Container className="footer-grid">
      <div className="footer-brand">
        <Link className="logo logo--footer" href="/" aria-label="Elchi Market bosh sahifa"><i className="logo-mark" aria-hidden>e</i><span>elchi</span><b>market</b></Link>
        <p>O‘zbekistondagi do‘konlar va xaridorlarni bog‘laydigan onlayn bozor. Posilkalarni Elchi yetkazib beradi.</p>
        <ul className="footer-perks">
          <li><Truck aria-hidden/> O‘zbekiston bo‘ylab yetkazish</li>
          <li><Banknote aria-hidden/> Qabul qilganda to‘lash</li>
          <li><PackageSearch aria-hidden/> Buyurtmani kuzatish</li>
        </ul>
      </div>
      <nav aria-label="Xaridorlar uchun"><b>Xaridorlar uchun</b><Link href="/cart">Savatcha</Link><Link href="/favorites">Sevimlilar</Link><Link href="/profile/orders">Buyurtmalar</Link><Link href="/profile/returns">Qaytarishlar</Link></nav>
      <nav aria-label="Katalog"><b>Katalog</b>{categories.slice(0, FOOTER_CATEGORIES).map((category) => <Link href={`/katalog/${encodeURIComponent(category.slug)}`} key={category.id}>{category.name}</Link>)}<Link href="/katalog">Barcha kategoriyalar</Link><Link href="/qidiruv">Mahsulot qidirish</Link></nav>
      <nav aria-label="Akkaunt"><b>Akkaunt</b><Link href="/login">Kirish</Link><Link href="/register">Ro‘yxatdan o‘tish</Link><Link href="/profile">Shaxsiy kabinet</Link><Link href="/profile/notifications">Bildirishnomalar</Link></nav>
    </Container>
    <Container><div className="copyright"><span>© {year} Elchi Market. Barcha huquqlar himoyalangan.</span><span>Buyurtma holatini “Buyurtmalarim” bo‘limida kuzatib borasiz</span></div></Container>
  </footer>;
}
