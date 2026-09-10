/**
 * Konteyner sog'ligi uchun (C2.28 TC3). Docker healthcheck va deploy
 * skripti shu manzilni so'raydi.
 *
 * Ataylab backendga murojaat qilmaydi: bu SSR jarayoni tirikmi degan
 * savolga javob beradi. Backend yiqilganda ham storefront o'zi ishlab
 * turishi va xatoni chiroyli ko'rsatishi kerak — aks holda backend
 * uzilishi butun konteynerni qayta ishga tushirish tsikliga solib qo'yardi.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", service: "storefront" });
}
