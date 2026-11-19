import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ClickTracker } from "@/components/click-tracker";
import { DetailsS1, DetailsS3, FaqS3, NextStepsS1 } from "@/components/details";
import { Gallery } from "@/components/gallery";
import { CheckIcon, PhoneS3Icon } from "@/components/icons";
import { LeadForm } from "@/components/lead-form";
import { PageErrorView } from "@/components/page-error-view";
import { Pixels } from "@/components/pixels";
import { DeliveryChoice, PayLine, PriceHead, Total } from "@/components/price-block";
import { SiteHeader } from "@/components/site-header";
import { DesktopCta, StickyPanel } from "@/components/sticky-panel";
import { StoppedView } from "@/components/stopped-view";
import type { LandingPage, RegionGroup } from "@/lib/contract";
import { loadLanding, loadRegions } from "@/lib/load-landing";
import { priceView, type PriceView } from "@/lib/pricing";
import { LANDING_URL_HEADER, landingUrl } from "@/lib/routing";
import { BUY, FORM, NOW, PAGE_ERROR, PRODUCT } from "@/lib/texts";
import { isVariant } from "@/lib/variant";

/**
 * Ichki yo‘l: `/<kod>` → middleware → `/v/<variant>/<kod>`. Tashqaridan ochilmaydi.
 * Sahifa cookie va query string o‘qimaydi: SF-03 da har variant uchun statik HTML qilinadi.
 * S1 «Tez buyurtma» — forma shu sahifada; S3 «Ishonch bilan» — forma keyingi qadamda (`/<kod>/buyurtma`).
 * Narx, yetkazish, rasm va matnlar ikkala variantda bir xil — farq faqat sotish usulida (sinov-s1-s3.md «Tenglik»).
 */
type Params = { params: Promise<{ variant: string; code: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { variant, code } = await params;
  if (!isVariant(variant)) return {};
  const loaded = await loadLanding(code);
  if (!loaded.ok) return { title: PAGE_ERROR.title };
  return loaded.page ? { title: loaded.page.product.name } : {};
}

function S1Page({ page, view, regions }: { page: LandingPage; view: PriceView; regions: RegionGroup[] | null }) {
  const bad = page.product.isBad;
  return (
    <>
      <div className="lp-first">
        <SiteHeader />
        <div className="wrap hero">
          <Gallery page={page} />
          <div>
            <LeadForm code={page.code} variant="s1" formId="lead-form" view={view} initialWhere="CENTER" regions={regions}
              buybox={{
                head: <PriceHead name={page.product.name} subtitle={page.product.subtitle} product={view.product} />,
                after: (
                  <div className="s1-first-buy">
                    <Total view={view} variant="s1" />
                    <PayLine bad={bad} />
                    <a className="buy" href="#ism">{BUY}</a>
                  </div>
                ),
              }}
              footer={<><Total view={view} variant="s1" /><PayLine bad={bad} /></>}
              under={<p className="under-buy">{FORM.arizaS1}</p>} />
          </div>
        </div>
        <div className="wrap"><DetailsS1 product={page.product} view={view} /></div>
      </div>
      <div className="wrap lp-main"><NextStepsS1 /><DesktopCta name={page.product.name} view={view} /></div>
      <StickyPanel view={view} variant="s1" />
    </>
  );
}

function S3Page({ page, view }: { page: LandingPage; view: PriceView }) {
  return (
    <>
      <div className="lp-first">
        <SiteHeader />
        <div className="wrap hero">
          <Gallery page={page} />
          {/* JS siz ham: tanlangan yetkazish buyurtma qadamiga `?whereDeliver=` bilan o‘tadi (P-1). */}
          <form id="s3-order" className="buybox" method="get" action={landingUrl(page.code, "buyurtma")}>
            <PriceHead name={page.product.name} subtitle={page.product.subtitle} product={view.product} />
            <DeliveryChoice view={view} variant="s3" />
            <Total view={view} variant="s3" />
            <PayLine bad={page.product.isBad} />
            <button className="buy" type="submit">{BUY}</button>
            <ul className="under-buy">
              <li className="now"><CheckIcon />{NOW}</li>
              <li className="muted-line"><PhoneS3Icon />{PRODUCT.s3CallLine}</li>
            </ul>
          </form>
        </div>
        <div className="wrap"><DetailsS3 product={page.product} view={view} /></div>
      </div>
      <div className="lp-main"><FaqS3 view={view} /></div>
      <StickyPanel view={view} variant="s3" />
    </>
  );
}

export default async function LandingRoute({ params }: Params) {
  const { variant, code } = await params;
  if (!isVariant(variant)) notFound();
  const loaded = await loadLanding(code);
  if (!loaded.ok) return <PageErrorView retry={<a className="button button--secondary" href="">{PAGE_ERROR.retry}</a>} />;
  if (!loaded.page) notFound();
  const page = loaded.page;

  // TC8: sahifa ochiq emas — forma, xarid tugmasi va Lead hodisasi yo‘q (toxtatilgan-1…3).
  if (page.state !== "OPEN") {
    return (
      <div className="lp" data-page="landing" data-variant={variant} data-state={page.state}>
        <SiteHeader />
        <main className="wrap lp-main"><StoppedView page={page} openedUrl={(await headers()).get(LANDING_URL_HEADER)} /></main>
      </div>
    );
  }

  const view = priceView(page.price);
  return (
    <div className="lp" data-page="landing" data-variant={variant} data-template={page.template} data-state={page.state}>
      {variant === "s1" ? <S1Page page={page} view={view} regions={await loadRegions(page.code)} /> : <S3Page page={page} view={view} />}
      <ClickTracker code={page.code} variant={variant} />
      <Pixels metaPixelId={page.metaPixelId} tiktokPixelId={page.tiktokPixelId} />
    </div>
  );
}
