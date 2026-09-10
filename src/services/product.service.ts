import { env } from "@/config/env";
import { mockProducts } from "@/data/mock-products";
import { ApiError, apiRequest } from "@/lib/api";
import { productSlug } from "@/lib/product-url";
import { validateStorefrontProductDto, validateStorefrontProductsPageDto } from "@/generated/api-validators";
import type { CatalogResult, Product, ProductQuery } from "@/types/commerce";
import type { StorefrontProductDto, StorefrontProductsResponse } from "@/types/storefront-api";

const STOREFRONT_PRODUCTS_PATH = "/storefront/products";
const STOREFRONT_SHOPS_PATH = "/storefront/shops";

const demoCatalog = [...mockProducts, ...mockProducts.map((product, index) => ({
  ...product,
  id: `${product.id}-collection`,
  name: `${product.name} ${index % 2 ? "Plus" : "2026"}`,
  price: product.price + (index + 1) * 25_000,
  oldPrice: product.oldPrice ? product.oldPrice + (index + 1) * 25_000 : undefined,
  badge: index % 3 === 0 ? "Yangi" : product.badge,
})), ...mockProducts.map((product, index) => ({
  ...product,
  id: `${product.id}-selection`,
  name: `${product.name} ${index % 2 ? "Max" : "Select"}`,
  price: product.price + (index + 1) * 40_000,
  oldPrice: product.oldPrice ? product.oldPrice + (index + 1) * 40_000 : undefined,
  badge: index % 2 === 0 ? "Yangi" : product.badge,
}))];

