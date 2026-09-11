import type { components } from "@/generated/api-types";
import { ApiError, apiRequest } from "@/lib/api";

export type CheckoutAddress = components["schemas"]["CheckoutAddressDto"];
export type CheckoutPayload = components["schemas"]["CreateCheckoutDto"];
export type DeliveryQuote = { total: number; packages: { shopId?: string; fee: number }[] };

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const invalidResponse = (message: string) => new ApiError(200, message, undefined, "invalid_response");
const finiteFee = (value: unknown): number | undefined => {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return undefined;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
};

export const readOrderId = (value: unknown): string | null => {
  const record = object(value);
  for (const key of ["orderId", "id", "salesOrderId"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    if (typeof candidate === "number" && Number.isSafeInteger(candidate) && candidate > 0) return String(candidate);
  }
  return null;
};

// The contract does not yet describe preview/create responses. Narrow them here.
export const normalizeDeliveryQuote = (value: unknown): DeliveryQuote => {
  const record = object(value);
  const rows = [record.packages, record.deliveries, record.shipments, record.items, Array.isArray(value) ? value : undefined].find(Array.isArray) as unknown[] | undefined;
  const packages = (rows ?? []).map((row): DeliveryQuote["packages"][number] => {
    const item = object(row);
    const fee = [item.deliveryFee, item.deliveryPrice, item.fee, item.amount, item.price].map(finiteFee).find((candidate) => candidate !== undefined);
    if (fee === undefined) throw invalidResponse("Yetkazib berish narxi to‘liq kelmadi. Qayta hisoblang.");
    const shopId = item.shopId;
    return { shopId: typeof shopId === "string" || typeof shopId === "number" ? String(shopId) : undefined, fee };
  });
  const explicit = [record.totalDeliveryFee, record.deliveryFee, record.deliveryPrice, record.totalFee, record.total, record.amount].map(finiteFee).find((candidate) => candidate !== undefined);
  const sum = packages.reduce((total, item) => total + item.fee, 0);
  const total = explicit ?? (packages.length ? sum : undefined);
  if (total === undefined || !Number.isFinite(total)) throw invalidResponse("Yetkazib berish narxi kelmadi. Qayta hisoblang.");
  if (explicit !== undefined && packages.length && Math.abs(explicit - sum) > 0.01) throw invalidResponse("Yetkazib berish narxlari mos kelmadi. Qayta hisoblang.");
  return { total, packages };
};

export const checkoutErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "Buyurtmani yaratib bo‘lmadi";
  const code = error instanceof ApiError ? String(object(error.details).errorCode ?? object(error.details).code ?? "") : "";
  if (/stock|inventory|qoldiq|yetarli emas/i.test(`${code} ${message}`)) return "Mahsulot qoldig‘i yetarli emas. Savatdagi miqdorni tekshiring.";
  if (/address|region|district|manzil|viloyat|tuman/i.test(`${code} ${message}`)) return "Yetkazib berish manzili noto‘g‘ri. Viloyat, tuman va ko‘chani tekshiring.";
  if (error instanceof ApiError && error.status === 401) return "Sessiya muddati tugagan. Qayta kiring yoki profildan chiqib, mehmon sifatida davom eting.";
  if (error instanceof ApiError && (["network", "timeout"].includes(error.kind) || error.status >= 500)) return "Server javobi olinmadi. Internetni tekshirib, qayta urinib ko‘ring.";
  return message;
};

export const checkoutService = {
  async preview(address: CheckoutAddress, signal?: AbortSignal): Promise<DeliveryQuote> {
    const result = await apiRequest<unknown>("/checkout/delivery-preview", { method: "POST", body: { address }, signal });
    return normalizeDeliveryQuote(result);
  },
  async create(payload: CheckoutPayload, idempotencyKey: string): Promise<string> {
    if (!idempotencyKey.trim()) throw new Error("Buyurtmani qayta ochib urinib ko‘ring.");
    const result = await apiRequest<unknown>("/checkout", { method: "POST", body: payload, headers: { "Idempotency-Key": idempotencyKey } });
    const orderId = readOrderId(result);
    if (!orderId) throw invalidResponse("Buyurtma raqami olinmadi. Shu buyurtmani qayta tekshiring.");
    return orderId;
  },
  async confirm(orderId: string): Promise<void> {
    await apiRequest(`/checkout/${encodeURIComponent(orderId)}/confirm`, { method: "POST" });
  },
};
