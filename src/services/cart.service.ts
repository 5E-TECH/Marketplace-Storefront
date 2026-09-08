import type { AddCartInput, Cart, CartItem } from "@/types/commerce";
import { browserApiRequest } from "@/lib/browser-api-client";
import { normalizeApiProduct } from "@/lib/normalize-product";

const CART_PATH = "/api/cart";
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const normalizeCart = (response: unknown): Cart => {
  const root = object(response);
  const data = object(root.data ?? response);
  const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(root.items) ? root.items : [];
  const items = rawItems.map((input): CartItem | null => {
    const item = object(input);
    const variant = object(item.variant);
    const product = normalizeApiProduct(item.product ?? variant.product);
    const itemId = item.id ?? item.itemId;
    const productId = item.productId ?? product?.id;
    if (!product || (typeof itemId !== "string" && typeof itemId !== "number") || (typeof productId !== "string" && typeof productId !== "number")) return null;
    const variantId = item.variantId ?? variant.id;
    const rawPrice = [item.unitPrice, variant.price, product.price].find((value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0);
    const quantity = Number(item.quantity);
    return { id: String(itemId), productId, variantId: typeof variantId === "string" || typeof variantId === "number" ? variantId : undefined, product: { ...product, price: Number(rawPrice ?? 0) }, quantity: Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 1, color: String(item.color ?? variant.color ?? product.colors[0]) };
  }).filter((item): item is CartItem => item !== null);
  const cartId = data.id ?? data.cartId;
  return { id: typeof cartId === "string" ? cartId : undefined, items };
};
const remoteGet = async (): Promise<Cart> => normalizeCart(await browserApiRequest<unknown>(CART_PATH));

export const cartService = {
  async get(): Promise<Cart> { return remoteGet(); },
  async add(input: AddCartInput): Promise<Cart> {
    if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) throw new Error("Miqdor musbat butun son bo‘lishi kerak");
    if (input.variantId === undefined || input.variantId === null || String(input.variantId).trim() === "") throw new Error("Mahsulot varianti mavjud emas");
    await browserApiRequest(`${CART_PATH}/items`, { method: "POST", body: JSON.stringify({ productId: input.product.id, variantId: String(input.variantId), quantity: input.quantity }) });
    return remoteGet();
  },
  async update(itemId: string, quantity: number): Promise<Cart> {
    if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Miqdor musbat butun son bo‘lishi kerak");
    await browserApiRequest(`${CART_PATH}/items/${encodeURIComponent(itemId)}`, { method: "PATCH", body: JSON.stringify({ quantity: Math.max(1, quantity) }) });
    return remoteGet();
  },
  async remove(itemId: string): Promise<Cart> {
    await browserApiRequest(`${CART_PATH}/items/${encodeURIComponent(itemId)}`, { method: "DELETE" });
    return remoteGet();
  },
  async clear(snapshot?: Cart): Promise<Cart> {
    const cart = snapshot ?? await remoteGet();
    await Promise.all(cart.items.map((item) => browserApiRequest(`${CART_PATH}/items/${encodeURIComponent(item.id)}`, { method: "DELETE" })));
    return { ...cart, items: [] };
  },
};

export const cartTotals = (items: CartItem[]) => ({
  quantity: items.reduce((sum, item) => sum + item.quantity, 0),
  subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
});
