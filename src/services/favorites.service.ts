import type { ID, Product } from "@/types/commerce";
import { browserApiRequest } from "@/lib/browser-api-client";
import { normalizeApiProduct } from "@/lib/normalize-product";

const FAVORITES_PATH = "/api/favorites";
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const productsFrom = (response: unknown): Product[] => {
  const root = object(response);
  const data = root.data ?? response;
  const container = object(data);
  const items = Array.isArray(data) ? data : Array.isArray(container.items) ? container.items : Array.isArray(container.favorites) ? container.favorites : [];
  return items.map(normalizeApiProduct).filter((product): product is Product => product !== null);
};

export const favoritesService = {
  async list(): Promise<Product[]> { return productsFrom(await browserApiRequest<unknown>(FAVORITES_PATH)); },
  async check(productId: ID): Promise<boolean> {
    const raw = await browserApiRequest<unknown>(`${FAVORITES_PATH}/${encodeURIComponent(String(productId))}/check`);
    if (typeof raw === "boolean") return raw;
    const response = object(raw);
    if (typeof response.data === "boolean") return response.data;
    const data = object(response.data);
    return Boolean(response.isFavorite ?? response.favorite ?? response.exists ?? data.isFavorite ?? data.favorite ?? data.exists);
  },
  async add(productId: ID): Promise<void> { await browserApiRequest(`${FAVORITES_PATH}/${encodeURIComponent(String(productId))}`, { method: "POST" }); },
  async remove(productId: ID): Promise<void> { await browserApiRequest(`${FAVORITES_PATH}/${encodeURIComponent(String(productId))}`, { method: "DELETE" }); },
};
