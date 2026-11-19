import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ClickTracker } from "@/components/click-tracker";
import { PageErrorView } from "@/components/page-error-view";
import { SiteHeader } from "@/components/site-header";
import { LandingTemplate } from "@/components/templates/landing-template";
import { getLanding } from "@/lib/backend";
import type { LandingPage } from "@/lib/contract";
import { PAGE_ERROR } from "@/lib/texts";
import { isVariant } from "@/lib/variant";

/**
 * Ichki yo‘l: `/<kod>` → middleware → `/v/<variant>/<kod>`. Tashqaridan ochilmaydi.
 * Sahifa cookie va query string o‘qimaydi: SF-03 da har variant uchun statik HTML qilinadi.
 * Hozircha har ochilishda backendga so‘rov ketadi — mijoz IP va user agenti bilan (`backend.ts`, limit IP bo‘yicha).
 */
type Params = { params: Promise<{ variant: string; code: string }> };

type Loaded = { ok: true; page: LandingPage | null } | { ok: false };

/**
 * Backend xatosi sahifada serverda ko‘rsatiladi (xato-1): Next’ning `error.tsx` i faqat brauzerda
 * chiziladi va JS o‘chiq mijoz bo‘sh sahifa ko‘rardi. Javob holati 200 bo‘lib qoladi — SF-03 da
 * kesh shunday sahifani saqlamasligi kerak.
 */
const loadLanding = cache(async (code: string): Promise<Loaded> => {
  const incoming = await headers();
  try {
    return { ok: true, page: await getLanding(code, { forwardedFor: incoming.get("x-forwarded-for"), userAgent: incoming.get("user-agent") }) };
  } catch (error) {
    console.error(`landing ${code}:`, (error as Error).message);
    return { ok: false };
  }
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { variant, code } = await params;
  if (!isVariant(variant)) return {};
  const loaded = await loadLanding(code);
  if (!loaded.ok) return { title: PAGE_ERROR.title };
  return loaded.page ? { title: loaded.page.product.name } : {};
}

export default async function LandingRoute({ params }: Params) {
  const { variant, code } = await params;
  if (!isVariant(variant)) notFound();
  const loaded = await loadLanding(code);
  if (!loaded.ok) return <PageErrorView retry={<a className="button button--secondary" href={`/${encodeURIComponent(code)}`}>{PAGE_ERROR.retry}</a>} />;
  if (!loaded.page) notFound();
  return (
    <>
      <SiteHeader />
      <LandingTemplate page={loaded.page} variant={variant} />
      <ClickTracker code={loaded.page.code} variant={variant} />
    </>
  );
}
