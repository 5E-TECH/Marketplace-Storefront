import type { WhereDeliver } from "./contract";
import { parseWhere } from "./pricing";

/**
 * «Rahmat» sahifasi uchun: forma yuborilgach server shu HttpOnly cookie’ni yozadi va `/<kod>/rahmat` ga o‘tkazadi.
 * Ism va raqam manzilda (URL) ko‘rinmasin — sahifa ularni cookie’dan oladi (rahmat-1: «Rahmat, Aziza!», raqam).
 * `pixel` — Lead hodisasi kerakmi: dublikat (rahmat-4) va yashirin maydon to‘ldirilganda yo‘q (forma-13).
 */
export const LEAD_COOKIE = "elchi_ariza";
/** [taklif] 1 soat: «Rahmat» qayta yuklansa ham ochiladi (rahmat-5), keyin cookie o‘chadi. */
export const LEAD_COOKIE_MAX_AGE = 60 * 60;

export interface LeadCookie {
  code: string;
  leadId: string;
  duplicate: boolean;
  name: string;
  phone: string;
  where: WhereDeliver;
  pixel: boolean;
}

export const encodeLeadCookie = (value: LeadCookie): string => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

export function decodeLeadCookie(raw: string | undefined): LeadCookie | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Partial<LeadCookie>;
    if (typeof value.code !== "string" || typeof value.leadId !== "string" || typeof value.name !== "string" || typeof value.phone !== "string") return null;
    return {
      code: value.code,
      leadId: value.leadId,
      duplicate: value.duplicate === true,
      name: value.name,
      phone: value.phone,
      where: parseWhere(value.where),
      pixel: value.pixel === true,
    };
  } catch {
    return null;
  }
}
