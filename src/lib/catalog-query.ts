import type { ProductQuery, ProductSort } from "@/types/commerce";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;
const allowedSorts = new Set<ProductSort>(["createdAt:asc", "createdAt:desc", "price:asc", "price:desc", "name:asc", "name:desc"]);
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const finiteNumber = (value: string | undefined) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function parseCatalogQuery(params: CatalogSearchParams, categoryId?: string | number): ProductQuery {
  const rawSort = first(params.sort);
  const sort = allowedSorts.has(rawSort as ProductSort) ? rawSort as ProductSort : "createdAt:desc";
  return {
    search: first(params.q)?.trim() || first(params.search)?.trim() || undefined,
    categoryId,
    minPrice: finiteNumber(first(params.minPrice)),
    maxPrice: finiteNumber(first(params.maxPrice)),
    sort,
    page: Math.max(1, Math.floor(finiteNumber(first(params.page)) ?? 1)),
    limit: 10,
  };
}

export function catalogHref(basePath: string, query: ProductQuery, changes: Partial<ProductQuery> = {}) {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.search) params.set(basePath === "/qidiruv" ? "q" : "search", next.search);
  if (next.minPrice !== undefined) params.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== undefined) params.set("maxPrice", String(next.maxPrice));
  if (next.sort && next.sort !== "createdAt:desc") params.set("sort", next.sort);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const search = params.toString();
  return `${basePath}${search ? `?${search}` : ""}#products`;
}
