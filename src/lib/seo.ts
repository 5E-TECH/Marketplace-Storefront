import type { Metadata } from "next";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";

// Production'da SITE_URL docker-compose orqali majburiy. Zaxira qiymat localhost'ni canonical'larga sizdirmasin.
const fallbackUrl = process.env.NODE_ENV === "production" ? "https://elchimarket.uz" : "http://localhost:3001";

export const siteUrl = (): string => {
  const raw = (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl).replace(/\/+$/, "");
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? url.toString().replace(/\/+$/, "") : fallbackUrl;
  } catch { return fallbackUrl; }
};

export const SITE_NAME = "Elchi Market";
export const absoluteUrl = (path: string): string => new URL(path, `${siteUrl()}/`).toString();
export const defaultOpenGraphImages = [{ url: absoluteUrl("/og-default.png"), width: 1200, height: 630, alt: SITE_NAME }];
export const jsonLd = (value: unknown): string => JSON.stringify(value).replace(/</g, "\\u003c");

/** Sahifa `openGraph` bersa Next ildizdagisini to'liq almashtiradi — shu maydonlar har safar qo'shilsin. */
export const baseOpenGraph = { siteName: SITE_NAME, locale: "uz_UZ", type: "website" } as const;

/** Savatcha, kabinet, checkout kabi shaxsiy sahifalar qidiruvga tushmasin. */
export const privateRobots: Metadata["robots"] = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } };

/** Meta description ~160 belgidan oshmasin, so'z o'rtasida kesilmasin. */
export function clipDescription(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,.;:—-]+$/, "")}…`;
}

/**
 * Katalog ro'yxatlari uchun canonical va robots.
 * Sahifalash o'z canonical'iga ega; saralash, narx filtri va qidiruv natijalari
 * indekslanmaydi, lekin havolalari kuzatiladi.
 */
export function listingSeo(basePath: string, rawQuery: CatalogSearchParams): Pick<Metadata, "alternates" | "robots"> {
  const query = parseCatalogQuery(rawQuery);
  const filtered = query.sort !== "createdAt:desc" || query.minPrice !== undefined || query.maxPrice !== undefined || Boolean(query.search);
  const page = query.page ?? 1;
  // To'liq URL: Next nisbiy "/?page=2" dagi so'rov qismini bosh sahifada tashlab yuboradi.
  const canonical = absoluteUrl(page > 1 && !filtered ? `${basePath}?page=${page}` : basePath);
  return { alternates: { canonical }, ...(filtered ? { robots: { index: false, follow: true } } : {}) };
}
