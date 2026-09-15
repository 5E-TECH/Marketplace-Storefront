import { validateBuyerOrdersPageDto } from "@/generated/api-validators";
import { env } from "@/config/env";
import { apiRequest } from "@/lib/api";
import { authHeaders, getAccessToken } from "@/lib/access-token";
import type { ProductReview, ProductReviewsResult, ReviewableOrderItem } from "@/types/commerce";
import type { BuyerOrdersResponse } from "@/types/storefront-api";

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const integer = (value: unknown, minimum: number, field: string): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < minimum) throw new Error(`Backend ${field} qiymatini noto‘g‘ri qaytardi`);
  return parsed;
};
const rating = (value: unknown): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) throw new Error("Backend reyting qiymatini noto‘g‘ri qaytardi");
  return parsed;
};
const text = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;

export const normalizeReviews = (response: unknown): ProductReviewsResult => {
  const root = object(response);
  if (!Array.isArray(root.items)) throw new Error("Backend sharhlar ro‘yxatini noto‘g‘ri qaytardi");
  const page = integer(root.page, 1, "sharhlar sahifasi");
  const limit = integer(root.limit, 1, "sharhlar limiti");
  const total = integer(root.total, 0, "sharhlar soni");
  const totalPages = integer(root.totalPages, 0, "sharhlar sahifalari soni");
  const items = root.items.map((value, index): ProductReview => {
    const item = object(value);
    const author = object(item.author ?? item.user ?? item.buyer);
    const id = item.id;
    const createdAt = text(item.createdAt);
    if ((typeof id !== "string" && typeof id !== "number") || !createdAt) throw new Error(`Backend ${index + 1}-sharhni noto‘g‘ri qaytardi`);
    return { id: String(id), rating: rating(item.rating), comment: text(item.comment), createdAt, authorName: text(item.authorName ?? item.buyerName ?? author.name) ?? "Xaridor" };
  });
  if (items.length > limit || items.length > total || (total === 0 && items.length)) throw new Error("Backend sharhlar sahifalash ma’lumotini noto‘g‘ri qaytardi");
  return { items, rating: rating(root.rating ?? root.averageRating), total, page, limit, totalPages };
};

export const reviewService = {
  async list(productId: string | number, page = 1, limit = 5): Promise<ProductReviewsResult> {
    if (env.useMockData && String(productId).startsWith("demo-")) {
      const items: ProductReview[] = String(productId) === "demo-headphones" ? [
        { id: "demo-review-1", rating: 5, comment: "Ovozi tiniq, quvvatni uzoq ushlaydi.", createdAt: "2026-09-10T09:00:00.000Z", authorName: "Aziza" },
        { id: "demo-review-2", rating: 4, comment: "Quloqqa qulay joylashdi.", createdAt: "2026-09-08T12:00:00.000Z", authorName: "Sardor" },
      ] : [];
      return { items, rating: items.length ? 4.5 : 0, total: items.length, page, limit, totalPages: items.length ? 1 : 0 };
    }
    return normalizeReviews(await apiRequest(`/storefront/products/${encodeURIComponent(String(productId))}/reviews`, { method: "GET", params: { page, limit } }));
  },
  async create(productId: string | number, input: { orderItemId: string; rating: number; comment?: string }, demo = false): Promise<void> {
    const orderItemId = input.orderItemId.trim();
    const comment = input.comment?.trim();
    if (!orderItemId || orderItemId.length > 128) throw new Error("Buyurtma mahsuloti noto‘g‘ri");
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error("1 dan 5 gacha baho tanlang");
    if (demo) return;
    await apiRequest(`/storefront/products/${encodeURIComponent(String(productId))}/reviews`, { method: "POST", headers: authHeaders(), body: { orderItemId, rating: input.rating, ...(comment ? { comment } : {}) } });
  },
  async reviewableItems(productId: string | number, demo = false): Promise<ReviewableOrderItem[]> {
    if (!getAccessToken()) return [];
    if (demo) return [{ orderItemId: "demo-order-item", orderId: "demo-delivered-order" }];
    const first = await apiRequest<BuyerOrdersResponse>("/orders", { method: "GET", headers: authHeaders(), params: { page: 1, limit: 100 }, validate: validateBuyerOrdersPageDto });
    const pages = first.totalPages > 1 ? await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => apiRequest<BuyerOrdersResponse>("/orders", { method: "GET", headers: authHeaders(), params: { page: index + 2, limit: 100 }, validate: validateBuyerOrdersPageDto }))) : [];
    return [first, ...pages].flatMap((page) => page.items).flatMap((order) => {
      if (!["DELIVERED", "COMPLETED"].includes(order.orderStatus.trim().toUpperCase().replace(/[\s-]+/g, "_"))) return [];
      return order.items.flatMap((item) => item.id && String(item.productId) === String(productId) ? [{ orderItemId: item.id, orderId: order.orderId }] : []);
    });
  },
};
