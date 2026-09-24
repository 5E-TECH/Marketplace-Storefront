import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ShopStorefront } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { productService } from "@/services/product.service";
import { baseOpenGraph, clipDescription, defaultOpenGraphImages, listingSeo } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };
const getShop = cache((slug: string) => productService.getShop(slug, { page: 1, limit: 10 }));

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const result = await getShop(slug);
  // notFound() shu yerda chaqirilsa javob haqiqiy 404 bo'ladi; sahifa ichida esa oqim boshlangan, status 200 qolardi.
  if (!result) notFound();
  const { shop } = result;
  const description = clipDescription(shop.description ? `${shop.name}: ${shop.description}` : `${shop.name} do‘konining mahsulotlari va narxlari. Elchi Market orqali buyurtma bering, O‘zbekiston bo‘ylab yetkazib beramiz.`);
  const basePath = `/dokon/${encodeURIComponent(shop.slug)}`;
  // Logotip kvadrat — katta kartochkada cho'zilib ketmasin.
  const images = shop.logoUrl ? [{ url: shop.logoUrl, alt: shop.name }] : defaultOpenGraphImages;
  return { title: shop.name, description, ...listingSeo(basePath, rawQuery), openGraph: { ...baseOpenGraph, title: shop.name, description, url: basePath, images }, twitter: { card: shop.logoUrl ? "summary" : "summary_large_image" } };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const query = parseCatalogQuery(rawQuery);
  const result = query.page === 1 && !query.search && query.minPrice === undefined && query.maxPrice === undefined && query.sort === "createdAt:desc" ? await getShop(slug) : await productService.getShop(slug, query);
  if (!result) notFound();
  return <ShopStorefront shop={result.shop} query={query} catalog={result.catalog}/>;
}
