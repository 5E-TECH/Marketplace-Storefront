import { apiRequest } from "@/lib/api";
import { authHeaders, getAccessToken } from "@/lib/access-token";
import { validateBuyerOrdersPageDto } from "@/generated/api-validators";
import type { CheckoutAddress, DeliveryPreview, Order, OrderStatus, OrderTracking, PaymentMethod, PaymentProvider, PaymentStatus, TrackingPackage, TrackingPayment } from "@/types/commerce";
import type { BuyerOrdersResponse } from "@/types/storefront-api";
import { cartService } from "./cart.service";
import { errorMessage } from "@/lib/errors";

const STORAGE_KEY = "elchi_orders_v1";

/** To'lov sahifasini ochib bo'lmaganda sabab: xaridorga nima qilishini aniq aytish uchun. */
export type PaymentStartFailure = "not_configured" | "unauthorized" | "failed";
export class PaymentStartError extends Error {
  constructor(readonly reason: PaymentStartFailure, message: string) { super(message); this.name = "PaymentStartError"; }
}
const PAYMENT_START_MESSAGES: Record<PaymentStartFailure, string> = {
  not_configured: "Online to‘lov hozircha ishga tushirilmagan. Buyurtmangiz saqlandi — keyinroq buyurtma sahifasidan to‘lashingiz mumkin.",
  unauthorized: "Online to‘lash uchun akkauntingizga kiring. Buyurtmangiz saqlandi.",
  failed: "To‘lov sahifasini hozir ochib bo‘lmadi. Buyurtmangiz saqlandi — birozdan keyin qayta urinib ko‘ring yoki buyurtma sahifasidan to‘lang.",
};
export const paymentStartMessage = (error: unknown): string => error instanceof PaymentStartError ? error.message : PAYMENT_START_MESSAGES.failed;
const paymentStartError = (reason: PaymentStartFailure) => new PaymentStartError(reason, PAYMENT_START_MESSAGES[reason]);
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

const saveLocal = (order: Order): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readLocal().filter((item) => item.id !== order.id)]));
};

