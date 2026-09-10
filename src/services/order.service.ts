import type { Order } from "@/types/commerce";

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
  async record(order: Order): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readLocal().filter((item) => item.id !== order.id)]));
  },
};
