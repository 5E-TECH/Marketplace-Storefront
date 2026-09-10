import type { components } from "@/generated/api-types";
import { apiRequest } from "@/lib/api";

export type CheckoutAddress = components["schemas"]["CheckoutAddressDto"];
export type CheckoutPayload = components["schemas"]["CreateCheckoutDto"];
export type DeliveryQuote = { total: number; packages: { shopId?: string; fee: number }[] };

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const finiteFee = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : typeof value === "string" && value.trim() && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;

export const readOrderId = (value: unknown): string | null => {
  const record = object(value);
  for (const key of ["orderId", "id", "salesOrderId"]) {
    const candidate = record[key];
    if (typeof candidate === "string" || typeof candidate === "number") return String(candidate);
  }
  return null;
};

export const normalizeDeliveryQuote = (value: unknown): DeliveryQuote => {
  const record = object(value);
  const rows = [record.packages, record.deliveries, record.shipments, record.items, Array.isArray(value) ? value : undefined].find(Array.isArray) as unknown[] | undefined;
  const packages = (rows ?? []).map((row) => {
    const item = object(row);
    const fee = [item.deliveryFee, item.deliveryPrice, item.fee, item.amount, item.price].map(finiteFee).find((candidate) => candidate !== null);
    const shopId = item.shopId;
    return fee === undefined || fee === null ? null : { shopId: typeof shopId === "string" || typeof shopId === "number" ? String(shopId) : undefined, fee };
  }).filter((row): row is { shopId?: string; fee: number } => row !== null);
  const explicit = [record.totalDeliveryFee, record.deliveryFee, record.deliveryPrice, record.totalFee, record.total, record.amount].map(finiteFee).find((candidate) => candidate !== null);
  const total = explicit ?? (packages.length ? packages.reduce((sum, item) => sum + item.fee, 0) : null);
  if (total === null) throw new Error("Backend yetkazib berish narxini qaytarmadi");
  return { total, packages };
};

export const checkoutErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "Buyurtmani yaratib bo‘lmadi";
  if (/stock|inventory|qoldiq|yetarli emas/i.test(message)) return "Mahsulot qoldig‘i yetarli emas. Savatdagi miqdorni tekshiring.";
  if (/address|region|district|manzil|viloyat|tuman/i.test(message)) return "Yetkazib berish manzili noto‘g‘ri. Viloyat, tuman va ko‘chani tekshiring.";
  if (/internet|aloqa|network|timeout|vaqti tugadi|server javob/i.test(message)) return "Server bilan aloqa bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.";
  return message;
};

export const checkoutService = {
  async preview(address: CheckoutAddress, signal?: AbortSignal): Promise<DeliveryQuote> {
    const result = await apiRequest<unknown>("/checkout/delivery-preview", { method: "POST", body: { address }, signal });
    return normalizeDeliveryQuote(result);
  },
  async create(payload: CheckoutPayload, idempotencyKey: string): Promise<string> {
    const result = await apiRequest<unknown>("/checkout", { method: "POST", body: payload, headers: { "Idempotency-Key": idempotencyKey } });
    const orderId = readOrderId(result);
    if (!orderId) throw new Error("Backend buyurtma raqamini qaytarmadi");
    return orderId;
  },
  async confirm(orderId: string): Promise<void> {
    await apiRequest(`/checkout/${encodeURIComponent(orderId)}/confirm`, { method: "POST" });
  },
  async place(payload: CheckoutPayload, idempotencyKey: string): Promise<string> {
    const orderId = await this.create(payload, idempotencyKey);
    await this.confirm(orderId);
    return orderId;
  },
};
