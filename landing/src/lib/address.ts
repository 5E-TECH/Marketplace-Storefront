import type { RegionGroup } from "./contract";

/**
 * Manzil (SF-06, DZ-12, ega qarori 2026-11-16): viloyat, tuman yoki shahar, ko‘cha/uy — hammasi majburiy,
 * «Markazgacha» tanlanganda ham. Kalit — SOATO (EQ-06). Ro‘yxat backenddan (`GET /regions/tree`).
 */

/** Viloyatlar tartibi — holat-matnlari.md:387. Ro‘yxatda yo‘q nom oxirida, backend tartibida. */
export const REGION_ORDER = [
  "Toshkent shahri", "Toshkent viloyati", "Andijon viloyati", "Buxoro viloyati", "Farg‘ona viloyati", "Jizzax viloyati",
  "Xorazm viloyati", "Namangan viloyati", "Navoiy viloyati", "Qashqadaryo viloyati", "Qoraqalpog‘iston Respublikasi",
  "Samarqand viloyati", "Sirdaryo viloyati", "Surxondaryo viloyati",
];

export function sortRegions(tree: RegionGroup[]): RegionGroup[] {
  const rank = (name: string) => { const index = REGION_ORDER.indexOf(name); return index === -1 ? REGION_ORDER.length : index; };
  return tree
    .filter((region) => region.districts.length > 0)
    .map((region, index) => ({ region, index }))
    .sort((a, b) => rank(a.region.name) - rank(b.region.name) || a.index - b.index)
    .map(({ region }) => region);
}

/** Tuman qaysi viloyatniki — JS siz forma viloyatni yubormaydi (forma-22), server o‘zi topadi. */
export function regionOfDistrict(tree: RegionGroup[], districtSoato: string): string | null {
  return tree.find((region) => region.districts.some((district) => district.satoCode === districtSoato))?.satoCode ?? null;
}

/** Backend `CreateLeadDto.addressLine` — `@MaxLength(255)`. */
export const ADDRESS_MAX_LENGTH = 255;
