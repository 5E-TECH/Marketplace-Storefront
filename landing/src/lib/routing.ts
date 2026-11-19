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
 * Ichki sahifalar (SF-02): `/<kod>/buyurtma` — S3 buyurtma qadami, `/<kod>/rahmat` — «Rahmat».
 */
const CODE_PATTERN = /^\/([A-Za-z0-9_-]+)(?:\/(buyurtma|rahmat))?$/;

export const SUB_PAGES = ["buyurtma", "rahmat"] as const;
export type SubPage = (typeof SUB_PAGES)[number];

export type Route =
  | { kind: "landing"; code: string; sub?: SubPage }
  | { kind: "internal" }
  | { kind: "other" };

/**
 * Sotuvchi sahifasi kodi bo‘la olmaydigan yo‘llar: huquqiy sahifalar (SF-07). «Ommaviy oferta» havolasi
 * rozilik matnida (SF-02) — backendga kod sifatida so‘rov ketmasin. SF-07 qolganlarini shu ro‘yxatga qo‘shadi.
 */
export const RESERVED_PATHS: ReadonlySet<string> = new Set(["oferta"]);

export function classifyPath(pathname: string): Route {
  if (pathname === `/${VARIANT_SEGMENT}` || pathname.startsWith(`/${VARIANT_SEGMENT}/`)) return { kind: "internal" };
  const match = CODE_PATTERN.exec(pathname);
  if (!match || RESERVED_PATHS.has(match[1])) return { kind: "other" };
  return match[2] ? { kind: "landing", code: match[1], sub: match[2] as SubPage } : { kind: "landing", code: match[1] };
}

export const variantPath = (variant: Variant, code: string, sub?: SubPage) =>
  `/${VARIANT_SEGMENT}/${variant}/${code}${sub ? `/${sub}` : ""}`;

/** Mijoz ko‘radigan manzillar (rewrite’dan oldingi). */
export const landingUrl = (code: string, sub?: SubPage) => `/${encodeURIComponent(code)}${sub ? `/${sub}` : ""}`;
