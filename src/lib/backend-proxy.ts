import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { ApiError, apiResponse } from "@/lib/api";

/**
 * - `x-requested-with` — CSRF: backend cookie'li POST/PATCH/DELETE ni shusiz rad etadi; proksi uni o'zi qo'shmaydi.
 * - `x-forwarded-for` — o'zgartirmasdan (qo'shmasdan, kesmasdan): backend ichki tarmoq manzillarini tashlab, birinchi
 *   ommaviy IP'ni mijozniki deb oladi — login limiti va audit shu IP bo'yicha (backend docs/C4.8-TRUST-PROXY.md).
 * - `x-forwarded-proto` — HTTPS'da backend cookie'ni `Secure` bilan yozadi.
 */
const FORWARDED_HEADERS = ["authorization", "cookie", "accept-language", "x-session-id", "idempotency-key", "content-type", "x-requested-with", "x-forwarded-for", "x-forwarded-proto"] as const;

const PROXY_PREFIX = "/api/backend";

/**
 * Backend cookie'si (masalan `Domain=api.elchimarket.uz; Path=/api/v1/auth`)
 * brauzerga storefront domenida shu proxy orqali keladi: `Domain` olib
 * tashlanadi, backend yo'li proxy yo'liga o'giriladi. `SameSite=Lax` —
 * boshqa saytdan yuborilgan POST'ga cookie qo'shilmaydi (CSRF).
 */
export function rewriteSetCookie(cookie: string, upstreamPrefix: string): string {
  const prefix = upstreamPrefix.replace(/\/+$/, "");
  return cookie.split(";").map((part) => part.trim())
    .filter((part) => part && !/^(domain|samesite)=/i.test(part))
    .map((part) => {
      if (!/^path=/i.test(part)) return part;
      const path = part.slice(5).trim();
      return `Path=${prefix && (path === prefix || path.startsWith(`${prefix}/`)) ? `${PROXY_PREFIX}${path.slice(prefix.length)}` : path}`;
    })
    .concat("SameSite=Lax")
    .join("; ");
}

const upstreamPathPrefix = (): string => {
  try { return new URL(env.apiUrl).pathname; } catch { return ""; }
};

export async function proxyBackend(request: NextRequest, path: string): Promise<Response> {
  const headers = new Headers();
  FORWARDED_HEADERS.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  try {
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
    const upstream = await apiResponse(path, { method: request.method, headers, body: body || undefined, params: Object.fromEntries(request.nextUrl.searchParams), server: true });
    const responseHeaders = new Headers({ "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "private, no-store" });
    const prefix = upstreamPathPrefix();
    upstream.headers.getSetCookie().forEach((cookie) => responseHeaders.append("Set-Cookie", rewriteSetCookie(cookie, prefix)));
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    const status = error instanceof ApiError && error.kind === "configuration" ? 503 : error instanceof ApiError && error.kind === "timeout" ? 504 : 502;
    return NextResponse.json({ message: error instanceof ApiError ? error.message : "Backend API bilan aloqa yo‘q", kind: error instanceof ApiError ? error.kind : "network" }, { status });
  }
}
