/* eslint-disable @next/next/no-img-element -- rasm offer kartasidagi CDN manzilidan; host EQ-05 gacha noma’lum */
import type { LandingPage } from "@/lib/contract";
import { ASK, BAD_NOTICE, formatSum, PRODUCT, STOPPED } from "@/lib/texts";
import { OpenedLink } from "./opened-link";
import { SupportContact } from "./support-contact";

/**
 * Buyurtma qabul qilinmaydigan sahifa (toxtatilgan-1…3, SF-02 TC8). BAD tovarda V1 da ham «Dori vositasi emas» (holat-matnlari.md:578): forma, xarid tugmasi va Lead hodisasi yo‘q,
 * qaytish sanasi yo‘q. Holat BE-11 dan: OUT_OF_STOCK → V1, NOT_ACCEPTED → V2, WITHDRAWN → V3.
 * V1 dagi «Qaytganda xabar bering» (toxtatilgan-4…9) [taklif — 5-, 60-qaror] — qurilmaydi.
 * Telefon (EQ-05) sozlanmagan bo‘lsa {ASK} bloki chiqmaydi. Sahifalarning to‘liq ko‘rinishi SF-07 da.
 */
export function StoppedView({ page }: { page: LandingPage }) {
  const { product } = page;
  if (page.state === "WITHDRAWN") {
    return (
      <section className="stopped" data-page="toxtatilgan" data-state={page.state}>
        <div className="notice notice--neutral">
          <h1 className="block__title">{STOPPED.withdrawnTitle}</h1>
          <p>{STOPPED.withdrawnBody}</p>
          <OpenedLink />
        </div>
        <SupportContact lead={ASK} hoursFirst />
      </section>
    );
  }
  const outOfStock = page.state === "OUT_OF_STOCK";
  return (
    <section className="stopped" data-page="toxtatilgan" data-state={page.state}>
      <div className={`stopped__photo${outOfStock ? " stopped__photo--dim" : ""}`}>{product.images[0] ? <img src={product.images[0]} alt={product.name} /> : null}</div>
      <h1 className="block__title">{product.name}</h1>
      {product.subtitle ? <p className="subtitle">{product.subtitle}</p> : null}
      {outOfStock ? (
        <>
          <span className="tag">{STOPPED.outOfStockTag}</span>
          <p className="muted nowrap">{formatSum(page.price.salePrice)}</p>
          {product.isBad ? <p className="bad">{BAD_NOTICE}</p> : null}
          <p className="notice">{STOPPED.outOfStock}</p>
        </>
      ) : (
        <p className="notice">{STOPPED.notAccepted}</p>
      )}
      <section className="section">
        <h2>{PRODUCT.about}</h2>
        {outOfStock && product.description ? <p>{product.description}</p> : null}
        {!outOfStock && product.highlights.length ? <ul className="benefits">{product.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        {outOfStock && product.boxContents.length ? <p><strong>{STOPPED.box}</strong> {product.boxContents.join(", ")}</p> : null}
        {product.specs.length ? <dl className="specs">{product.specs.map((spec) => <div key={spec.name}><dt>{spec.name}</dt><dd>{spec.value}</dd></div>)}</dl> : null}
      </section>
      <SupportContact lead={ASK} hoursFirst />
      {outOfStock ? <p className="muted">{STOPPED.keepLink}</p> : null}
    </section>
  );
}
