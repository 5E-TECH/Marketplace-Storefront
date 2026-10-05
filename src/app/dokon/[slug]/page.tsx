import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ShopStorefront } from "@/components/storefront-home";
import { CATALOG_PAGE_SIZE, parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { productService } from "@/services/product.service";
import { baseOpenGraph, breadcrumbLd, clipDescription, defaultOpenGraphImages, jsonLd, listingSeo, pagedTitle, productListLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };
// Standart 1-sahifa (metadata bilan umumiy): hajmi `parseCatalogQuery` bilan bir xil, 2-sahifa 11–20 ni o'tkazib yubormasin.
const getShop = cache((slug: string) => productService.getShop(slug, { page: 1, limit: CATALOG_PAGE_SIZE }));

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const result = await getShop(slug);
  // notFound() shu yerda chaqirilsa javob haqiqiy 404 bo'ladi; sahifa ichida esa oqim boshlangan, status 200 qolardi.
  if (!result) notFound();
  const { shop } = result;
  const description = clipDescription(shop.description ? `${shop.name}: ${shop.description}. Mahsulotlar va narxlar — Elchi Market orqali onlayn buyurtma bering, O‘zbekiston bo‘ylab yetkazib beramiz.` : `${shop.name} do‘konining mahsulotlari va narxlari. Elchi Market orqali onlayn buyurtma bering, O‘zbekiston bo‘ylab yetkazib beramiz.`);
  const basePath = `/dokon/${encodeURIComponent(shop.slug)}`;
  // Logotip kvadrat — katta kartochkada cho'zilib ketmasin.
  const images = shop.logoUrl ? [{ url: shop.logoUrl, alt: shop.name }] : defaultOpenGraphImages;
  return { title: pagedTitle(`${shop.name} — do‘kon mahsulotlari va narxlari`, rawQuery), description, ...listingSeo(basePath, rawQuery), openGraph: { ...baseOpenGraph, title: shop.name, description, url: basePath, images }, twitter: { card: shop.logoUrl ? "summary" : "summary_large_image" } };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const query = parseCatalogQuery(rawQuery);
  const result = query.page === 1 && !query.search && query.minPrice === undefined && query.maxPrice === undefined && query.sort === "createdAt:desc" ? await getShop(slug) : await productService.getShop(slug, query);
  if (!result) notFound();
  const basePath = `/dokon/${encodeURIComponent(result.shop.slug)}`;
  const structuredData = [
    breadcrumbLd([{ name: "Bosh sahifa", path: "/" }, { name: result.shop.name, path: basePath }]),
    productListLd(result.shop.name, basePath, result.catalog.data, ((query.page ?? 1) - 1) * result.catalog.limit),
  ];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}/><ShopStorefront shop={result.shop} query={query} catalog={result.catalog}/></>;
}
