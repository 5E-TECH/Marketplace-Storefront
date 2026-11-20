import type { Variant } from "./variant";

/**
 * Tashqi manzil `/<kod>`. Middleware uni ichki `/v/<variant>/<kod>` ga yo‘naltiradi:
 * har variantning sahifasi alohida yo‘lda, shuning uchun SF-03 da ularni alohida
 * statik HTML va alohida kesh qilish mumkin.
 */
export const VARIANT_SEGMENT = "v";

/** Ichki 404: bunday yo‘l yo‘q, Next `not-found.tsx` ni 404 bilan ko‘rsatadi. */
export const NOT_FOUND_PATH = "/__topilmadi";


/**
 * Kod: URL’ga xavfsiz belgilar, ko‘pi bilan 32 (BE-25 `CreateLeadDto.code` `@MaxLength(32)`; backend o‘zi
 * 6 belgili kod yaratadi — `stream.service.ts` CODE_LENGTH). Kod bormi-yo‘qmi — backend aytadi (404).
 * Ichki sahifalar (SF-02): `/<kod>/buyurtma` — S3 buyurtma qadami, `/<kod>/rahmat` — «Rahmat».
 */
const CODE_PATTERN = /^\/([A-Za-z0-9_-]{1,32})(?:\/(buyurtma|rahmat))?$/;

export const SUB_PAGES = ["buyurtma", "rahmat"] as const;
export type SubPage = (typeof SUB_PAGES)[number];

export type Route =
  | { kind: "landing"; code: string; sub?: SubPage }
  | { kind: "internal" }
  | { kind: "other" };

/**
 * Sotuvchi sahifasi kodi bo‘la olmaydigan yo‘llar: huquqiy sahifalar (SF-07). «Ommaviy oferta» havolasi
 * rozilik matnida (SF-02) — backendga kod sifatida so‘rov ketmasin. `healthz` — konteyner tekshiruvi (SF-03 dan
 * middleware undan ham o‘tadi). SF-07 qolganlarini shu ro‘yxatga qo‘shadi.
 */
export const RESERVED_PATHS: ReadonlySet<string> = new Set(["oferta", "healthz"]);

export function classifyPath(pathname: string): Route {
  if (pathname === `/${VARIANT_SEGMENT}` || pathname.startsWith(`/${VARIANT_SEGMENT}/`)) return { kind: "internal" };
  const match = CODE_PATTERN.exec(pathname);
  if (!match || RESERVED_PATHS.has(match[1])) return { kind: "other" };
  return match[2] ? { kind: "landing", code: match[1], sub: match[2] as SubPage } : { kind: "landing", code: match[1] };
}

/**
 * SF-03: variant middleware’dan sahifaga so‘rov sarlavhasi bilan o‘tadi, yo‘lni `next.config.ts` dagi rewrite
 * almashtiradi (`/<kod>` → `/v/<variant>/<kod>`). Middleware rewrite’i bilan Next ISR keshini ishlatmaydi —
 * config rewrite bilan har variant sahifasi statik keshdan beriladi. Mijoz yuborgan qiymat har doim almashtiriladi.
 */
export const VARIANT_HEADER = "x-elchi-variant";

/**
 * Sotuvchi sahifasi javobi umumiy keshlarga (CDN, proksi) tushmaydi: `/<kod>` manzili ikkala variantda bir xil,
 * CDN uni variant bo‘yicha ajrata olmaydi (TC2: S1 keshi S3 tashrifiga berilmaydi). Statik HTML — Next serverida,
 * har variant yo‘li bo‘yicha alohida (ISR).
 */
export const LANDING_CACHE_CONTROL = "private, no-store, max-age=0";

export const variantPath = (variant: Variant, code: string, sub?: SubPage) =>
  `/${VARIANT_SEGMENT}/${variant}/${code}${sub ? `/${sub}` : ""}`;

/** Mijoz ko‘radigan manzillar (rewrite’dan oldingi). */
export const landingUrl = (code: string, sub?: SubPage) => `/${encodeURIComponent(code)}${sub ? `/${sub}` : ""}`;
