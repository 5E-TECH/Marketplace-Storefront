import { ApiError } from "@/lib/api";
import { checkoutService, type CheckoutPayload } from "@/services/checkout.service";
import type { Order } from "@/types/commerce";

export type CheckoutAttempt = {
  version: 1;
  key: string;
  scope: string;
  payload: CheckoutPayload;
  receipt: Order;
  phase: "creating" | "confirming" | "confirmed";
};
const storageKey = (scope: string) => `elchi_checkout_v1:${scope}`;

export function saveCheckoutAttempt(attempt: CheckoutAttempt): void {
  try { sessionStorage.setItem(storageKey(attempt.scope), JSON.stringify(attempt)); }
  catch { throw new Error("Buyurtmani xavfsiz davom ettirish uchun brauzer xotirasiga ruxsat bering va qayta urinib ko‘ring."); }
}

export function readCheckoutAttempt(scope: string): CheckoutAttempt | null {
  try {
    const attempt = JSON.parse(sessionStorage.getItem(storageKey(scope)) ?? "null") as CheckoutAttempt | null;
    if (!attempt || attempt.version !== 1 || attempt.scope !== scope || !attempt.key || !["creating", "confirming", "confirmed"].includes(attempt.phase)) return null;
    if (attempt.payload?.paymentMethod !== "cod" || typeof attempt.payload.address?.address !== "string" || !Array.isArray(attempt.receipt?.items)) return null;
    if (attempt.phase !== "creating" && !attempt.receipt.id) return null;
    return attempt;
  } catch { return null; }
}

export function clearCheckoutAttempt(scope: string): void {
  sessionStorage.removeItem(storageKey(scope));
}

// A lost response may still mean the server created the order. Keep the same key.
export function checkoutWasRejected(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.kind !== "http") return false;
  if ([400, 401, 403, 422].includes(error.status)) return true;
  return error.status === 409 && /stock|inventory|qoldiq/i.test(`${error.message} ${JSON.stringify(error.details)}`);
}

export async function submitCheckoutAttempt(attempt: CheckoutAttempt, checkpoint: (attempt: CheckoutAttempt) => void): Promise<CheckoutAttempt> {
  if (attempt.phase === "confirmed") return attempt;
  let current = attempt;
  if (current.phase === "creating") {
    const orderId = await checkoutService.create(current.payload, current.key);
    current = { ...current, phase: "confirming", receipt: { ...current.receipt, id: orderId } };
    checkpoint(current);
  }
  await checkoutService.confirm(current.receipt.id);
  return { ...current, phase: "confirmed" };
}
