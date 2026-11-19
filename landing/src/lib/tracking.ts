import { TRACKING_FIELDS, type CreateLandingClick, type TrackingField } from "./contract";
import { isVariant, type Variant } from "./variant";

/**
 * Havoladagi parametr → shartnoma maydoni. Nomlar: `?sub1=abc&utm_source=fb` (SF-02 TC4),
 * maydonlar — `CreateLandingClickDto` (BE-25).
 */
export const QUERY_TO_FIELD: Readonly<Record<string, TrackingField>> = {
  sub1: "sub1", sub2: "sub2", sub3: "sub3", sub4: "sub4", sub5: "sub5",
  utm_source: "utmSource", utm_medium: "utmMedium", utm_campaign: "utmCampaign", utm_content: "utmContent", utm_term: "utmTerm",
  fbclid: "fbclid",
};

export function trackingFromQuery(search: string | URLSearchParams): Partial<Record<TrackingField, string>> {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const result: Partial<Record<TrackingField, string>> = {};
  for (const [param, field] of Object.entries(QUERY_TO_FIELD)) {
    const value = params.get(param)?.trim();
    if (value) result[field] = value;
  }
  return result;
}

export function readCookie(cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      const value = rest.join("=");
      try { return decodeURIComponent(value) || undefined; } catch { return value || undefined; }
    }
  }
  return undefined;
}

/** Brauzerda: sahifa kodi, ko‘rsatilgan variant, havola parametrlari va Meta cookie’lari (`_fbp`, `_fbc`). */
export function buildClick(code: string, variant: Variant, search: string, cookieHeader: string): CreateLandingClick {
  const click: CreateLandingClick = { code, variant, ...trackingFromQuery(search) };
  const fbp = readCookie(cookieHeader, "_fbp");
  const fbc = readCookie(cookieHeader, "_fbc");
  if (fbp) click.fbp = fbp;
  if (fbc) click.fbc = fbc;
  return click;
}

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/**
 * Backend DTO dagi `@MaxLength` (`libs/common/src/dto/lead.dto.ts`, `CreateLandingClickDto`, BE-11):
 * sub1–sub5 va utm — 255, fbclid — 512, fbp va fbc — 255, code — 32.
 * Uzun ixtiyoriy maydon yuborilmaydi (kesilmaydi — kesilgan fbclid noto‘g‘ri qiymat bo‘lardi):
 * aks holda backend butun klikni 400 bilan rad etadi va lid klik, variant va utm siz qoladi.
 */
export const CLICK_FIELD_MAX_LENGTH: Readonly<Record<TrackingField | "fbp" | "fbc" | "code", number>> = {
  sub1: 255, sub2: 255, sub3: 255, sub4: 255, sub5: 255,
  utmSource: 255, utmMedium: 255, utmCampaign: 255, utmContent: 255, utmTerm: 255,
  fbclid: 512, fbp: 255, fbc: 255, code: 32,
};

/** Serverda: brauzerdan kelgan tanadan faqat shartnomadagi maydonlar olinadi. `code` majburiy. */
export function sanitizeClick(input: unknown, cookieVariant?: string): CreateLandingClick | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (!isNonEmptyString(raw.code) || raw.code.trim().length > CLICK_FIELD_MAX_LENGTH.code) return null;
  const click: CreateLandingClick = { code: raw.code.trim() };
  // Ko‘rsatilgan variant — middleware yozgan HttpOnly cookie; tanadagi qiymat faqat cookie bo‘lmasa (cookie o‘chiq brauzer).
  const variant = isVariant(cookieVariant) ? cookieVariant : raw.variant;
  if (isVariant(variant)) click.variant = variant;
  for (const field of [...TRACKING_FIELDS, "fbp", "fbc"] as const) {
    const value = raw[field];
    if (isNonEmptyString(value) && value.trim().length <= CLICK_FIELD_MAX_LENGTH[field]) click[field] = value.trim();
  }
  return click;
}
