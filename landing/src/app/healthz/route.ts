/**
 * Konteyner sog‘ligi: Docker healthcheck va deploy shu manzilni so‘raydi.
 * Do‘kon saytidagi kabi backendga murojaat qilmaydi (`../src/app/healthz/route.ts`).
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", service: "landing" });
}
