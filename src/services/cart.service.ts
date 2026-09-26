import type { AddCartInput, Cart, CartItem } from "@/types/commerce";
import { apiRequest } from "@/lib/api";
import { validateCartDto, validateStorefrontProductDto } from "@/generated/api-validators";
import { ApiError } from "@/lib/api";
import { normalizeApiProduct } from "@/lib/normalize-product";

const CART_PATH = "/cart";
const PRODUCT_CACHE_TTL = 5 * 60_000;
const PRODUCT_CACHE_LIMIT = 100;
const productCache = new Map<string, { expiresAt: number; value: Promise<unknown> }>();
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

const getCartProduct = (productId: string): Promise<unknown> => {
  const cached = productCache.get(productId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  if (cached) productCache.delete(productId);
  if (productCache.size >= PRODUCT_CACHE_LIMIT) productCache.delete(productCache.keys().next().value as string);
  const value = apiRequest(`/storefront/products/${encodeURIComponent(productId)}`, { validate: validateStorefrontProductDto })
    .catch((error) => { productCache.delete(productId); throw error; });
  productCache.set(productId, { expiresAt: Date.now() + PRODUCT_CACHE_TTL, value });
  return value;
};
const isCached = (productId: string): boolean => (productCache.get(productId)?.expiresAt ?? 0) > Date.now();
/**
 * Katalog kartalari mahsulotni keshga ko'rsatilgach yozadi. Bosh sahifa oqim bilan keladi (`loading.tsx`
 * Suspense): React kontentni `load`dan keyin ochadi, savat esa undan oldin yuklanadi — darhol so'ralsa har
 * savat qatori uchun ortiqcha GET ketadi (N+1). Shuning uchun route skeleton'i (`.route-loading`) yo'qolguncha,
 * so'ng sahifada kartasi (`data-product-id`) bor mahsulot karta uni keshga yozguncha kutiladi.
 * Kartasi yo'q mahsulot (masalan, /cart sahifasi) kutilmaydi.
 */
const HTML_STREAM_LIMIT_MS = 3000;
const ROUTE_REVEAL_LIMIT_MS = 5000;
const CARD_HYDRATION_LIMIT_MS = 5000;
const productWaiters = new Map<string, Set<() => void>>();
// Har chaqiruv faqat o'z kutuvchisini o'chiradi: parallel savat yangilanishlari bir-birini kutishdan mahrum qilmasin.
const whenRemembered = (productId: string): { promise: Promise<void>; cancel: () => void } => {
  let resolver: () => void = () => {};
  const promise = new Promise<void>((resolve) => { resolver = resolve; });
  const waiters = productWaiters.get(productId) ?? new Set();
  waiters.add(resolver);
  productWaiters.set(productId, waiters);
  return { promise, cancel: () => { waiters.delete(resolver); if (!waiters.size && productWaiters.get(productId) === waiters) productWaiters.delete(productId); } };
};
const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });
const htmlStreamed = (): Promise<void> => document.readyState === "complete"
  ? Promise.resolve()
  : Promise.race([new Promise<void>((resolve) => { window.addEventListener("load", () => resolve(), { once: true }); }), wait(HTML_STREAM_LIMIT_MS)]);