const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (...values: unknown[]) => String(values.find((value) => typeof value === "string" || typeof value === "number") ?? "");
const number = (...values: unknown[]) => {
  for (const value of values) {
    if (value === "" || value === null || value === undefined) continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};
const id = (...values: unknown[]): string | number => {
  const value = values.find((item) => typeof item === "string" || typeof item === "number");
  return typeof value === "number" || typeof value === "string" ? value : "";
};
const imageUrl = (value: unknown): string => {
  if (typeof value === "string") {
    if (value.startsWith("/") && env.apiUrl) return new URL(value, env.apiUrl).toString();
    return value;
  }
  const item = object(value);
  const url = text(item.url, item.src, item.path, item.imageUrl, item.fileUrl);
  return url.startsWith("/") && env.apiUrl ? new URL(url, env.apiUrl).toString() : url;
};

// Storefront DTO -> UI domain. Backend field nomlari aniqlashgach faqat shu funksiya toraytiriladi.
export const normalizeProduct = (value: StorefrontProductDto): Product => {
  const raw = object(value);
  const media = Array.isArray(raw.images) ? raw.images : Array.isArray(raw.media) ? raw.media : Array.isArray(raw.photos) ? raw.photos : [];
  const images = media.map(imageUrl).filter(Boolean);
  const image = imageUrl(raw.image) || imageUrl(raw.thumbnail) || imageUrl(raw.cover) || imageUrl(raw.imageUrl) || images[0] || "/placeholder-product.svg";
  const category = object(raw.category);
  const shop = object(raw.shop);
  const rawVariants = Array.isArray(value.variants) ? value.variants.map(object) : [];
  const variants = rawVariants.map((variant) => ({ id: id(variant.id), name: text(variant.name) || undefined, sku: text(variant.sku) || undefined, price: number(variant.price, raw.price), oldPrice: number(variant.oldPrice) || undefined, stock: typeof variant.stock === "number" ? variant.stock : undefined, color: text(variant.color, object(variant.attributes).color) || undefined, size: text(variant.size, object(variant.attributes).size, object(variant.attributes).storage) || undefined, image: imageUrl(variant.imageUrl) || (Array.isArray(variant.images) ? variant.images : []).map(imageUrl).find(Boolean), isActive: typeof variant.isActive === "boolean" ? variant.isActive : undefined, attributes: Object.fromEntries(Object.entries(object(variant.attributes)).filter((entry): entry is [string, string | number | boolean] => ["string", "number", "boolean"].includes(typeof entry[1]))) }));
  const variantImages = rawVariants.flatMap((variant) => [imageUrl(variant.imageUrl), ...(Array.isArray(variant.images) ? variant.images : []).map(imageUrl)]).filter(Boolean);
  const allImages = [...new Set([...images, ...variantImages])];
  const primaryImage = image === "/placeholder-product.svg" && allImages[0] ? allImages[0] : image;
  const colors = [...new Set([...(Array.isArray(raw.colors) ? raw.colors.map((color) => typeof color === "string" ? color : text(object(color).hex, object(color).value)) : []), ...rawVariants.map((variant) => text(variant.color, object(variant.attributes).color))].filter(Boolean))];
  const variantPrices = variants.map((variant) => variant.price).filter((price) => price > 0);
  const price = number(raw.price, raw.salePrice, raw.currentPrice) || (variantPrices.length ? Math.min(...variantPrices) : 0);
  return {
    id: id(raw.id, raw.productId),
    slug: text(raw.slug) || undefined,
    name: text(raw.name, raw.title),
    category: text(category.name, raw.categoryName, raw.category, "Mahsulot"),
    price,
    oldPrice: number(raw.oldPrice, raw.originalPrice, raw.compareAtPrice) || undefined,
    rating: number(raw.rating, raw.averageRating) || 0,
    reviews: number(raw.reviews, raw.reviewsCount, raw.reviewCount) || 0,
    image: primaryImage,
    images: [...new Set([primaryImage, ...allImages])],
    badge: text(raw.badge, raw.label) || undefined,
    description: text(raw.description, raw.shortDescription, "Sifatli va ishonchli mahsulot."),
    colors: colors.length ? colors : ["#17181a"],
    status: text(raw.status) || undefined,
    shop: shop.id !== undefined && shop.id !== null ? { id: id(shop.id), name: text(shop.name, "Do‘kon"), slug: text(shop.slug), logoUrl: imageUrl(shop.logoUrl) || undefined, bannerUrl: imageUrl(shop.bannerUrl) || undefined, description: text(shop.description) || undefined, status: text(shop.status) || undefined, rating: number(shop.rating) || undefined, ordersCount: number(shop.ordersCount) || undefined } : undefined,
    categoryInfo: category.id !== undefined && category.id !== null ? { id: id(category.id), name: text(category.name, "Mahsulot"), slug: text(category.slug) || undefined } : undefined,
    variants,
    createdAt: text(raw.createdAt) || undefined,
    updatedAt: text(raw.updatedAt) || undefined,
  };
};

export const productService = {
  async list(query: ProductQuery = {}): Promise<CatalogResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    if (env.useMockData) {
      const search = query.search?.trim().toLocaleLowerCase("uz") ?? "";
      const filtered = demoCatalog.filter((product) => {
        const matchesSearch = !search || `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase("uz").includes(search);
        const matchesCategory = query.categoryId === undefined || String(product.categoryInfo?.id) === String(query.categoryId);
        const matchesMin = query.minPrice === undefined || product.price >= query.minPrice;
        const matchesMax = query.maxPrice === undefined || product.price <= query.maxPrice;
        return matchesSearch && matchesCategory && matchesMin && matchesMax;
      });
      const [sortField, sortDirection] = query.sort?.split(":") ?? [];
      const direction = sortDirection === "desc" ? -1 : 1;
      if (sortField === "price") filtered.sort((a, b) => (a.price - b.price) * direction);
      if (sortField === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "uz") * direction);
      if (sortField === "createdAt") filtered.sort((a, b) => ((Date.parse(a.createdAt ?? "") || 0) - (Date.parse(b.createdAt ?? "") || 0)) * direction);
      const start = (page - 1) * limit;
      const data = filtered.slice(start, start + limit).map((product) => ({ ...product, images: [...new Set(product.images)] }));
      return { data, total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit), source: "mock" };
    }
    if (!env.apiUrl) return { data: [], total: 0, page, limit, totalPages: 0, source: "unavailable", error: "API_URL sozlanmagan" };
    let result: StorefrontProductsResponse;
    try {
      const response = await apiRequest(STOREFRONT_PRODUCTS_PATH, { params: { search: query.search, categoryId: query.categoryId, minPrice: query.minPrice, maxPrice: query.maxPrice, sort: query.sort, page, limit }, next: { revalidate: 30 }, validate: validateStorefrontProductsPageDto });
      result = response;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Storefront API bilan aloqa yo‘q";
      const message = `${env.apiUrl}${STOREFRONT_PRODUCTS_PATH} — ${reason}`;
      return { data: [], total: 0, page, limit, totalPages: 0, source: "unavailable", error: message };
    }
    const items = result.items.map(normalizeProduct).filter((product) => product.id !== "" && product.name);
    const total = number(result.total, items.length);
    const responsePage = Math.max(1, number(result.page, page));
    const responseLimit = Math.max(1, number(result.limit, limit));
    const totalPages = Math.max(0, number(result.totalPages, Math.ceil(total / responseLimit)));
    return { data: items, total, page: responsePage, limit: responseLimit, totalPages, source: "api" };
  },
  async getById(id: string | number): Promise<Product | null> {
    if (env.useMockData) return demoCatalog.find((product) => String(product.id) === String(id)) ?? null;
    if (!env.apiUrl) return null;
    try {
      const response = await apiRequest(`${STOREFRONT_PRODUCTS_PATH}/${encodeURIComponent(String(id))}`, { next: { revalidate: 30 }, validate: validateStorefrontProductDto });
      const product = normalizeProduct(response);
      return product.id !== "" && product.name ? product : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async getBySlug(slug: string): Promise<Product | null> {
    const normalizedSlug = slug.trim().toLocaleLowerCase("uz");
    if (!normalizedSlug) return null;
    if (env.useMockData) return demoCatalog.find((product) => productSlug(product) === normalizedSlug) ?? null;
    if (!env.apiUrl) return null;
    try {
      const response = await apiRequest(STOREFRONT_PRODUCTS_PATH, { params: { search: normalizedSlug.replace(/-/g, " "), page: 1, limit: 100 }, next: { revalidate: 30 }, validate: validateStorefrontProductsPageDto });
      return response.items.map(normalizeProduct).find((product) => product.slug?.toLocaleLowerCase("uz") === normalizedSlug) ?? null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  async listByShop(shopId: string | number, query: Omit<ProductQuery, "categoryId"> = {}): Promise<CatalogResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    if (env.useMockData) {
      const products = demoCatalog.filter((product) => String(product.shop?.id) === String(shopId));
      const start = (page - 1) * limit;
      return { data: products.slice(start, start + limit), total: products.length, page, limit, totalPages: Math.ceil(products.length / limit), source: "mock" };
    }
    if (!env.apiUrl) return { data: [], total: 0, page, limit, totalPages: 0, source: "unavailable", error: "API_URL sozlanmagan" };
    const path = `${STOREFRONT_SHOPS_PATH}/${encodeURIComponent(String(shopId))}/products`;
    try {
      const response = await apiRequest(path, { params: { search: query.search, minPrice: query.minPrice, maxPrice: query.maxPrice, sort: query.sort, page, limit }, next: { revalidate: 30 }, validate: validateStorefrontProductsPageDto });
      const result = response;
      const items = result.items.map(normalizeProduct).filter((product) => product.id !== "" && product.name);
      const total = number(result.total, items.length);
      const responseLimit = Math.max(1, number(result.limit, limit));
      return { data: items, total, page: Math.max(1, number(result.page, page)), limit: responseLimit, totalPages: Math.max(0, number(result.totalPages, Math.ceil(total / responseLimit))), source: "api" };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Do‘kon mahsulotlarini yuklab bo‘lmadi";
      return { data: [], total: 0, page, limit, totalPages: 0, source: "unavailable", error: `${env.apiUrl}${path} — ${reason}` };
    }
  },
};
