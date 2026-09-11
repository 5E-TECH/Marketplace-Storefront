import type { AddCartInput, Cart, CartItem } from "@/types/commerce";
import { apiRequest } from "@/lib/api";
import { validateCartDto, validateStorefrontProductDto } from "@/generated/api-validators";
import { ApiError } from "@/lib/api";
import { normalizeApiProduct } from "@/lib/normalize-product";

const CART_PATH = "/cart";
const PRODUCT_CACHE_TTL_MS = 5 * 60_000;
const PRODUCT_CACHE_LIMIT = 100;
type CachedProduct = { expiresAt: number; promise: Promise<unknown> };
const productCache = new Map<string, CachedProduct>();
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const cartProduct = (productId: string): Promise<unknown> => {
  const now = Date.now();
  const cached = productCache.get(productId);
  if (cached && cached.expiresAt > now) return cached.promise;
  if (cached) productCache.delete(productId);
  if (productCache.size >= PRODUCT_CACHE_LIMIT) productCache.delete(productCache.keys().next().value as string);
  const promise = apiRequest(`/storefront/products/${encodeURIComponent(productId)}`, { validate: validateStorefrontProductDto })
    .catch((error) => {
      productCache.delete(productId);
      if (!(error instanceof ApiError) || error.status !== 404) throw error;
      return { id: productId, name: `Mahsulot #${productId}` };
    });
  productCache.set(productId, { expiresAt: now + PRODUCT_CACHE_TTL_MS, promise });
  return promise;
};
const normalizeCart = async (response: unknown): Promise<Cart> => {
  const root = object(response);
  const data = object(root.data ?? response);
  const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(root.items) ? root.items : [];
  // The contract returns product IDs and price snapshots, not embedded products.
  const productIds = [...new Set(rawItems.filter((input) => !object(input).product && !object(object(input).variant).product).map((input) => String(object(input).productId)))];
  const products = new Map<string, unknown>(await Promise.all(productIds.map(async (productId) => [productId, await cartProduct(productId)] as const)));
  const items = rawItems.map((input): CartItem | null => {
    const item = object(input);
    const variant = object(item.variant);
    const product = normalizeApiProduct(item.product ?? variant.product ?? products.get(String(item.productId)));
    const itemId = item.id ?? item.itemId;
    const productId = item.productId ?? product?.id;
    if (!product || (typeof itemId !== "string" && typeof itemId !== "number") || (typeof productId !== "string" && typeof productId !== "number")) return null;
    const variantId = item.variantId ?? variant.id;
    const rawPrice = [item.unitPriceSnapshot, item.unitPrice, variant.price, product.price].find((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0);
    const quantity = Number(item.quantity);
    return { id: String(itemId), productId, variantId: typeof variantId === "string" || typeof variantId === "number" ? variantId : undefined, product: { ...product, price: Number(rawPrice ?? 0) }, quantity: Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1, color: String(item.color ?? variant.color ?? product.colors[0]) };
  }).filter((item): item is CartItem => item !== null);
  const cartId = data.id ?? data.cartId;
  return { id: typeof cartId === "string" ? cartId : undefined, items };
};
const remoteGet = async (): Promise<Cart> => normalizeCart(await apiRequest(CART_PATH, { validate: validateCartDto }));

export const cartService = {
  async get(): Promise<Cart> { return remoteGet(); },
  async add(input: AddCartInput): Promise<Cart> {
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) throw new Error("Miqdor musbat butun son bo‘lishi kerak");
    if (input.variantId === undefined || input.variantId === null || String(input.variantId).trim() === "") throw new Error("Mahsulot varianti mavjud emas");
    await apiRequest(`${CART_PATH}/items`, { method: "POST", body: { productId: String(input.product.id), variantId: String(input.variantId), quantity: input.quantity } });
    return remoteGet();
  },
  async update(itemId: string, quantity: number): Promise<Cart> {
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Miqdor musbat butun son bo‘lishi kerak");
    await apiRequest(`${CART_PATH}/items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: { quantity } });
    return remoteGet();
  },
  async remove(itemId: string): Promise<Cart> {
    await apiRequest(`${CART_PATH}/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
    return remoteGet();
  },
  async clear(snapshot?: Cart): Promise<Cart> {
    const cart = snapshot ?? await remoteGet();
    await Promise.all(cart.items.map((item) => apiRequest(`${CART_PATH}/items/${encodeURIComponent(item.id)}`, { method: "DELETE" })));
    return { ...cart, items: [] };
  },
};

export const cartTotals = (items: CartItem[]) => ({
  quantity: items.reduce((sum, item) => sum + item.quantity, 0),
  subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
});
