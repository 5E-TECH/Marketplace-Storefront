import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { categoryService } from "@/services/category.service";

export const metadata: Metadata = { title: "Mahsulotlar katalogi", description: "Elchi Market mahsulot kategoriyalari." };

export default async function CatalogPage() {
  const categories = await categoryService.list();
  return <main><Container><section className="catalog-page"><div className="page-heading"><div><span>KATALOG</span><h1>Barcha kategoriyalar</h1></div></div>{categories.error && <div className="catalog-notice"><span>ESLATMA</span><p>Backend kategoriyalari vaqtincha yuklanmadi. Asosiy katalog kategoriyalari ko‘rsatildi.</p></div>}<div className="catalog-page-grid">{categories.data.map((category) => <article key={category.id}><Link href={`/katalog/${category.slug}`}><span>{category.icon}</span><h2>{category.name}</h2></Link><div>{category.children.map((child) => <Link href={`/katalog/${child.slug}`} key={child.id}>{child.name}</Link>)}</div></article>)}</div></section></Container></main>;
}
