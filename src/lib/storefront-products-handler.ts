import { NextRequest, NextResponse } from "next/server";
import { productService } from "@/services/product.service";
import type { ProductQuery } from "@/types/commerce";

const finiteNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function handleStorefrontProducts(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sort = params.get("sort");
  const query: ProductQuery = {
    search: params.get("search") || undefined,
    categoryId: params.get("categoryId") || undefined,
    minPrice: finiteNumber(params.get("minPrice")),
    maxPrice: finiteNumber(params.get("maxPrice")),
    sort: sort?.match(/^.+:(asc|desc)$/) ? sort as ProductQuery["sort"] : undefined,
    page: Math.max(1, Math.floor(finiteNumber(params.get("page")) ?? 1)),
    limit: Math.min(100, Math.max(1, Math.floor(finiteNumber(params.get("limit")) ?? 20))),
  };
  const catalog = await productService.list(query);
  return NextResponse.json(catalog, { status: catalog.source === "unavailable" ? 502 : 200 });
}
