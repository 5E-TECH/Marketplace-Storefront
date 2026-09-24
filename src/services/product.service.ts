import { env } from "@/config/env";
import { ApiError, apiRequest } from "@/lib/api";
import { validateStorefrontProductDto } from "@/generated/api-validators";
import type { CatalogResult, Product, ProductQuery, ShopResult, StorefrontShop } from "@/types/commerce";
import type { StorefrontProductDto } from "@/types/storefront-api";
import { errorMessage } from "@/lib/errors";

const STOREFRONT_PRODUCTS_PATH = "/storefront/products";
const STOREFRONT_SHOPS_PATH = "/storefront/shops";

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
  // O'chirilgan variant savatchaga tushmasin — backend ularni ham qaytaradi.
  const rawVariants = Array.isArray(value.variants) ? value.variants.map(object).filter((variant) => variant.isActive !== false) : [];
  const variants = rawVariants.map((variant) => ({ id: id(variant.id), name: text(variant.name) || undefined, sku: text(variant.sku) || undefined, price: number(variant.price, raw.price), oldPrice: number(variant.oldPrice) || undefined, stock: typeof variant.stock === "number" ? variant.stock : undefined, color: text(variant.color, object(variant.attributes).color) || undefined, size: text(variant.size, object(variant.attributes).size) || undefined, image: imageUrl(variant.imageUrl) || (Array.isArray(variant.images) ? variant.images : []).map(imageUrl).find(Boolean), attributes: Object.fromEntries(Object.entries(object(variant.attributes)).filter((entry): entry is [string, string | number | boolean] => ["string", "number", "boolean"].includes(typeof entry[1]))) }));
  const variantImages = rawVariants.flatMap((variant) => [imageUrl(variant.imageUrl), ...(Array.isArray(variant.images) ? variant.images : []).map(imageUrl)]).filter(Boolean);
  const allImages = [...new Set([...images, ...variantImages])];
  const primaryImage = image === "/placeholder-product.svg" && allImages[0] ? allImages[0] : image;
  const colors = [...new Set([...(Array.isArray(raw.colors) ? raw.colors.map((color) => typeof color === "string" ? color : text(object(color).hex, object(color).value)) : []), ...rawVariants.map((variant) => text(variant.color, object(variant.attributes).color))].filter(Boolean))];
  const variantPrices = variants.map((variant) => variant.price).filter((price) => price > 0);
  const price = number(raw.price, raw.salePrice, raw.currentPrice) || (variantPrices.length ? Math.min(...variantPrices) : 0);
  return {
    id: id(raw.id, raw.productId),
    name: text(raw.name, raw.title),
    category: text(category.name, raw.categoryName, raw.category, "Mahsulot"),
    price,
    oldPrice: number(raw.oldPrice, raw.originalPrice, raw.compareAtPrice) || undefined,
    rating: number(raw.rating, raw.averageRating) || 0,
    reviews: number(raw.reviews, raw.reviewsCount, raw.reviewCount) || 0,
    image: primaryImage,
    images: [...new Set([primaryImage, ...allImages])],
    badge: text(raw.badge, raw.label) || undefined,
    description: text(raw.description, raw.shortDescription),
    colors,
    status: text(raw.status) || undefined,
    shop: shop.id !== undefined && shop.id !== null ? { id: id(shop.id), name: text(shop.name, "Do‘kon"), slug: text(shop.slug), logoUrl: imageUrl(shop.logoUrl) || undefined, status: text(shop.status) || undefined } : undefined,
    categoryInfo: category.id !== undefined && category.id !== null ? { id: id(category.id), name: text(category.name, "Mahsulot"), slug: text(category.slug) || undefined } : undefined,
    variants,
    createdAt: text(raw.createdAt) || undefined,
    updatedAt: text(raw.updatedAt) || undefined,
  };
};

export const normalizeShop = (value: unknown): StorefrontShop => {
  const shop = object(value);
  const shopId = id(shop.id);
  const name = text(shop.name);
  const slug = text(shop.slug);
  if (shopId === "" || !name || !slug) throw new Error("Backend do‘kon ma’lumotini noto‘g‘ri qaytardi");
  return { id: shopId, name, slug, description: text(shop.description) || undefined, logoUrl: imageUrl(shop.logoUrl) || undefined, bannerUrl: imageUrl(shop.bannerUrl) || undefined, address: text(shop.address) || undefined, rating: number(shop.rating), productCount: [shop.productCount, shop.productsCount, shop.totalProducts].some((value) => typeof value === "number") ? number(shop.productCount, shop.productsCount, shop.totalProducts) : undefined };
};

