import type { Metadata } from "next";
import { StorefrontHome } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { categoryService } from "@/services/category.service";
import { productService } from "@/services/product.service";
import { defaultOpenGraphImages } from "@/lib/seo";

export const metadata: Metadata = { title: "Onlayn marketplace", description: "Telefon, elektronika, kiyim va uy uchun mahsulotlarni Elchi Market’da qulay narxlarda toping.", alternates: { canonical: "/" }, openGraph: { title: "Elchi Market — Onlayn marketplace", description: "Telefon, elektronika, kiyim va uy uchun mahsulotlarni qulay narxlarda toping.", url: "/", images: defaultOpenGraphImages } };

export default async function Home({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const params = await searchParams;
  const query = parseCatalogQuery(params);
  const [catalog, categories] = await Promise.all([productService.list(query), categoryService.list()]);
  return <StorefrontHome query={query} catalog={catalog} categories={categories.data}/>;
}
