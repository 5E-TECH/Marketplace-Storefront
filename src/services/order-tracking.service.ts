import { ApiError, apiRequest } from "@/lib/api";
import type { Order, OrderStatus } from "@/types/commerce";

export type TrackingStep = "received" | "preparing" | "on_the_way" | "delivered" | "cancelled" | "returned";
export type TrackedOrder = {
  id: string;
  rawStatus: string;
  status: OrderStatus;
  step: TrackingStep;
  estimatedDeliveryAt?: string;
  updatedAt?: string;
  trackingUrl?: string;
};

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const string = (...values: unknown[]): string | undefined => values.find((value) => typeof value === "string" && value.trim())?.toString().trim();
const safeDate = (...values: unknown[]): string | undefined => {
  const value = string(...values);
  return value && !Number.isNaN(new Date(value).getTime()) ? value : undefined;
};
const safeUrl = (...values: unknown[]): string | undefined => {
  const value = string(...values);
  if (!value) return undefined;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? value : undefined; }
  catch { return undefined; }
};
const identifier = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return String(value);
  }
  return undefined;
};

export function normalizeOrderStatus(value: unknown): Pick<TrackedOrder, "rawStatus" | "status" | "step"> {
  const rawStatus = typeof value === "string" ? value.trim().toUpperCase().replace(/[ -]+/g, "_") : "";
  if (["DELIVERED", "YETKAZILDI", "COMPLETED"].includes(rawStatus)) return { rawStatus, status: "Yetkazildi", step: "delivered" };
  if (["ON_THE_ROAD", "IN_TRANSIT", "OUT_FOR_DELIVERY", "YO'LDA", "YOLDA"].includes(rawStatus)) return { rawStatus, status: "Yo‘lda", step: "on_the_way" };
  if (["SHIPMENT_CREATED", "PROCESSING", "PREPARING", "PACKING", "YIG'ILMOQDA", "YIGILMOQDA"].includes(rawStatus)) return { rawStatus, status: "Tayyorlanmoqda", step: "preparing" };
  if (["CANCELLED", "CANCELED", "BEKOR_QILINDI"].includes(rawStatus)) return { rawStatus, status: "Bekor qilindi", step: "cancelled" };
  if (["RETURNED", "QAYTARILDI"].includes(rawStatus)) return { rawStatus, status: "Qaytarildi", step: "returned" };
  if (["PENDING", "CONFIRMED", "ACCEPTED", "NEW", "YANGI", "QABUL_QILINDI"].includes(rawStatus)) return { rawStatus, status: "Yangi", step: "received" };
  throw new ApiError(200, "Buyurtma holati backenddan noto‘g‘ri keldi", undefined, "invalid_response");
}

export function normalizeTrackedOrder(value: unknown, expectedId: string): TrackedOrder {
  const root = object(value);
  const order = Object.keys(object(root.order)).length ? object(root.order) : root;
  const shipment = object(root.shipment);
  const delivery = object(root.delivery);
  const id = identifier(order.orderNumber, order.salesOrderId, order.orderId, order.id, root.orderNumber, root.salesOrderId, root.orderId, root.id);
  if (!id || id !== expectedId) throw new ApiError(200, "Boshqa buyurtma ma’lumoti qaytdi", undefined, "invalid_response");
  const state = normalizeOrderStatus(string(shipment.status, delivery.status, order.deliveryStatus, order.status, root.deliveryStatus, root.status));
  return {
    id,
    ...state,
    estimatedDeliveryAt: safeDate(shipment.estimatedDeliveryAt, shipment.estimatedAt, delivery.estimatedDeliveryAt, order.estimatedDeliveryAt, order.deliveryDate, root.estimatedDeliveryAt),
    updatedAt: safeDate(shipment.updatedAt, delivery.updatedAt, order.updatedAt, root.updatedAt),
    trackingUrl: safeUrl(shipment.trackingUrl, delivery.trackingUrl, order.trackingUrl, root.trackingUrl),
  };
}

export function mergeTrackedOrder(order: Order, tracking: TrackedOrder): Order {
  return { ...order, status: tracking.status, estimatedDeliveryAt: tracking.estimatedDeliveryAt ?? order.estimatedDeliveryAt, updatedAt: tracking.updatedAt ?? order.updatedAt, trackingUrl: tracking.trackingUrl ?? order.trackingUrl };
}

export const orderTrackingService = {
  async get(orderId: string, signal?: AbortSignal): Promise<TrackedOrder> {
    const id = orderId.trim();
    if (!id || id.length > 100 || /[\u0000-\u001f\u007f]/.test(id)) throw new Error("Buyurtma raqamini to‘g‘ri kiriting.");
    const result = await apiRequest<unknown>(`/orders/${encodeURIComponent(id)}/tracking`, { signal });
    return normalizeTrackedOrder(result, id);
  },
};
