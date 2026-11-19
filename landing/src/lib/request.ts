/**
 * Proksi (Cloudflare, Caddy) `X-Forwarded-Host` ga bir nechta qiymat yozishi mumkin — birinchisi brauzer ochgan host.
 * Host `Origin` protokoli bilan URL qilib solishtiriladi: URL katta-kichik harfni va standart portni
 * (`:443`, `:80`) bir xil ko‘rinishga keltiradi.
 */
function sameHost(origin: URL, rawHost: string | null): boolean {
  const host = rawHost?.split(",")[0]?.trim();
  if (!host) return false;
  try { return new URL(`${origin.protocol}//${host}`).host === origin.host; } catch { return false; }
}

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
    let parsed: URL;
    try { parsed = new URL(origin); } catch { return false; }
    if (!sameHost(parsed, request.headers.get("x-forwarded-host") ?? request.headers.get("host"))) return false;
  }
  return true;
}

/**
 * Tana `maxBytes` dan katta bo‘lsa `null` — o‘qish to‘xtatiladi, xotiraga to‘liq yuklanmaydi.
 * Next route handler tana hajmini cheklamaydi, middleware esa `api/` ni o‘tkazib yuboradi.
 */
export async function readBodyLimited(request: Request, maxBytes: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
