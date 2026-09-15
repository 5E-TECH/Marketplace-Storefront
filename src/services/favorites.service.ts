import type { ID, Product } from "@/types/commerce";
import { apiRequest } from "@/lib/api";
import { validateFavoritesPageDto } from "@/generated/api-validators";
import { normalizeApiProduct } from "@/lib/normalize-product";
import type { FavoritesResponse } from "@/types/storefront-api";

const FAVORITES_PATH = "/favorites";
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const productsFrom = (response: FavoritesResponse): Product[] => {
  const root = object(response);
  const data = root.data ?? response;
  const container = object(data);
  const items = Array.isArray(data) ? data : Array.isArray(container.items) ? container.items : Array.isArray(container.favorites) ? container.favorites : [];
  return items.map((favorite) => normalizeApiProduct(object(favorite).product ?? favorite)).filter((product): product is Product => product !== null);
};

export const favoritesService = {
  async list(): Promise<Product[]> {
    const first = await apiRequest<FavoritesResponse>(FAVORITES_PATH, { params: { page: 1, limit: 100 }, validate: validateFavoritesPageDto });
    const remaining = first.totalPages > 1
      ? await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => apiRequest<FavoritesResponse>(FAVORITES_PATH, { params: { page: index + 2, limit: 100 }, validate: validateFavoritesPageDto })))
      : [];
    return [first, ...remaining].flatMap(productsFrom);
  },
  async check(productId: ID): Promise<boolean> {
    const raw = await apiRequest<unknown>(`${FAVORITES_PATH}/${encodeURIComponent(String(productId))}/check`);
    if (typeof raw === "boolean") return raw;
    const response = object(raw);
    if (typeof response.data === "boolean") return response.data;
    const data = object(response.data);
    return Boolean(response.isFavorite ?? response.favorite ?? response.exists ?? data.isFavorite ?? data.favorite ?? data.exists);
  },
  async add(productId: ID): Promise<void> { await apiRequest(`${FAVORITES_PATH}/${encodeURIComponent(String(productId))}`, { method: "POST" }); },
  async remove(productId: ID): Promise<void> { await apiRequest(`${FAVORITES_PATH}/${encodeURIComponent(String(productId))}`, { method: "DELETE" }); },
};
