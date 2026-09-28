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

const lineKey = (item: CartItem): string => `${item.productId}:${item.variantId ?? ""}`;

/**
 * Checkout belgilanmagan qatorlarni vaqtincha o'chirib, keyin qayta qo'shadi — ular yangi id oladi.
 * Xaridor olib tashlagan belgilar mahsulot/variant bo'yicha yangi qatorlarga ko'chiriladi.
 */
export function carryCartSelection(previous: CartItem[], next: CartItem[]): void {
  if (typeof window === "undefined") return;
  const excluded = readExcluded();
  const excludedLines = new Set(previous.filter((item) => excluded.has(item.id)).map(lineKey));
  saveCartSelection(next.filter((item) => !excludedLines.has(lineKey(item))).map((item) => item.id), next);
}

export function clearCartSelection(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_STORAGE_KEY);
}

/**
 * "Buyurtma berish" tugmasi: checkout faqat shu mahsulotni rasmiylashtiradi, savatdagi qolganlari savatda qoladi.
 * Tanlov URL'da uzatiladi (saqlanmaydi) — savat sahifasidan oddiy checkout'ga o'tilganda eski tanlov aralashmaydi.
 */
export type BuyNowTarget = { productId: string; variantId?: string };

export function buyNowHref(productId: string | number, variantId?: string | number): string {
  const params = new URLSearchParams({ product: String(productId) });
  if (variantId !== undefined && variantId !== null && String(variantId) !== "") params.set("variant", String(variantId));
  return `/checkout?${params}`;
}

export function readBuyNowTarget(search: string): BuyNowTarget | null {
  const params = new URLSearchParams(search);
  const productId = params.get("product")?.trim();
  if (!productId || productId.length > 128) return null;
  const variantId = params.get("variant")?.trim();
  return { productId, variantId: variantId && variantId.length <= 128 ? variantId : undefined };
}

export function buyNowSelection(items: CartItem[], target: BuyNowTarget): string[] {
  return items
    .filter((item) => String(item.productId) === target.productId && (target.variantId === undefined || String(item.variantId ?? "") === target.variantId))
    .map((item) => item.id);
}
