import type { Variant } from "./variant";

/**
 * Tashqi manzil `/<kod>`. Middleware uni ichki `/v/<variant>/<kod>` ga yo‘naltiradi:
 * har variantning sahifasi alohida yo‘lda, shuning uchun SF-03 da ularni alohida
 * statik HTML va alohida kesh qilish mumkin.
 */
export const VARIANT_SEGMENT = "v";

/** Ichki 404: bunday yo‘l yo‘q, Next `not-found.tsx` ni 404 bilan ko‘rsatadi. */
export const NOT_FOUND_PATH = "/__topilmadi";

/** Brauzer ochgan havola 404 sahifasida «Siz ochgan havola» bo‘lib ko‘rsatiladi (404-1). */
export const LANDING_URL_HEADER = "x-landing-url";

/**
 * Kod formati backend shartnomasida berilmagan (BE-25: `code` — string, misol `k7Qm2x`).
 * Bu yerda faqat URL’ga xavfsiz belgilar o‘tkaziladi; kod bormi-yo‘qmi — backend aytadi (404).
 */
const CODE_PATTERN = /^\/([A-Za-z0-9_-]+)$/;

export type Route =
  | { kind: "landing"; code: string }
  | { kind: "internal" }
  | { kind: "other" };

export function classifyPath(pathname: string): Route {
  if (pathname === `/${VARIANT_SEGMENT}` || pathname.startsWith(`/${VARIANT_SEGMENT}/`)) return { kind: "internal" };
  const match = CODE_PATTERN.exec(pathname);
  return match ? { kind: "landing", code: match[1] } : { kind: "other" };
}

export const variantPath = (variant: Variant, code: string) => `/${VARIANT_SEGMENT}/${variant}/${code}`;
