import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Container } from "@/components/ui";
import { marketplaceCategories } from "@/data/categories";

export const metadata: Metadata = { title: "Mahsulotlar katalogi", description: "Elchi Market mahsulot kategoriyalari." };

export default function CatalogPage() {
  return <><Header/><main><Container><section className="catalog-page"><div className="page-heading"><div><span>KATALOG</span><h1>Barcha kategoriyalar</h1></div></div><div className="catalog-page-grid">{marketplaceCategories.map((category) => <article key={category.id}><Link href={`/?categoryId=${category.id}#products`}><span>{category.icon}</span><h2>{category.name}</h2></Link><div>{category.children.map((child) => <Link href={`/?search=${encodeURIComponent(child)}#products`} key={child}>{child}</Link>)}</div></article>)}</div></section></Container></main><Footer/></>;
}
