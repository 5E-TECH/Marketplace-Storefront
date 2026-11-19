/**
 * Faqat shu sahifadan: boshqa sayt o‘z mehmonlarining brauzeri orqali soxta klik (va istalgan variant)
 * yozdira olmasin. `application/json` — boshqa domendan yuborilsa brauzer avval CORS so‘rovini yuboradi,
 * biz unga ruxsat bermaymiz; `Sec-Fetch-Site` va `Origin` — brauzer qo‘yadigan sarlavhalar.
 */
export function isSameOriginJson(request: Request): boolean {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return false;
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    try { if (new URL(origin).host !== host) return false; } catch { return false; }
  }
  return true;
}
