import { env } from "@/config/env";
import { mockProducts } from "@/data/mock-products";
import { validateStorefrontShopPageDto } from "@/generated/api-validators";
import { ApiError, apiRequest } from "@/lib/api";
import { normalizeProduct, productService } from "@/services/product.service";
import type { Shop, ShopPageResult } from "@/types/commerce";
import type { StorefrontShopPageResponse } from "@/types/storefront-api";

const normalizeShop = (shop: StorefrontShopPageResponse["shop"]): Shop => ({
  id: shop.id,
  name: shop.name,
  slug: shop.slug,
  logoUrl: shop.logoUrl ?? undefined,
  bannerUrl: shop.bannerUrl ?? undefined,
  description: typeof shop.description === "string" ? shop.description : undefined,
  status: shop.status,
  rating: shop.rating,
  ordersCount: shop.ordersCount,
});

export const shopService = {
  async getBySlug(slug: string): Promise<ShopPageResult | null> {
    if (env.useMockData) {
      const shop = mockProducts.find((product) => product.shop?.slug === slug)?.shop;
      if (!shop) return null;
      return { shop, products: await productService.listByShop(shop.id, { page: 1, limit: 20 }) };
    }
    if (!env.apiUrl) return null;
    try {
      const response = await apiRequest(`/storefront/shops/${encodeURIComponent(slug)}`, { next: { revalidate: 60 }, validate: validateStorefrontShopPageDto });
      const items = response.products.items.map(normalizeProduct);
      return { shop: normalizeShop(response.shop), products: { data: items, total: response.products.total, page: response.products.page, limit: response.products.limit, totalPages: response.products.totalPages, source: "api" } };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
