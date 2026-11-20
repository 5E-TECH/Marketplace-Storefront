import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PageErrorView } from "@/components/page-error-view";
import { Pixels } from "@/components/pixels";
import { SiteHeader } from "@/components/site-header";
import { ThanksView } from "@/components/thanks-view";
import { isOffHours } from "@/lib/hours";
import { decodeLeadCookie, LEAD_COOKIE } from "@/lib/lead-cookie";
import { loadLanding } from "@/lib/load-landing";
import { landingUrl } from "@/lib/routing";
import { PAGE_ERROR, THANKS } from "@/lib/texts";
import { isVariant } from "@/lib/variant";

/**
 * «Rahmat» — faqat lid yozilgandan keyin (LID-3): forma serveri yozgan cookie bo‘lmasa sotuvchi sahifasiga qaytadi.
 * Lead pikseli bir marta (rahmat-5), dublikat va bot uchun yo‘q (`LeadCookie.pixel`).
 */
type Params = { params: Promise<{ variant: string; code: string }> };

export const metadata: Metadata = { title: THANKS.accepted };

export default async function ThanksRoute({ params }: Params) {
  const { variant, code } = await params;
  if (!isVariant(variant)) notFound();
  const lead = decodeLeadCookie((await cookies()).get(LEAD_COOKIE)?.value);
  if (!lead || lead.code !== code) redirect(landingUrl(code));
  const loaded = await loadLanding(code);
  if (!loaded.ok) return <PageErrorView retry={<a className="button button--secondary" href="">{PAGE_ERROR.retry}</a>} />;
  if (!loaded.page) notFound();

  return (
    <div className="lp" data-page="rahmat" data-variant={variant}>
      <SiteHeader />
      <main className="wrap lp-main"><ThanksView page={loaded.page} lead={lead} variant={variant} offHours={isOffHours()} /></main>
      {lead.pixel ? <Pixels metaPixelId={loaded.page.metaPixelId} tiktokPixelId={loaded.page.tiktokPixelId} leadId={lead.leadId} /> : null}
    </div>
  );
}
