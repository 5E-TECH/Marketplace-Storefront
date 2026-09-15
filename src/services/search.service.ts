import { apiRequest } from "@/lib/api";
import type { ID } from "@/types/commerce";

export type SearchSuggestion = { id: ID; name: string; shopName?: string; price: number; image?: string };

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const optionalText = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;

const normalizeSuggestions = (value: unknown): SearchSuggestion[] => {
  const root = object(value);
  if (!Array.isArray(root.items)) throw new Error("Backend qidiruv takliflarini noto‘g‘ri qaytardi");
  return root.items.flatMap((raw) => {
    const item = object(raw);
    const id = item.productId ?? item.id;
    const name = optionalText(item.title ?? item.name);
    const price = Number(item.price);
    if ((typeof id !== "string" && typeof id !== "number") || !name || !Number.isFinite(price) || price < 0) return [];
    return [{ id, name, shopName: optionalText(item.shopName), price, image: optionalText(item.imageUrl) }];
  });
};

export const searchService = {
  async suggest(query: string, signal?: AbortSignal): Promise<SearchSuggestion[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    return normalizeSuggestions(await apiRequest("/storefront/search", { params: { q, page: 1, limit: 6 }, signal }));
  },
};
