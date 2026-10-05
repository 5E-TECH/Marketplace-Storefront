import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryStorefront } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { categoryService, findCategoryBySlug } from "@/services/category.service";
import { productService } from "@/services/product.service";
import { baseOpenGraph, breadcrumbLd, clipDescription, defaultOpenGraphImages, jsonLd, listingSeo, pagedTitle, productListLd } from "@/lib/seo";
import type { CategoryResult } from "@/types/commerce";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };

// Backend javob bermasa 404 emas, xato sahifasi chiqsin — aks holda qidiruv tizimi kategoriyani indeksdan chiqaradi.
function requireCategory(categories: CategoryResult, slug: string) {
  if (categories.error) throw new Error(categories.error);
  const category = findCategoryBySlug(categories.data, slug);
  if (!category) notFound();
  return category;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, rawQuery, categories] = await Promise.all([params, searchParams, categoryService.list()]);
  const category = requireCategory(categories, slug);
  const basePath = `/katalog/${encodeURIComponent(category.slug)}`;
  const description = clipDescription(`${category.name}: Elchi Market’dagi do‘konlardan mahsulotlar va narxlar. Narx bo‘yicha saralang, onlayn buyurtma bering — O‘zbekiston bo‘ylab yetkazib beramiz, qabul qilganda to‘laysiz.`);
  return { title: pagedTitle(`${category.name} — narxlar va onlayn xarid`, rawQuery), description, ...listingSeo(basePath, rawQuery), openGraph: { ...baseOpenGraph, title: category.name, description, url: basePath, images: defaultOpenGraphImages } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, rawQuery, categories] = await Promise.all([params, searchParams, categoryService.list()]);
  const category = requireCategory(categories, slug);
  const query = parseCatalogQuery(rawQuery, category.id);
  const catalog = await productService.list(query);
  const basePath = `/katalog/${encodeURIComponent(category.slug)}`;
  const structuredData = [
    breadcrumbLd([{ name: "Bosh sahifa", path: "/" }, { name: "Katalog", path: "/katalog" }, { name: category.name, path: basePath }]),
    productListLd(category.name, basePath, catalog.data, ((query.page ?? 1) - 1) * catalog.limit),
  ];
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}/><CategoryStorefront category={category} categories={categories.data} query={query} catalog={catalog}/></>;
}
