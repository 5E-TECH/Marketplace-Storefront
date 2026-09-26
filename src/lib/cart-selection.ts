import type { CartItem } from "@/types/commerce";

/**
 * Xaridor savatda belgini olib tashlagan qatorlar saqlanadi (tanlanganlar emas).
 * Ilgari tanlanganlar ro'yxati saqlanardi: savat ochilgandan keyin qo'shilgan
 * mahsulot unda bo'lmagani uchun belgilanmagan holda qolar, checkout esa uni
 * jimgina tashlab ketardi yoki "mahsulot tanlanmagan" deb to'xtardi.
 */
const STORAGE_KEY = "elchi_cart_excluded_v2";
const LEGACY_STORAGE_KEY = "elchi_cart_selection_v1";

const readExcluded = (): Set<string> => {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
};

export function saveCartSelection(selectedIds: string[], items: CartItem[]): void {
  if (typeof window === "undefined") return;
  const selected = new Set(selectedIds);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.filter((item) => !selected.has(item.id)).map((item) => item.id)));
  sessionStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function readCartSelection(items: CartItem[]): string[] {
  if (typeof window === "undefined") return items.map((item) => item.id);
  const excluded = readExcluded();
  return items.filter((item) => !excluded.has(item.id)).map((item) => item.id);
}

export function clearCartSelection(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_STORAGE_KEY);
}
