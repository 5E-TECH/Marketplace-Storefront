import type { Metadata } from "next";
import { SearchStorefront } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { productService } from "@/services/product.service";

type Props = { searchParams: Promise<CatalogSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = parseCatalogQuery(await searchParams).search;
  const title = query ? `“${query}” qidiruvi` : "Mahsulot qidirish";
  return { title, description: query ? `${query} bo‘yicha mahsulotlar va narxlar.` : "Elchi Market mahsulotlarini nomi bo‘yicha qidiring.", alternates: { canonical: "/qidiruv" } };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = parseCatalogQuery(await searchParams);
  const catalog = query.search ? await productService.list(query) : { data: [], total: 0, page: 1, limit: 20, totalPages: 0, source: "api" as const };
  const suggestions = query.search && !catalog.error && !catalog.data.length ? (await productService.list({ page: 1, limit: 4 })).data : [];
  return <SearchStorefront query={query} catalog={catalog} suggestions={suggestions}/>;
}