type ProductPage = { items: unknown[]; total?: unknown; page?: unknown; limit?: unknown; totalPages?: unknown };
const isProductPage = (value: unknown): value is ProductPage => Array.isArray(object(value).items);
const isShopPage = (value: unknown): value is { shop: unknown; products: ProductPage } => Boolean(object(value).shop) && isProductPage(object(value).products);

/**
 * Sahifa konverti tekshiriladi, mahsulotlar esa bittalab: sxemaga mos kelmagan
 * bitta yozuv butun katalogni bo'shatib qo'ymasin, faqat o'zi tushib qolsin.
 */
function toCatalog(result: ProductPage, page: number, limit: number): CatalogResult {
  const items = result.items.filter(validateStorefrontProductDto).map(normalizeProduct).filter((product) => product.id !== "" && product.name);
  const total = number(result.total, items.length);
  const responseLimit = Math.max(1, number(result.limit, limit));
  return { data: items, total, page: Math.max(1, number(result.page, page)), limit: responseLimit, totalPages: Math.max(0, number(result.totalPages, Math.ceil(total / responseLimit))), source: "api" };
}

const unavailable = (page: number, limit: number, error: unknown, fallback: string): CatalogResult => ({ data: [], total: 0, page, limit, totalPages: 0, source: "unavailable", error: errorMessage(error, fallback) });
const listParams = (query: Omit<ProductQuery, "categoryId">, page: number, limit: number) => ({ search: query.search, minPrice: query.minPrice, maxPrice: query.maxPrice, sort: query.sort, page, limit });

export const productService = {
  async featuredShops(): Promise<StorefrontShop[]> {
    if (!env.apiUrl) return [];
    try {
      // Ixtiyoriy blok: sekin javob butun bosh sahifani ushlab turmasin.
      const response = await apiRequest<unknown>(`${STOREFRONT_SHOPS_PATH}/featured`, { next: { revalidate: 30 }, timeoutMs: 3000 });
      const root = object(response);
      const items = Array.isArray(response) ? response : Array.isArray(root.items) ? root.items : Array.isArray(root.shops) ? root.shops : [];
      return items.flatMap((item) => { try { return [normalizeShop(item)]; } catch { return []; } });
    } catch {
      return [];
    }
  },
  async list(query: ProductQuery = {}): Promise<CatalogResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    if (!env.apiUrl) return { data: [], total: 0, page, limit, totalPages: 0, source: "unavailable", error: "API_URL sozlanmagan" };
    try {
      const response = await apiRequest(STOREFRONT_PRODUCTS_PATH, { params: { ...listParams(query, page, limit), categoryId: query.categoryId }, next: { revalidate: 30 }, validate: isProductPage });
      return toCatalog(response, page, limit);
    } catch (error) {
      return unavailable(page, limit, error, "Mahsulotlarni yuklab bo‘lmadi");
    }
  },
  async getById(id: string | number): Promise<Product | null> {
    if (!env.apiUrl) return null;
    try {
      const response = await apiRequest(`${STOREFRONT_PRODUCTS_PATH}/${encodeURIComponent(String(id))}`, { next: { revalidate: 30 }, validate: validateStorefrontProductDto });
      const product = normalizeProduct(response);
      return product.id !== "" && product.name ? product : null;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
      throw error;
    }
  },
  async listByShop(shopId: string | number, query: Omit<ProductQuery, "categoryId"> = {}): Promise<CatalogResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    if (!env.apiUrl) return { data: [], total: 0, page, limit, totalPages: 0, source: "unavailable", error: "API_URL sozlanmagan" };
    const path = `${STOREFRONT_SHOPS_PATH}/${encodeURIComponent(String(shopId))}/products`;
    try {
      return toCatalog(await apiRequest(path, { params: listParams(query, page, limit), next: { revalidate: 30 }, validate: isProductPage }), page, limit);
    } catch (error) {
      return unavailable(page, limit, error, "Do‘kon mahsulotlarini yuklab bo‘lmadi");
    }
  },
  async getShop(slug: string, query: Omit<ProductQuery, "categoryId"> = {}): Promise<ShopResult | null> {
    if (!slug.trim() || slug.length > 160) return null;
    if (!env.apiUrl) return null;
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const response = await apiRequest(`${STOREFRONT_SHOPS_PATH}/${encodeURIComponent(slug)}`, { params: listParams(query, page, limit), next: { revalidate: 30 }, validate: isShopPage });
      return { shop: normalizeShop(response.shop), catalog: toCatalog(response.products, page, limit) };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
