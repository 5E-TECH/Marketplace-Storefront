import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ShopStorefront } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { productService } from "@/services/product.service";
import { defaultOpenGraphImages } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };
const getShop = cache((slug: string) => productService.getShop(slug, { page: 1, limit: 10 }));

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getShop(slug);
  if (!result) return { title: "Do‘kon topilmadi", description: "So‘ralgan do‘kon topilmadi." };
  const description = result.shop.description || `${result.shop.name} do‘konining mahsulotlari va narxlari — Elchi Market.`;
  const canonical = `/dokon/${encodeURIComponent(result.shop.slug)}`;
  const images = result.shop.logoUrl ? [{ url: result.shop.logoUrl, alt: result.shop.name }] : defaultOpenGraphImages;
  return { title: result.shop.name, description, alternates: { canonical }, openGraph: { title: result.shop.name, description, url: canonical, type: "website", images }, twitter: { card: "summary_large_image", title: result.shop.name, description, images: images.map((image) => image.url) } };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const [{ slug }, rawQuery] = await Promise.all([params, searchParams]);
  const query = parseCatalogQuery(rawQuery);
  const result = query.page === 1 && !query.search && query.minPrice === undefined && query.maxPrice === undefined && query.sort === "createdAt:desc" ? await getShop(slug) : await productService.getShop(slug, query);
  if (!result) notFound();
  return <ShopStorefront shop={result.shop} query={query} catalog={result.catalog}/>;
}
