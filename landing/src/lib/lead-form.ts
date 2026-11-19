import { TRACKING_FIELDS, type CreateLead, type TrackingField, type WhereDeliver } from "./contract";
import { parseWhere } from "./pricing";
import { phoneDigits, toE164 } from "./phone";
import { FORM } from "./texts";
import { CLICK_FIELD_MAX_LENGTH, trackingFromQuery } from "./tracking";
import { isVariant, type Variant } from "./variant";

/**
 * Buyurtma formasi (SF-02): ism, telefon, rozilik, yashirin maydon, variant, kuzatuv parametrlari.
 * Manzil maydonlari SF-06 da qo‘shiladi. Server tekshiruvi JS siz yuborishda ham bir xil ishlaydi.
 */

/**
 * Mijoz rozi bo‘lgan oferta va maxfiylik matni versiyasi (`CreateLeadDto.consentVersion`, BE-12 lidda saqlaydi).
 * [taklif] Hozircha qoralama matnlar sanasi — holat-matnlari.md 2026-11-08 versiyasi; yurist tasdiqlagan
 * versiya EQ-10 va SF-07 da (8-bo‘lim «Ofertalar»).
 */
export const CONSENT_VERSION = "2026-11-08";

/** Forma maydonlari nomi (`name`). Yashirin maydon backend nomi bilan — `website` (BE-12). */
export const FIELDS = {
  code: "code",
  variant: "variant",
  name: "ism",
  phone: "telefon",
  consent: "rozilik",
  where: "whereDeliver",
  honeypot: "website",
  js: "js",
  clickId: "clickId",
} as const;

export type FieldKey = "name" | "phone" | "consent";

export interface FormValues { name: string; phone: string; consent: boolean; whereDeliver: WhereDeliver }

/**
 * `invalid` — maydon xatolari (forma-3…6, JS siz forma-10); `error` — server xatosi (forma-8, JS siz forma-11).
 * Ikkala holatda yozilganlar qaytariladi: mijoz qayta yozmaydi.
 */
export interface FormState {
  status: "idle" | "invalid" | "error";
  errors: Partial<Record<FieldKey, string>>;
  values: FormValues;
  js: boolean;
  /** JS siz qayta yuborishda ham sub1–sub5, utm, fbclid yo‘qolmasin: forma ularni yashirin maydonda qaytaradi. */
  tracking: Partial<Record<TrackingField, string>>;
}

export const initialFormState = (whereDeliver: WhereDeliver = "CENTER"): FormState => ({
  status: "idle",
  errors: {},
  values: { name: "", phone: "", consent: false, whereDeliver },
  js: false,
  tracking: {},
});

const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

const CODE = /^[A-Za-z0-9_-]{1,32}$/;
const CLICK_ID = /^[1-9]\d{0,18}$/;
/** Backend `CreateLeadDto.name` — `@MaxLength(100)`. */
export const NAME_MAX_LENGTH = 100;

export interface ParsedForm {
  code: string | null;
  variant: Variant | null;
  values: FormValues;
  honeypot: string;
  js: boolean;
  clickId: string | null;
  tracking: Partial<Record<TrackingField, string>>;
}

/**
 * Kuzatuv parametrlari: JS bilan forma ularni yashirin maydonlarda yuboradi (havoladan); JS siz —
 * forma sahifasining manzilidan (`Referer`, shu domen: to‘liq manzil keladi). Uzun qiymat tashlanadi.
 */
export function readForm(form: FormData, referer: string | null): ParsedForm {
  const code = text(form, FIELDS.code).trim();
  const variant = text(form, FIELDS.variant);
  const clickId = text(form, FIELDS.clickId).trim();
  let tracking: Partial<Record<TrackingField, string>> = {};
  for (const field of TRACKING_FIELDS) {
    const value = text(form, field).trim();
    if (value) tracking[field] = value;
  }
  if (Object.keys(tracking).length === 0 && referer) {
    try { tracking = trackingFromQuery(new URL(referer).search); } catch { /* buzuq Referer */ }
  }
  for (const field of TRACKING_FIELDS) {
    if ((tracking[field]?.length ?? 0) > CLICK_FIELD_MAX_LENGTH[field]) delete tracking[field];
  }
  return {
    code: CODE.test(code) ? code : null,
    variant: isVariant(variant) ? variant : null,
    values: {
      name: text(form, FIELDS.name).trim(),
      phone: phoneDigits(text(form, FIELDS.phone)),
      consent: form.get(FIELDS.consent) !== null,
      whereDeliver: parseWhere(text(form, FIELDS.where)),
    },
    honeypot: text(form, FIELDS.honeypot),
    js: text(form, FIELDS.js) === "1",
    clickId: CLICK_ID.test(clickId) ? clickId : null,
    tracking,
  };
}

/**
 * forma-3, forma-4, forma-6. Rozilik ikkala variantda majburiy [taklif]: taxtada S1 da majburiy, S3 da yo‘q,
 * lekin Tenglik qoidasi farqni faqat sotish usulida qoldiradi (sinov-s1-s3.md), backend esa
 * `consentVersion` ni majburiy so‘raydi. A-7 (EQ-10) javobidan keyin qayta ko‘riladi.
 */
export function validate(values: FormValues): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  if (!values.name || values.name.length > NAME_MAX_LENGTH) errors.name = FORM.nameError;
  if (!toE164(values.phone)) errors.phone = FORM.phoneError;
  if (!values.consent) errors.consent = FORM.consentError;
  return errors;
}

export function buildLead(parsed: ParsedForm & { code: string }): CreateLead {
  const lead: CreateLead = {
    code: parsed.code,
    name: parsed.values.name,
    phone: toE164(parsed.values.phone) ?? "",
    whereDeliver: parsed.values.whereDeliver,
    consentVersion: CONSENT_VERSION,
    ...parsed.tracking,
  };
  if (parsed.variant) lead.variant = parsed.variant;
  if (parsed.clickId) lead.clickId = parsed.clickId;
  if (parsed.honeypot) lead.website = parsed.honeypot;
  return lead;
}

/**
 * Backend 400 → maydon xatosi. Telefon: operator kodi xabari bo‘lsa forma-5, aks holda forma-4.
 * Formada yo‘q maydon (manzil — SF-06, `consentVersion`, kod) bo‘yicha xato mijoz tuzata olmaydi —
 * null: server xatosi (forma-8) ko‘rsatiladi.
 */
export function errorsFromBackend(fields: string[], messages: string[]): Partial<Record<FieldKey, string>> | null {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const field of fields) {
    if (field === "phone") {
      errors.phone = messages.some((message) => /operator/i.test(message)) ? FORM.operatorError : FORM.phoneError;
    } else if (field === "name") {
      errors.name = FORM.nameError;
    } else {
      return null;
    }
  }
  return Object.keys(errors).length ? errors : null;
}