const routeLoading = (): boolean => Boolean(document.querySelector(".route-loading"));
const routeRevealed = (): Promise<void> => !routeLoading() || typeof MutationObserver === "undefined" ? Promise.resolve() : new Promise((resolve) => {
  const done = () => { observer.disconnect(); clearTimeout(timer); resolve(); };
  const observer = new MutationObserver(() => { if (!routeLoading()) done(); });
  const timer = setTimeout(done, ROUTE_REVEAL_LIMIT_MS);
  observer.observe(document.body, { childList: true, subtree: true });
});
const hasProductCard = (productId: string): boolean => {
  const id = typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(productId) : productId.replace(/["\\]/g, "\\$&");
  return Boolean(document.querySelector(`[data-product-id="${id}"]`));
};
const waitForPageProducts = async (productIds: string[]): Promise<void> => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (productIds.every(isCached)) return;
  await htmlStreamed();
  await routeRevealed();
  const pending = productIds.filter((productId) => !isCached(productId) && hasProductCard(productId));
  if (!pending.length) return;
  const waiters = pending.map(whenRemembered);
  await Promise.race([Promise.all(waiters.map((waiter) => waiter.promise)), wait(CARD_HYDRATION_LIMIT_MS)]);
  waiters.forEach((waiter) => waiter.cancel());
};
const cacheCartProduct = (product: AddCartInput["product"]) => {
  const productId = String(product.id);
  productCache.set(productId, { expiresAt: Date.now() + PRODUCT_CACHE_TTL, value: Promise.resolve(product) });
  productWaiters.get(productId)?.forEach((resolve) => resolve());
  productWaiters.delete(productId);
};

const normalizeCart = async (response: unknown): Promise<Cart> => {
  const root = object(response);
  const data = object(root.data ?? response);
  const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(root.items) ? root.items : [];
  // The contract returns product IDs and price snapshots, not embedded products.
  const productIds = [...new Set(rawItems.filter((input) => !object(input).product && !object(object(input).variant).product).map((input) => String(object(input).productId)))];
  await waitForPageProducts(productIds);
  const products = new Map<string, unknown>(await Promise.all(productIds.map(async (productId) => {
    try {
      const product = await getCartProduct(productId);
      return [productId, product] as const;
    } catch {
      // Bitta mahsulot yuklanmasa butun savatcha yiqilmasin: narx snapshot'dan olinadi, nomi vaqtincha raqam bilan.
      return [productId, { id: productId, name: `Mahsulot #${productId}` }] as const;
    }
  })));
  const items = rawItems.map((input): CartItem | null => {
    const item = object(input);
    const variant = object(item.variant);
    const product = normalizeApiProduct(item.product ?? variant.product ?? products.get(String(item.productId)));
    const itemId = item.id ?? item.itemId;
    const productId = item.productId ?? product?.id;
    if (!product || (typeof itemId !== "string" && typeof itemId !== "number") || (typeof productId !== "string" && typeof productId !== "number")) return null;
    const variantId = item.variantId ?? variant.id;
    const rawShopId = item.shopId ?? product.shop?.id;
    const rawPrice = [item.unitPriceSnapshot, item.unitPrice, variant.price, product.price].find((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0);
    const quantity = Number(item.quantity);
    return { id: String(itemId), productId, variantId: typeof variantId === "string" || typeof variantId === "number" ? variantId : undefined, shopId: typeof rawShopId === "string" || typeof rawShopId === "number" ? rawShopId : "marketplace", product: { ...product, price: Number(rawPrice ?? 0) }, quantity: Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1, color: String(item.color ?? variant.color ?? product.colors[0] ?? "") };
  }).filter((item): item is CartItem => item !== null);
  const cartId = data.id ?? data.cartId;
  return { id: typeof cartId === "string" ? cartId : undefined, items };
};
const remoteGet = async (): Promise<Cart> => normalizeCart(await apiRequest(CART_PATH, { validate: validateCartDto }));

export const cartService = {
  rememberProduct(product: AddCartInput["product"]): void { cacheCartProduct(product); },
  async get(): Promise<Cart> { return remoteGet(); },
  async add(input: AddCartInput): Promise<Cart> {
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) throw new Error("Miqdor musbat butun son bo‘lishi kerak");
    if (input.variantId === undefined || input.variantId === null || String(input.variantId).trim() === "") throw new Error("Mahsulot varianti mavjud emas");
    cacheCartProduct(input.product);
    const response = await apiRequest(`${CART_PATH}/items`, { method: "POST", body: { productId: String(input.product.id), variantId: String(input.variantId), quantity: input.quantity }, validate: validateCartDto });
    return normalizeCart(response);
  },
  async update(itemId: string, quantity: number): Promise<Cart> {
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Miqdor musbat butun son bo‘lishi kerak");
    const response = await apiRequest(`${CART_PATH}/items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: { quantity }, validate: validateCartDto });
    return normalizeCart(response);
  },
  async remove(itemId: string): Promise<Cart> {
    const response = await apiRequest(`${CART_PATH}/items/${encodeURIComponent(itemId)}`, { method: "DELETE", validate: validateCartDto });
    return normalizeCart(response);
  },
  async clear(snapshot?: Cart): Promise<Cart> {
    const cart = snapshot ?? await remoteGet();
    // Checkout savatni backendda o'zi bo'shatadi, shuning uchun allaqachon o'chirilgan qator 404 beradi — bu xato emas.
    await Promise.all(cart.items.map((item) => apiRequest(`${CART_PATH}/items/${encodeURIComponent(item.id)}`, { method: "DELETE" })
      .catch((error) => { if (!(error instanceof ApiError) || error.status !== 404) throw error; })));
    return { ...cart, items: [] };
  },
};

export const cartTotals = (items: CartItem[]) => ({
  quantity: items.reduce((sum, item) => sum + item.quantity, 0),
  subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
});
