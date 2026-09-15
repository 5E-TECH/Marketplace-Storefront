import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { categoryService } from "@/services/category.service";
import { productService } from "@/services/product.service";
import type { CatalogCategory, Product } from "@/types/commerce";

export const dynamic = "force-dynamic";
const flattenCategories = (items: CatalogCategory[]): CatalogCategory[] => items.flatMap((category) => [category, ...flattenCategories(category.children)]);
const validDate = (value?: string): string | undefined => value && Number.isFinite(Date.parse(value)) ? value : undefined;

async function allProducts(): Promise<Product[]> {
  const first = await productService.list({ page: 1, limit: 100 });
  if (first.error || first.totalPages <= 1) return first.data;
  const pages = await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => productService.list({ page: index + 2, limit: 100 })));
  return [first, ...pages].flatMap((page) => page.data);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([categoryService.list(), allProducts()]);
  const categoryEntries = flattenCategories(categories.data).map((category) => ({ url: absoluteUrl(`/katalog/${encodeURIComponent(category.slug)}`), changeFrequency: "daily" as const, priority: 0.8 }));
  const productEntries = products.map((product) => ({ url: absoluteUrl(`/product/${encodeURIComponent(String(product.id))}`), lastModified: validDate(product.updatedAt || product.createdAt), changeFrequency: "daily" as const, priority: 0.9 }));
  const shops = new Map(products.filter((product) => product.shop?.slug).map((product) => [product.shop!.slug, product.shop!]));
  const shopEntries = [...shops.values()].map((shop) => ({ url: absoluteUrl(`/dokon/${encodeURIComponent(shop.slug)}`), changeFrequency: "daily" as const, priority: 0.8 }));
  return [{ url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1 }, { url: absoluteUrl("/katalog"), changeFrequency: "daily", priority: 0.8 }, ...categoryEntries, ...shopEntries, ...productEntries];
}
