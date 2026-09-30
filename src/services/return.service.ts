import { apiRequest } from "@/lib/api";
import { authHeaders, hasAuthSession } from "@/lib/access-token";
import { validateBuyerOrdersPageDto, validateCreateReturnRequestsResultDto, validateReturnRequestDetailsDto, validateReturnRequestsPageDto } from "@/generated/api-validators";
import type { BuyerOrdersResponse, CreateReturnRequestDto, ReturnRequestDetailsDto, ReturnRequestDto, ReturnRequestsPageDto } from "@/types/storefront-api";

export type ReturnReason = CreateReturnRequestDto["reason"];
export type ReturnStatus = ReturnRequestDto["status"];
export type ReturnRequest = ReturnRequestDto;
export type ReturnRequestDetails = ReturnRequestDetailsDto;

/** Backend `reason` qiymatlari va xaridorga ko'rinadigan matni (C4.2). */
export const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: "DEFECTIVE", label: "Nuqsonli (brak)" },
  { value: "DAMAGED", label: "Yetkazishda shikastlangan" },
  { value: "INCOMPLETE", label: "To‘liq kelmagan" },
  { value: "WRONG_ITEM", label: "Boshqa tovar kelgan" },
  { value: "NOT_AS_DESCRIBED", label: "Tavsifga mos emas" },
  { value: "CHANGED_MIND", label: "Fikrimdan qaytdim" },
  { value: "OTHER", label: "Boshqa (izoh majburiy)" },
];
export const returnReasonLabel = (reason: ReturnReason): string => RETURN_REASONS.find((item) => item.value === reason)?.label.replace(" (izoh majburiy)", "") ?? reason;
export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  SUBMITTED: "Yuborildi",
  IN_REVIEW: "Ko‘rib chiqilmoqda",
  APPROVED: "Tasdiqlandi",
  REJECTED: "Rad etildi",
  REFUNDED: "Pul qaytarildi",
};
/** Holat bosqichlari: rad etilmagan so'rov shu yo'ldan boradi. */
const RETURN_STEPS: ReturnStatus[] = ["SUBMITTED", "IN_REVIEW", "APPROVED", "REFUNDED"];
/**
 * Xaridorga ko'rsatiladigan bosqichlar va joriy indeks. "Ko'rib chiqish" ixtiyoriy:
 * sotuvchi uni o'tkazib tasdiqlagan bo'lsa, bosqich umuman ko'rsatilmaydi (bo'lmagan narsa "o'tildi" deb chiqmasin).
 */
export function returnSteps(value: Pick<ReturnRequestDetailsDto, "status" | "history">): { steps: ReturnStatus[]; current: number } {
  const skippedReview = (value.status === "APPROVED" || value.status === "REFUNDED") && !value.history.some((entry) => entry.toStatus === "IN_REVIEW");
  const steps = RETURN_STEPS.filter((status) => !(skippedReview && status === "IN_REVIEW"));
  return { steps, current: steps.indexOf(value.status) };
}
export const MAX_RETURN_COMMENT = 500;
export const RETURN_LOGIN_REQUIRED = "Qaytarish so‘rovi uchun akkauntingizga kiring";

/** Qaytarish mumkin bo'lgan tovar: yetkazilgan posilkadan, faol so'rovlardagi miqdor ayirilgan. */
export type ReturnableItem = { orderItemId: string; productId: string; name: string; imageUrl?: string; unitPrice: number; quantity: number; available: number };
export type ReturnInput = { items: { orderItemId: string; quantity: number }[]; reason: ReturnReason; comment?: string };

const PAGE_LIMIT = 50;
const safeImage = (value: unknown): string | undefined => typeof value === "string" && /^https?:\/\//i.test(value) ? value : undefined;
const requireSession = () => { if (!hasAuthSession()) throw new Error(RETURN_LOGIN_REQUIRED); };
const validId = (value: string, label: string): string => {
  const id = value.trim();
  if (!id || id.length > 128) throw new Error(`${label} noto‘g‘ri`);
  return id;
};

async function allPages<T extends { items: unknown[]; totalPages: number }>(load: (page: number) => Promise<T>): Promise<T["items"]> {
  const first = await load(1);
  const rest = first.totalPages > 1 ? await Promise.all(Array.from({ length: first.totalPages - 1 }, (_, index) => load(index + 2))) : [];
  return [first, ...rest].flatMap((page) => page.items);
}