const validateAddress = (address: CheckoutAddress): void => {
  if (address.recipientName.trim().length < 2) throw new Error("Qabul qiluvchi ismini to‘liq kiriting");
  if (!/^\+998\d{9}$/.test(address.phone)) throw new Error("Telefon raqamini +998XXXXXXXXX formatida kiriting");
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

// Backend enumlari: SalesOrder (DRAFT…REFUNDED), sotuvchi qismi (PENDING…RETURNED) va Elchi tracking holatlari.
const statusMap: Record<string, OrderStatus> = {
  DRAFT: "Qabul qilindi", PENDING_PAYMENT: "Qabul qilindi", PAID: "Qabul qilindi", PENDING: "Qabul qilindi", CONFIRMED: "Qabul qilindi",
  SHIPMENT_CREATED: "Yig‘ilmoqda",
  RECEIVED: "Yo‘lda", ON_THE_ROAD: "Yo‘lda", IN_TRANSIT: "Yo‘lda", OUT_FOR_DELIVERY: "Yo‘lda", PARTIALLY_FULFILLED: "Yo‘lda",
  DELIVERED: "Yetkazildi", FULFILLED: "Yetkazildi", COMPLETED: "Yetkazildi",
  CANCELLED: "Bekor qilindi",
  RETURNED: "Qaytarildi", REFUNDED: "Qaytarildi",
};
export const normalizeOrderStatus = (value: unknown): OrderStatus => {
  const key = typeof value === "string" ? value.trim().toUpperCase().replace(/[\s-]+/g, "_") : "";
  return statusMap[key] ?? "Qabul qilindi";
};
/** Bekor qilingan yoki qaytarilgan buyurtmani qayta to'lab bo'lmaydi (masalan, admin bekor qilgan). */
export const isClosedOrder = (status: OrderStatus | undefined): boolean => status === "Bekor qilindi" || status === "Qaytarildi";
const optionalText = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
const safeHttpUrl = (value: unknown): string | undefined => {
  const text = optionalText(value);
  if (!text) return undefined;
  try { return ["http:", "https:"].includes(new URL(text).protocol) ? text : undefined; }
  catch { return undefined; }
};
const normalizeBuyerOrder = (value: unknown, index: number): Order => {
  const item = object(value);
  const idValue = item.orderId ?? item.id;
  const id = typeof idValue === "string" || typeof idValue === "number" ? String(idValue) : "";
  const createdAt = optionalText(item.createdAt);
  const rawItems = item.items;
  if (!id || !createdAt || !Array.isArray(rawItems)) throw new Error(`Backend ${index + 1}-buyurtmani noto‘g‘ri qaytardi`);
  const items = rawItems.map((raw, itemIndex) => {
    const line = object(raw);
    const product = object(line.product);
    const productId = line.productId ?? product.id;
    const name = optionalText(line.name ?? line.productName ?? product.name);
    const quantity = Number(line.quantity);
    const unitPrice = money(line.unitPrice ?? line.price ?? line.unitPriceSnapshot, "buyurtma narxi");
    if ((typeof productId !== "string" && typeof productId !== "number") || !name || !Number.isSafeInteger(quantity) || quantity < 1) throw new Error(`Backend ${id} buyurtma mahsulotini noto‘g‘ri qaytardi`);
    return {
      id: String(line.id ?? `${id}:${productId}:${itemIndex}`), productId, variantId: typeof line.variantId === "string" || typeof line.variantId === "number" ? line.variantId : undefined,
      shopId: typeof line.shopId === "string" || typeof line.shopId === "number" ? line.shopId : "unknown", quantity, color: "",
      product: { id: productId, name, category: "", price: unitPrice, rating: 0, reviews: 0, image: safeHttpUrl(line.imageUrl ?? product.imageUrl) ?? "/placeholder-product.svg", images: [], description: "", colors: [] },
    };
  });
  const paymentData = object(item.payment);
  const paymentMethod = String(item.paymentMethod ?? paymentData.provider ?? "").toUpperCase();
  const rawPaymentStatus = String(item.paymentStatus ?? paymentData.status ?? "").toUpperCase();
  const provider = String(item.paymentProvider ?? paymentData.provider ?? paymentMethod).toUpperCase();
  const online = paymentMethod === "ONLINE" || paymentMethod === "PAYME" || paymentMethod === "CLICK";
  const paymentStatus = ["PENDING", "PAID", "CANCELLED", "FAILED", "REFUNDED"].includes(rawPaymentStatus) ? rawPaymentStatus as PaymentStatus : online ? "PENDING" : undefined;
  return {
    id, createdAt, status: normalizeOrderStatus(item.orderStatus ?? item.status),
    customer: { name: "", phone: "", address: "" }, items,
    subtotal: money(item.subtotal, "subtotal"), delivery: money(item.deliveryFee ?? item.delivery, "deliveryFee"), total: money(item.totalAmount ?? item.total, "totalAmount"), payment: online ? "card" : "cash",
    // Kontraktda paymentMethod faqat "online" | "cod"; provayder alohida maydonda keladi.
    paymentProvider: provider === "PAYME" || provider === "CLICK" ? provider : undefined,
    paymentStatus,
  };
};

const remoteOrders = async (): Promise<Order[]> => {
  const page = await apiRequest<BuyerOrdersResponse>("/orders", { method: "GET", headers: authHeaders(), params: { page: 1, limit: 20 }, validate: validateBuyerOrdersPageDto });
  return page.items.map(normalizeBuyerOrder);
};
/** Tracking javobidagi to'lov holati. Buyurtma sahifasi uni brauzer nusxasidan ustun qo'yadi. */
const normalizeTrackingPayment = (root: Record<string, unknown>): TrackingPayment | undefined => {
  const payment = object(root.payment);
  const rawStatus = String(root.paymentStatus ?? payment.status ?? "").toUpperCase();
  if (!["PENDING", "PAID", "CANCELLED", "FAILED", "REFUNDED"].includes(rawStatus)) return undefined;
  const providerValue = root.paymentProvider ?? payment.provider;
  const amount = Number(payment.amount);
  return {
    status: rawStatus as PaymentStatus,
    provider: providerValue === "PAYME" || providerValue === "CLICK" ? providerValue : undefined,
    amount: Number.isFinite(amount) && amount >= 0 ? amount : undefined,
    failureReason: optionalText(root.paymentFailureReason ?? payment.failureReason ?? payment.reason ?? payment.message),
  };
};

const normalizeTracking = (response: unknown): OrderTracking => {
  const root = object(response);
  const order = object(root.order ?? root.salesOrder);
  const shipmentValues = root.packages ?? root.shipments ?? order.packages ?? order.shipments;
  const rawId = root.orderId ?? root.salesOrderId ?? root.id ?? order.id;
  const rawStatus = root.deliveryStatus ?? root.orderStatus ?? root.status ?? order.status;
  if ((typeof rawId !== "string" && typeof rawId !== "number") || !String(rawId).trim() || typeof rawStatus !== "string" || !Array.isArray(shipmentValues)) {
    throw new Error("Backend tracking javobini noto‘g‘ri qaytardi");
  }
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
  const id = String(rawId);
  return {
    orderId: id,
    status: rawStatus === undefined && packages[0] ? packages[0].status : normalizeOrderStatus(rawStatus),
    estimatedDeliveryAt: optionalText(root.estimatedDeliveryAt ?? root.estimatedDeliveryDate ?? order.estimatedDeliveryAt),
    updatedAt: optionalText(root.updatedAt ?? order.updatedAt),
    packages,
    payment: normalizeTrackingPayment(root),
  };
};

const previewDelivery = async (address: CheckoutAddress): Promise<DeliveryPreview> => {
  validateAddress(address);
  return normalizePreview(await apiRequest("/checkout/delivery-preview", { method: "POST", body: { address } }));
};

export const orderService = {
  async list(): Promise<Order[]> { return readLocal(); },
  async listForCurrentBuyer(): Promise<{ orders: Order[]; error?: string }> {
    const local = readLocal();
    if (!getAccessToken()) return { orders: local };
    try {
      const remote = await remoteOrders();
      return { orders: [...remote, ...local.filter((saved) => !remote.some((order) => order.id === saved.id))] };
    } catch (error) {
      return { orders: local, error: errorMessage(error, "Buyurtmalarni backenddan yuklab bo‘lmadi") };
    }
  },
  async getLocal(orderId: string): Promise<Order | null> { return readLocal().find((order) => order.id === orderId) ?? null; },
  /** To'lov sahifasidan orqaga qaytilganda checkout bo'sh savat emas, shu buyurtmani ko'rsatishi uchun. */
  async lastUnpaidOnline(maxAgeMs = 60 * 60 * 1000): Promise<Order | null> {
    const since = Date.now() - maxAgeMs;
    const unpaid = (order: Order) => order.payment === "card" && !["PAID", "REFUNDED"].includes(order.paymentStatus ?? "") && !isClosedOrder(order.status);
    const candidate = readLocal().find((order) => unpaid(order) && Date.parse(order.createdAt) >= since);
    if (!candidate) return null;
    // Brauzer nusxasi eskirgan bo'lishi mumkin (admin bekor qilgan, boshqa oynada to'langan) — backenddan tekshiramiz.
    try {
      const tracking = await orderService.track(candidate.id);
      const current = { ...candidate, status: tracking.status, paymentStatus: tracking.payment?.status ?? candidate.paymentStatus };
      return unpaid(current) ? current : null;
    } catch { return candidate; }
  },
  /** Buyurtmani avval brauzer nusxasidan, topilmasa backend ro'yxatidan qidiradi: boshqa qurilmada ham "Qayta to'lash" ishlashi uchun. */
  async find(orderId: string): Promise<Order | null> {
    const saved = readLocal().find((order) => order.id === orderId);
    if (saved || !getAccessToken()) return saved ?? null;
    try { return (await remoteOrders()).find((order) => order.id === orderId) ?? null; }
    catch { return null; }
  },
  async track(orderId: string): Promise<OrderTracking> {
    const id = orderId.trim();
    if (!id || id.length > 128) throw new Error("Buyurtma raqami noto‘g‘ri");
    const tracking = normalizeTracking(await apiRequest(`/orders/${encodeURIComponent(id)}/tracking`, { method: "GET", headers: authHeaders() }));
    if (typeof window !== "undefined") {
      const orders = readLocal();
      const index = orders.findIndex((order) => order.id === id);
      if (index >= 0) {
        orders[index] = { ...orders[index], status: tracking.status, ...(tracking.payment ? { paymentStatus: tracking.payment.status, paymentProvider: tracking.payment.provider ?? orders[index].paymentProvider } : {}) };
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch { /* Tracking remains usable if storage is unavailable. */ }
      }
    }
    return tracking;
  },
  preview: previewDelivery,
  async create(address: CheckoutAddress, idempotencyKey: string, preview?: DeliveryPreview, paymentMethod: PaymentMethod = "cod"): Promise<Order> {
    validateAddress(address);
    if (!idempotencyKey || idempotencyKey.length > 128) throw new Error("Buyurtma kaliti noto‘g‘ri");
    const cart = await cartService.get();
    if (!cart.items.length) throw new Error("Savatcha bo‘sh");
    const delivery = preview ?? await previewDelivery(address);
    const online = paymentMethod !== "cod";
    const created = await apiRequest<unknown>("/checkout", { method: "POST", headers: { "Idempotency-Key": idempotencyKey }, body: { paymentMethod: online ? "online" : "cod", address } });
    const id = orderIdFrom(created);
    if (!online) await apiRequest(`/checkout/${encodeURIComponent(id)}/confirm`, { method: "POST" });
    const order: Order = { id, createdAt: new Date().toISOString(), status: "Qabul qilindi", customer: { name: address.recipientName, phone: address.phone, address: address.address }, items: cart.items, subtotal: delivery.subtotal, delivery: delivery.deliveryFee, total: delivery.totalAmount, payment: online ? "card" : "cash", paymentProvider: paymentMethod === "payme" ? "PAYME" : paymentMethod === "click" ? "CLICK" : undefined, paymentStatus: online ? "PENDING" : undefined };
    try { saveLocal(order); }
    catch { order.warning = `Buyurtma qabul qilindi. Brauzerda saqlab bo‘lmadi; buyurtma raqamini yozib oling: ${id}.`; }
    try { await cartService.clear(cart); }
    catch { order.warning = [order.warning, "Buyurtma yaratildi, lekin savatchani tozalab bo‘lmadi. Buyurtmani qayta yubormang."].filter(Boolean).join(" "); }
    return order;
  },
  /**
   * Backend to'lov yozuvini yaratadi (takror chaqiruv o'sha yozuvni qaytaradi) va provayder sahifasi manzilini beradi.
   * `redirectUrl` bo'lmasa provayder kalitlari hali sozlanmagan: buyurtma saqlanadi, xaridor keyin to'laydi.
   */
  async startPayment(order: Order): Promise<string> {
    if (!order.paymentProvider) throw new Error("To‘lov tizimi tanlanmagan");
    let response: Record<string, unknown>;
    try {
      response = object(await apiRequest("/payments", { method: "POST", headers: authHeaders(), body: { salesOrderId: order.id, provider: order.paymentProvider, amount: order.total, returnUrl: `${window.location.origin}/checkout/payment/return?orderId=${encodeURIComponent(order.id)}` } }));
    } catch (error) {
      const status = (error as { status?: unknown } | null)?.status;
      // POST /payments faqat ro'yxatdan o'tgan xaridor uchun (bearer); 409/503 — provayder sozlanmagan.
      throw paymentStartError(status === 401 || status === 403 ? "unauthorized" : status === 409 || status === 503 ? "not_configured" : "failed");
    }
    const redirectUrl = safeHttpUrl(response.redirectUrl ?? response.checkoutUrl ?? response.paymentUrl);
    if (!redirectUrl) throw paymentStartError("not_configured");
    return redirectUrl;
  },
  async paymentStatus(orderId: string): Promise<{ status: PaymentStatus; provider?: PaymentProvider; reason?: string; orderStatus?: OrderStatus }> {
    const id = orderId.trim();
    if (!id || id.length > 128) throw new Error("Buyurtma raqami noto‘g‘ri");
    const response = object(await apiRequest(`/orders/${encodeURIComponent(id)}/tracking`, { method: "GET", headers: authHeaders() }));
    const payment = normalizeTrackingPayment(response);
    if (!payment) throw new Error("Backend to‘lov holatini noto‘g‘ri qaytardi");
    const { status, provider, failureReason: reason } = payment;
    const orderStatus = typeof response.orderStatus === "string" ? normalizeOrderStatus(response.orderStatus) : undefined;
    if (typeof window !== "undefined") {
      const saved = readLocal().find((item) => item.id === id);
      if (saved) { saved.paymentStatus = status; saved.paymentProvider = provider ?? saved.paymentProvider; saved.status = orderStatus ?? saved.status; try { saveLocal(saved); } catch { /* Status is still shown even if storage is unavailable. */ } }
    }
    return { status, provider, reason, orderStatus };
  },
};
