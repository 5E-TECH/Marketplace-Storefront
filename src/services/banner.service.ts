import { env } from "@/config/env";
import { validateStorefrontBannerDto } from "@/generated/api-validators";
import { apiRequest } from "@/lib/api";
import { getSafeImageSrc } from "@/lib/product-storage";
import type { Banner, BannerResult } from "@/types/commerce";
import type { StorefrontBannerDto } from "@/types/storefront-api";

const BANNERS_PATH = "/storefront/banners";

const validateBanners = (value: unknown): value is StorefrontBannerDto[] =>
  Array.isArray(value) && value.every(validateStorefrontBannerDto);

/**
 * `linkUrl` ni admin qo'lda yozadi, ya'ni `javascript:` yoki protokolsiz
 * `//boshqa-sayt` kelib qolishi mumkin. Faqat shu ikki shakl o'tadi:
 * sayt ichidagi yo'l (`/...`) va to'liq http(s) manzil. Qolgani havolasiz
 * banner bo'lib chiqadi — rasm ko'rinadi, bosilmaydi.
 */
export const safeBannerHref = (value: string | null | undefined): string | undefined => {
  const href = value?.trim();
  if (!href) return undefined;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
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
   * qo'llaydi (`GET /storefront/banners`), shuning uchun bu yerda filtr yo'q.
   * Xato bo'lsa bo'sh ro'yxat qaytadi — banner bloki butunlay chiqmaydi va
   * bosh sahifa yiqilmaydi.
   */
  async list(): Promise<BannerResult> {
    if (!env.apiUrl) return { data: [], source: "unavailable", error: "API_URL sozlanmagan" };
    try {
      const response = await apiRequest(BANNERS_PATH, { next: { revalidate: 30 }, validate: validateBanners });
      // Backend ham tartiblaydi; bu yerda takrorlash kelishuvni aniq qiladi.
      const data = response.map(normalizeBanner).sort((left, right) => left.sortOrder - right.sortOrder);
      return { data, source: "api" };
    } catch (error) {
      return { data: [], source: "unavailable", error: error instanceof Error ? error.message : "Bannerlar yuklanmadi" };
    }
  },
};
