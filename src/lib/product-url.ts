import type { Product } from "@/types/commerce";

export function productSlug(product: Pick<Product, "name" | "slug">): string {
  if (product.slug?.trim()) return product.slug.trim();
  const slug = product.name.toLocaleLowerCase("uz").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[‘’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "mahsulot";
}

export function productPath(product: Pick<Product, "id" | "name" | "slug">): string {
  return `/mahsulot/${encodeURIComponent(`${productSlug(product)}-p-${String(product.id)}`)}`;
}

export function productIdFromRoute(value: string): string | null {
  const marker = value.lastIndexOf("-p-");
  return marker >= 0 && marker + 3 < value.length ? value.slice(marker + 3) : null;
}