export const returnService = {
  /**
   * Buyurtma sahifasi uchun: qaytarish mumkin bo'lgan tovarlar va shu buyurtmaning so'rovlari.
   * `orderItemId` faqat `GET /orders` da bor; tovar faqat sotuvchi qismi `DELIVERED` bo'lsa
   * chiqadi. Rad etilmagan so'rovlardagi miqdor ayiriladi — qayta qaytarib bo'lmaydigan tovar
   * ko'rinmaydi. So'rovlar ro'yxati yuklanmasa ham tovarlar chiqadi (ortiqchasini backend rad etadi).
   */
  async forOrder(orderId: string): Promise<{ returnable: ReturnableItem[]; requests: ReturnRequest[] }> {
    if (!hasAuthSession()) return { returnable: [], requests: [] };
    const id = validId(orderId, "Buyurtma raqami");
    const [orders, allRequests] = await Promise.all([
      allPages((page) => apiRequest<BuyerOrdersResponse>("/orders", { method: "GET", headers: authHeaders(), params: { page, limit: 100 }, validate: validateBuyerOrdersPageDto })),
      allPages((page) => returnService.list({ page, limit: PAGE_LIMIT })).catch((): ReturnRequest[] => []),
    ]);
    const requests = allRequests.filter((request) => String(request.orderId) === id);
    const order = orders.find((item) => String(item.orderId) === id);
    if (!order) return { returnable: [], requests };
    const reserved = new Map<string, number>();
    for (const request of requests) {
      if (request.status === "REJECTED") continue;
      for (const item of request.items) reserved.set(item.orderItemId, (reserved.get(item.orderItemId) ?? 0) + item.quantity);
    }
    const returnable = order.items.flatMap((item) => {
      if (item.sellerOrderStatus !== "DELIVERED" || !item.id) return [];
      const available = item.quantity - (reserved.get(String(item.id)) ?? 0);
      return available > 0 ? [{ orderItemId: String(item.id), productId: String(item.productId), name: item.name, imageUrl: safeImage(item.imageUrl), unitPrice: item.unitPrice, quantity: item.quantity, available }] : [];
    });
    return { returnable, requests };
  },
  /** Turli do'kon tovarlari bo'lsa backend har posilka uchun alohida so'rov yaratadi — javob massiv. */
  async create(orderId: string, input: ReturnInput): Promise<ReturnRequest[]> {
    requireSession();
    const id = validId(orderId, "Buyurtma raqami");
    const items = input.items.filter((item) => item.quantity > 0);
    if (!items.length) throw new Error("Qaytariladigan tovarni tanlang");
    if (items.some((item) => !item.orderItemId.trim() || !Number.isSafeInteger(item.quantity))) throw new Error("Tovar miqdori noto‘g‘ri");
    if (!RETURN_REASONS.some((reason) => reason.value === input.reason)) throw new Error("Qaytarish sababini tanlang");
    const comment = input.comment?.trim() ?? "";
    if (input.reason === "OTHER" && !comment) throw new Error("“Boshqa” sababida izoh yozing");
    if (comment.length > MAX_RETURN_COMMENT) throw new Error(`Izoh ${MAX_RETURN_COMMENT} belgidan oshmasin`);
    const result = await apiRequest(`/orders/${encodeURIComponent(id)}/returns`, { method: "POST", headers: authHeaders(), body: { items, reason: input.reason, ...(comment ? { comment } : {}) }, validate: validateCreateReturnRequestsResultDto });
    return result.items;
  },
  async list(params: { status?: ReturnStatus; page?: number; limit?: number } = {}): Promise<ReturnRequestsPageDto> {
    requireSession();
    return apiRequest("/returns", { method: "GET", headers: authHeaders(), params: { page: params.page ?? 1, limit: params.limit ?? 20, status: params.status }, validate: validateReturnRequestsPageDto });
  },
  async get(returnId: string): Promise<ReturnRequestDetails> {
    requireSession();
    const detail = await apiRequest(`/returns/${encodeURIComponent(validId(returnId, "So‘rov raqami"))}`, { method: "GET", headers: authHeaders(), validate: validateReturnRequestDetailsDto });
    // Timeline yuqoridan pastga: eng eski holat birinchi.
    return { ...detail, history: [...detail.history].sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt)) };
  },
};
