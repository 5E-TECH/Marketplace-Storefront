/* eslint-disable @next/next/no-img-element -- rasm offer kartasidagi CDN manzilidan; host EQ-05 gacha noma’lum */
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CheckIcon, DocIcon, NoCardIcon } from "@/components/icons";
import { LeadForm } from "@/components/lead-form";
import { PageErrorView } from "@/components/page-error-view";
import { Pixels } from "@/components/pixels";
import { Total } from "@/components/price-block";
import { SiteHeader } from "@/components/site-header";
import { loadLanding, loadRegions } from "@/lib/load-landing";
import { parseWhere, priceView } from "@/lib/pricing";
import { landingUrl } from "@/lib/routing";
import { trackingFromReferer } from "@/lib/tracking";
import { BAD_NOTICE, FORM, formatSum, NOCARD, PAGE_ERROR, PAY } from "@/lib/texts";

/**
 * S3 buyurtma qadami (`S3-buyurtma`): xulosa kartasi (tovar, narx, yetkazish tanlovi, Jami), forma, Jami,
 * {BUY}, uch qator ({PAY}, «Ariza — bu hali to‘lov emas», {NOCARD}). S1 da forma mahsulot sahifasida — bu yo‘l
 * S1 uchun o‘sha sahifaga qaytaradi. Ochiq bo‘lmagan sahifa — mahsulot sahifasiga (to‘xtatilgan holat, TC8).
 */
type Props = { params: Promise<{ variant: string; code: string }>; searchParams: Promise<{ whereDeliver?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const loaded = await loadLanding(code);
  return loaded.ok && loaded.page ? { title: loaded.page.product.name } : {};
}

export default async function OrderStep({ params, searchParams }: Props) {
  const { variant, code } = await params;
  if (variant !== "s3") redirect(landingUrl(code));
  const loaded = await loadLanding(code);
  if (!loaded.ok) return <PageErrorView retry={<a className="button button--secondary" href="">{PAGE_ERROR.retry}</a>} />;
  if (!loaded.page) notFound();
  const page = loaded.page;
  if (page.state !== "OPEN") redirect(landingUrl(code));
  const view = priceView(page.price);
  const where = parseWhere((await searchParams).whereDeliver);
  // JS siz S3: mahsulot sahifasidagi GET forma havola parametrlarini almashtiradi — ular shu so‘rovning
  // Referer’ida (o‘sha domen, to‘liq manzil) qoladi va formaga yashirin maydon bo‘lib o‘tadi (TC4).
  const tracking = trackingFromReferer((await headers()).get("referer"), landingUrl(code));

  return (
    <div className="lp" data-page="buyurtma" data-variant="s3">
      <SiteHeader back={{ href: landingUrl(code), label: FORM.back.s3 }} />
      <main className="wrap lp-main order">
        <LeadForm code={page.code} variant="s3" formId="lead-form" title={FORM.s3Title} view={view} initialWhere={where} tracking={tracking} regions={await loadRegions(page.code)}
          summary={{
            head: (
              <div className="card__product">
                {page.product.images[0] ? <img src={page.product.images[0]} alt="" /> : <span className="card__thumb" />}
                <div>
                  <p className="block__title">{page.product.name}</p>
                  <p className="nowrap">{formatSum(view.product)}</p>
                  {page.product.isBad ? <p className="bad">{BAD_NOTICE}</p> : null}
                </div>
              </div>
            ),
            after: <Total view={view} variant="s3" />,
          }}
          footer={<Total view={view} variant="s3" />}
          under={
            <ul className="under-buy">
              <li className="now"><CheckIcon />{PAY}</li>
              <li className="muted-line"><DocIcon />{FORM.arizaS3}</li>
              <li className="muted-line"><NoCardIcon />{NOCARD}</li>
            </ul>
          } />
      </main>
      <Pixels metaPixelId={page.metaPixelId} tiktokPixelId={page.tiktokPixelId} />
    </div>
  );
}
