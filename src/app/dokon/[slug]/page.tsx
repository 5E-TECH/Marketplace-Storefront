import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductGrid } from "@/components/product-grid";
import { Container, StatePanel } from "@/components/ui";
import { shopService } from "@/services/shop.service";

type Props = { params: Promise<{ slug: string }> };
const getShop = cache((slug: string) => shopService.getBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getShop((await params).slug);
  return result ? { title: result.shop.name, description: result.shop.description ?? `${result.shop.name} do‘konidagi mahsulotlar.` } : { title: "Do‘kon topilmadi", robots: { index: false, follow: false } };
}

export default async function ShopPage({ params }: Props) {
  const result = await getShop((await params).slug);
  if (!result) notFound();
  return <main><Container><header className="shop-hero"><span>DO‘KON</span><h1>{result.shop.name}</h1><p>{result.shop.description ?? "Elchi Market’dagi ishonchli sotuvchi."}</p><small>★ {result.shop.rating ?? 0} · {result.shop.ordersCount ?? 0} ta buyurtma</small></header><section className="content-section"><div className="catalog-heading"><div><h2>Do‘kon mahsulotlari</h2><p>{result.products.total} ta mahsulot</p></div></div>{result.products.data.length ? <ProductGrid products={result.products.data}/> : <StatePanel compact title="Mahsulotlar hozircha yo‘q" description="Bu do‘konda sotuvdagi mahsulotlar paydo bo‘lganda shu yerda ko‘rinadi."/>}</section></Container></main>;
}
