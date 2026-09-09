import { StorefrontHome } from "@/components/storefront-home";
import { productService } from "@/services/product.service";
import type { ProductQuery } from "@/types/commerce";

type HomeParams = { search?: string; categoryId?: string; minPrice?: string; maxPrice?: string; sort?: `${string}:${"asc" | "desc"}`; page?: string };

export default async function Home({ searchParams }: { searchParams: Promise<HomeParams> }) {
  const params = await searchParams;
  const search = params.search;
  const finiteNumber = (value?: string) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const query: ProductQuery = { search, categoryId: params.categoryId, minPrice: finiteNumber(params.minPrice), maxPrice: finiteNumber(params.maxPrice), sort: params.sort, page: Math.max(1, Math.floor(finiteNumber(params.page) ?? 1)), limit: 20 };
  const catalog = await productService.list(query);
  return <StorefrontHome query={query} catalog={catalog}/>;
}
