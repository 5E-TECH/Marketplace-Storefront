import type { Customer, Order } from "@/types/commerce";
import { cartService, cartTotals } from "./cart.service";

const STORAGE_KEY = "elchi_orders_v1";

const readLocal = (): Order[] => {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value as Order[] : [];
  } catch { return []; }
};

export const orderService = {
  async list(): Promise<Order[]> { return readLocal(); },
  async create(customer: Customer, payment: Order["payment"], deliveryFee?: number): Promise<Order> {
    if (!customer.name.trim() || !/^\+998\d{9}$/.test(customer.phone) || !customer.address.trim()) throw new Error("Qabul qiluvchi ma’lumotlarini to‘liq kiriting");
    if (deliveryFee !== undefined && (!Number.isFinite(deliveryFee) || deliveryFee < 0)) throw new Error("Yetkazish narxi noto‘g‘ri");
    const cart = await cartService.get();
    if (!cart.items.length) throw new Error("Savatcha bo‘sh");
    const subtotal = cartTotals(cart.items).subtotal;
    const delivery = deliveryFee ?? (subtotal >= 300_000 ? 0 : 25_000);
    const order: Order = { id: `EL-${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString(), status: "Yangi", customer, items: cart.items, subtotal, delivery, total: subtotal + delivery, payment };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readLocal()]));
    try { await cartService.clear(cart); }
    catch { order.warning = "Buyurtma saqlandi, lekin savatchani tozalab bo‘lmadi. Buyurtmani qayta yubormang."; }
    return order;
  },
};
