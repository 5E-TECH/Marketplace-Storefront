/**
 * Piksel hodisalari (SF-02): PageView — ochiq sahifa va «Rahmat»; Lead — faqat «Rahmat» da, bir marta,
 * eventID = lid ID (BE-31 CAPI bilan bitta hodisa). Qayta yuklanganda Lead yuborilmaydi (rahmat-5, TC3):
 * yuborilgani `elchi_px_<lid>` cookie’sida. Noto‘g‘ri piksel ID — skript yuklanmaydi.
 */
export const META_PIXEL_ID = /^\d{6,20}$/;
export const TIKTOK_PIXEL_ID = /^[A-Za-z0-9]{8,40}$/;
/** [taklif] 30 kun — S1/S3 cookie bilan bir xil muddat (TZ 01, 9-qoida). */
export const PIXEL_SENT_MAX_AGE = 30 * 24 * 60 * 60;

export type Track = (...args: unknown[]) => void;

export interface PixelEnv {
  meta: () => Track;
  tiktok: (id: string) => { page: () => void; track: Track };
  cookie: () => string;
  setCookie: (value: string) => void;
}

export const sentCookieName = (leadId: string) => `elchi_px_${leadId.replace(/\D/g, "")}`;

export function firePixelEvents(env: PixelEnv, ids: { meta: string | null; tiktok: string | null }, leadId?: string): { lead: boolean } {
  const name = leadId ? sentCookieName(leadId) : null;
  const lead = leadId && name && !env.cookie().split(";").some((part) => part.trim().startsWith(`${name}=`)) ? leadId : null;
  const metaOk = Boolean(ids.meta && META_PIXEL_ID.test(ids.meta));
  const tiktokOk = Boolean(ids.tiktok && TIKTOK_PIXEL_ID.test(ids.tiktok));
  if (metaOk && ids.meta) {
    const fbq = env.meta();
    fbq("init", ids.meta);
    fbq("track", "PageView");
    if (lead) fbq("track", "Lead", {}, { eventID: lead });
  }
  if (tiktokOk && ids.tiktok) {
    const ttq = env.tiktok(ids.tiktok);
    ttq.page();
    // [taklif] TikTok’da «Lead» o‘rniga standart «SubmitForm» hodisasi; event_id — o‘sha lid ID.
    if (lead) ttq.track("SubmitForm", {}, { event_id: lead });
  }
  const sent = Boolean(lead && name && (metaOk || tiktokOk));
  if (sent) env.setCookie(`${name}=1; Max-Age=${PIXEL_SENT_MAX_AGE}; Path=/; SameSite=Lax`);
  return { lead: sent };
}
