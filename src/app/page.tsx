import type { Metadata } from "next";
import { StorefrontHome } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { productService } from "@/services/product.service";
import { defaultOpenGraphImages } from "@/lib/seo";

export const metadata: Metadata = { title: "Onlayn marketplace", description: "Telefon, elektronika, kiyim va uy uchun mahsulotlarni Elchi Market’da qulay narxlarda toping.", alternates: { canonical: "/" }, openGraph: { title: "Elchi Market — Onlayn marketplace", description: "Telefon, elektronika, kiyim va uy uchun mahsulotlarni qulay narxlarda toping.", url: "/", images: defaultOpenGraphImages } };

export default async function Home({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const params = await searchParams;
  const query = parseCatalogQuery(params);
  const [catalog, featuredShops] = await Promise.all([productService.list(query), productService.featuredShops()]);
  return <StorefrontHome query={query} catalog={catalog} featuredShops={featuredShops}/>;
}
