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

/** Serverda: brauzerdan kelgan tanadan faqat shartnomadagi maydonlar olinadi. `code` majburiy. */
export function sanitizeClick(input: unknown): CreateLandingClick | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (!isNonEmptyString(raw.code)) return null;
  const click: CreateLandingClick = { code: raw.code.trim() };
  if (isVariant(raw.variant)) click.variant = raw.variant;
  for (const field of [...TRACKING_FIELDS, "fbp", "fbc"] as const) {
    const value = raw[field];
    if (isNonEmptyString(value)) click[field] = value.trim();
  }
  return click;
}
