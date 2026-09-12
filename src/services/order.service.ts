import { apiRequest } from "@/lib/api";
import type { CheckoutAddress, DeliveryPreview, Order, OrderStatus, OrderTracking, TrackingPackage } from "@/types/commerce";
import { cartService } from "./cart.service";

const STORAGE_KEY = "elchi_orders_v1";
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const money = (value: unknown, field: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Backend ${field} qiymatini noto‘g‘ri qaytardi`);
  return parsed;
};

const readLocal = (): Order[] => {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value as Order[] : [];
  } catch { return []; }
};

const validateAddress = (address: CheckoutAddress): void => {
  if (address.recipientName.trim().length < 2) throw new Error("Qabul qiluvchi ismini to‘liq kiriting");
  if (!/^\+998\d{9}$/.test(address.phone)) throw new Error("Telefon raqamini +998XXXXXXXXX formatida kiriting");
  if (!address.regionId.trim()) throw new Error("Viloyatni tanlang");
  if (!address.districtId.trim()) throw new Error("Tumanni tanlang");
  if (address.address.trim().length < 5) throw new Error("Ko‘cha, uy va xonadonni to‘liq kiriting");
};

const normalizePreview = (response: unknown): DeliveryPreview => {
  const data = object(response);
  return {
    subtotal: money(data.subtotal, "subtotal"),
    deliveryFee: money(data.deliveryFee, "deliveryFee"),
    totalAmount: money(data.totalAmount, "totalAmount"),
    packages: Array.isArray(data.packages) ? data.packages.map(object) : [],
  };
};

const orderIdFrom = (response: unknown): string => {
  const root = object(response);
  const order = object(root.order ?? root.salesOrder);
  const value = root.orderId ?? root.salesOrderId ?? root.id ?? order.id;
  if ((typeof value !== "string" && typeof value !== "number") || !String(value).trim()) throw new Error("Backend buyurtma raqamini qaytarmadi");
  return String(value);
};

const statusMap: Record<string, OrderStatus> = {
  NEW: "Qabul qilindi", PENDING: "Qabul qilindi", CREATED: "Qabul qilindi", CONFIRMED: "Qabul qilindi", ACCEPTED: "Qabul qilindi",
  PROCESSING: "Yig‘ilmoqda", PREPARING: "Yig‘ilmoqda", PACKING: "Yig‘ilmoqda", ASSEMBLING: "Yig‘ilmoqda", SHIPMENT_CREATED: "Yig‘ilmoqda", READY_FOR_PICKUP: "Yig‘ilmoqda",
  IN_TRANSIT: "Yo‘lda", ON_THE_ROAD: "Yo‘lda", SHIPPING: "Yo‘lda", OUT_FOR_DELIVERY: "Yo‘lda",
  DELIVERED: "Yetkazildi", COMPLETED: "Yetkazildi",
  CANCELLED: "Bekor qilindi", CANCELED: "Bekor qilindi", REJECTED: "Bekor qilindi",
  RETURNED: "Qaytarildi", REFUNDED: "Qaytarildi",
};
export const normalizeOrderStatus = (value: unknown): OrderStatus => {
  const key = typeof value === "string" ? value.trim().toUpperCase().replace(/[\s-]+/g, "_") : "";
  return statusMap[key] ?? "Qabul qilindi";
};
const optionalText = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
const safeHttpUrl = (value: unknown): string | undefined => {
  const text = optionalText(value);
  if (!text) return undefined;
  try { return ["http:", "https:"].includes(new URL(text).protocol) ? text : undefined; }
  catch { return undefined; }
};
const normalizeTracking = (response: unknown, requestedId: string): OrderTracking => {
  const root = object(response);
  const order = object(root.order ?? root.salesOrder);
  const shipmentValues = root.packages ?? root.shipments ?? order.packages ?? order.shipments;
  const packages: TrackingPackage[] = Array.isArray(shipmentValues) ? shipmentValues.map((value, index) => {
    const item = object(value);
    return {
      id: String(item.id ?? item.shipmentId ?? item.packageId ?? index + 1),
      shopId: typeof item.shopId === "string" || typeof item.shopId === "number" ? item.shopId : undefined,
      shopName: optionalText(item.shopName ?? object(item.shop).name),
      status: normalizeOrderStatus(item.deliveryStatus ?? item.shipmentStatus ?? item.status),
      trackingUrl: safeHttpUrl(item.trackingUrl),
      updatedAt: optionalText(item.updatedAt),
    };
  }) : [];
  const rawId = root.orderId ?? root.salesOrderId ?? root.id ?? order.id;
  const id = typeof rawId === "string" || typeof rawId === "number" ? String(rawId) : requestedId;
  const rawStatus = root.deliveryStatus ?? root.orderStatus ?? root.status ?? order.status;
  return {
    orderId: id,
    status: rawStatus === undefined && packages[0] ? packages[0].status : normalizeOrderStatus(rawStatus),
    estimatedDeliveryAt: optionalText(root.estimatedDeliveryAt ?? root.estimatedDeliveryDate ?? order.estimatedDeliveryAt),
    updatedAt: optionalText(root.updatedAt ?? order.updatedAt),
    packages,
  };
};

const previewDelivery = async (address: CheckoutAddress): Promise<DeliveryPreview> => {
  validateAddress(address);
  return normalizePreview(await apiRequest("/checkout/delivery-preview", { method: "POST", body: { address } }));
};

export const orderService = {
  async list(): Promise<Order[]> { return readLocal(); },
  async getLocal(orderId: string): Promise<Order | null> { return readLocal().find((order) => order.id === orderId) ?? null; },
  async track(orderId: string): Promise<OrderTracking> {
    const id = orderId.trim();
    if (!id || id.length > 128) throw new Error("Buyurtma raqami noto‘g‘ri");
    return normalizeTracking(await apiRequest(`/orders/${encodeURIComponent(id)}/tracking`, { method: "GET" }), id);
  },
  preview: previewDelivery,
  async create(address: CheckoutAddress, idempotencyKey: string, preview?: DeliveryPreview): Promise<Order> {
    validateAddress(address);
    if (!idempotencyKey || idempotencyKey.length > 128) throw new Error("Buyurtma kaliti noto‘g‘ri");
    const cart = await cartService.get();
    if (!cart.items.length) throw new Error("Savatcha bo‘sh");
    const delivery = preview ?? await previewDelivery(address);
    const created = await apiRequest<unknown>("/checkout", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: { paymentMethod: "cod", address } });
    const id = orderIdFrom(created);
    await apiRequest(`/checkout/${encodeURIComponent(id)}/confirm`, { method: "POST" });
    const order: Order = { id, createdAt: new Date().toISOString(), status: "Qabul qilindi", customer: { name: address.recipientName, phone: address.phone, address: address.address }, items: cart.items, subtotal: delivery.subtotal, delivery: delivery.deliveryFee, total: delivery.totalAmount, payment: "cash" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readLocal().filter((item) => item.id !== id)]));
    try { await cartService.clear(cart); }
    catch { order.warning = "Buyurtma yaratildi, lekin savatchani tozalab bo‘lmadi. Buyurtmani qayta yubormang."; }
    return order;
  },
};
