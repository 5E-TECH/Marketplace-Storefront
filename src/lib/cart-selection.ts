import type { CartItem } from "@/types/commerce";

const STORAGE_KEY = "elchi_cart_selection_v1";

export function saveCartSelection(itemIds: string[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(itemIds));
}

export function readCartSelection(items: CartItem[]): string[] {
  if (typeof window === "undefined") return items.map((item) => item.id);
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as unknown;
    if (!Array.isArray(saved)) return items.map((item) => item.id);
    const available = new Set(items.map((item) => item.id));
    return saved.filter((id): id is string => typeof id === "string" && available.has(id));
  } catch {
    return items.map((item) => item.id);
  }
}

export function clearCartSelection(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
}
