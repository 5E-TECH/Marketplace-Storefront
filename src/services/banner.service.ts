import { env } from "@/config/env";
import { validateStorefrontBannerDto } from "@/generated/api-validators";
import { apiRequest } from "@/lib/api";
import { getSafeImageSrc } from "@/lib/product-storage";
import { siteUrl } from "@/lib/seo";
import type { Banner, BannerResult } from "@/types/commerce";
import type { StorefrontBannerDto } from "@/types/storefront-api";

const BANNERS_PATH = "/storefront/banners";
/**
 * Banner bosh sahifaning ikkinchi darajali qismi: API sekin bo'lsa ham sahifa
 * shu vaqtdan ortiq kutmaydi — bannerlarsiz ochiladi.
 */
const BANNER_TIMEOUT_MS = 3_000;
/** Storefront'da JSON qaytaradigan route handler'lar — xaridor sahifa o'rniga xom ma'lumot ko'rardi. */
const JSON_ROUTE = /^\/(?:api|storefront)(?:[/?#]|$)/i;

const validateBanners = (value: unknown): value is StorefrontBannerDto[] =>
  Array.isArray(value) && value.every(validateStorefrontBannerDto);

const hostOf = (value: string): string => {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
};

/**
 * `linkUrl` backendda ham xuddi shu qoida bilan tekshiriladi
 * (`BANNER_LINK_PATTERN`); bu yer — ikkinchi himoya qatlami, chunki eski yoki
 * qo'lda kiritilgan yozuv ham bo'lishi mumkin. Natija:
 *   • sayt ichidagi yo'l → o'zicha (`/katalog/telefon`);
 *   • o'z saytimizning to'liq manzili → ichki yo'lga aylanadi, yangi tabda ochilmaydi;
 *   • boshqa http(s) sayt → to'liq manzil (komponent yangi tabda ochadi);
 *   • qolgani (`javascript:`, `//host`, `/\host`, JSON route) → havolasiz banner.
 */
export const safeBannerHref = (value: string | null | undefined): string | undefined => {
  const href = value?.trim();
  if (!href || /[\s\\]/.test(href)) return undefined;
  if (href.startsWith("/")) {
    if (href.startsWith("//") || JSON_ROUTE.test(href)) return undefined;
    return href;
  }
  let url: URL;
  try { url = new URL(href); } catch { return undefined; }
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname) return undefined;
  if (url.hostname.toLowerCase().replace(/^www\./, "") === hostOf(siteUrl())) {
    const path = `${url.pathname}${url.search}${url.hash}` || "/";
    return JSON_ROUTE.test(path) ? undefined : path;
  }
  return url.toString();
};

export const normalizeBanner = (banner: StorefrontBannerDto): Banner => ({
  id: String(banner.id),
  title: String(banner.title ?? ""),
  imageUrl: getSafeImageSrc(String(banner.imageUrl ?? "")),
  linkUrl: safeBannerHref(banner.linkUrl),
  sortOrder: Number(banner.sortOrder) || 0,
});

export const bannerService = {
  /**
   * Bosh sahifa bannerlari. Backend muddat va faollik filtrini o'zi
   * qo'llaydi (`GET /storefront/banners`).
   *
   * Kesh ATAYLAB o'chirilgan (`no-store`). Next Data Cache eskirgan yozuvni
   * joriy so'rovga berib, yangilashni fonda qiladi: tungi jimlikdan keyin
   * birinchi kelgan xaridor soatlar oldin tugagan chegirmani ko'rardi. So'rov
   * kichik va indekslangan, shuning uchun har render'da yangisi olinadi.
   *
   * Xato yoki timeout bo'lsa bo'sh ro'yxat — banner bloki chiqmaydi, bosh
   * sahifa esa yiqilmaydi.
   */
  async list(): Promise<BannerResult> {
    if (!env.apiUrl) return { data: [], source: "unavailable", error: "API_URL sozlanmagan" };
    try {
      const response = await apiRequest(BANNERS_PATH, { cache: "no-store", timeoutMs: BANNER_TIMEOUT_MS, validate: validateBanners });
      // Backend ham tartiblaydi; bu yerda takrorlash kelishuvni aniq qiladi.
      const data = response.map(normalizeBanner).sort((left, right) => left.sortOrder - right.sortOrder);
      return { data, source: "api" };
    } catch (error) {
      return { data: [], source: "unavailable", error: error instanceof Error ? error.message : "Bannerlar yuklanmadi" };
    }
  },
};
