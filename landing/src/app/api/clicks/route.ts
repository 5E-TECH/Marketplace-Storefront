import { BackendError, createClick } from "@/lib/backend";
import { isSameOriginJson } from "@/lib/request";
import { readCookie, sanitizeClick } from "@/lib/tracking";
import { VARIANT_COOKIE } from "@/lib/variant";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/**
 * Brauzer → shu handler → backend `POST /clicks` (SF-02: «o‘z route handler i orqali, haqiqiy IP va user agent bilan»).
 * Klik brauzerdan yuboriladi, sahifa renderida emas: SF-03 da sahifa statik HTML bo‘ladi,
 * havola parametrlari esa faqat brauzerda o‘qiladi (query string keshni buzmaydi).
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginJson(request)) return Response.json({ error: "forbidden" }, { status: 403, headers: noStore });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "invalid_json" }, { status: 400, headers: noStore }); }
  const click = sanitizeClick(body, readCookie(request.headers.get("cookie") ?? "", VARIANT_COOKIE));
  if (!click) return Response.json({ error: "invalid_click" }, { status: 400, headers: noStore });
  try {
    const created = await createClick(click, { forwardedFor: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") });
    return Response.json(created, { status: 201, headers: noStore });
  } catch (error) {
    const status = error instanceof BackendError && error.status === 400 ? 400 : 502;
    console.error("click:", (error as Error).message);
    return Response.json({ error: "click_not_recorded" }, { status, headers: noStore });
  }
}
