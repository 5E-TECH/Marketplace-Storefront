const ORIGIN = "http://storefront.invalid";

/**
 * Login'dan keyin qaytiladigan manzil faqat shu saytning ichki yo'li bo'lishi mumkin.
 * `"/"` bilan boshlanish yetarli emas: brauzer `/\evil.com` ni `//evil.com` deb o'qiydi
 * va xaridorni begona saytga olib ketadi (open redirect). Shuning uchun manzil
 * URL sifatida tahlil qilinadi va origin o'zgarmagani tekshiriladi.
 */
export function safeReturnPath(value: string | undefined, fallback = "/profile"): string {
  if (!value || value.length > 500 || !value.startsWith("/") || /[\\\s]/.test(value)) return fallback;
  try {
    const url = new URL(value, ORIGIN);
    return url.origin === ORIGIN ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}
