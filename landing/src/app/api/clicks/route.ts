import { BackendError, createClick } from "@/lib/backend";
import { sanitizeClick } from "@/lib/tracking";

export const dynamic = "force-dynamic";

/**
 * Brauzer → shu handler → backend `POST /clicks` (SF-02: «o‘z route handler i orqali, haqiqiy IP va user agent bilan»).
 * Klik brauzerdan yuboriladi, sahifa renderida emas: SF-03 da sahifa statik HTML bo‘ladi,
 * havola parametrlari esa faqat brauzerda o‘qiladi (query string keshni buzmaydi).
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
  const click = sanitizeClick(body);
  if (!click) return Response.json({ error: "invalid_click" }, { status: 400 });
  try {
    const created = await createClick(click, { forwardedFor: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") });
    return Response.json(created, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof BackendError && error.status === 400 ? 400 : 502;
    console.error("click:", (error as Error).message);
    return Response.json({ error: "click_not_recorded" }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
