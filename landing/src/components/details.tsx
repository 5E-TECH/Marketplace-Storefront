import type { LandingPageProduct } from "@/lib/contract";
import { totalFor, type PriceView } from "@/lib/pricing";
import { faqS3, formatSum, PRODUCT } from "@/lib/texts";
import { CheckIcon } from "./icons";

/**
 * Birinchi ekrandan keyingi bloklar (standart-1). Ma’lumot offer kartasidan; bo‘sh kelgan blok
 * chiqmaydi [taklif] (dizayn-oqish.md 12-bo‘lim, 13-savol). S1 dagi «Quloqchin haqida» sarlavhasi
 * tovarga xos — umumiy «Tovar haqida» olinadi (S3 dagi kabi) [taklif].
 */
const lowerFirst = (text: string) => (/^\p{Lu}\p{Ll}/u.test(text) ? text[0].toLocaleLowerCase("uz") + text.slice(1) : text);

function Benefits({ items }: { items: string[] }) {
  return <ul className="benefits">{items.map((item) => <li key={item}><CheckIcon size={22} width={1.75} />{item}</li>)}</ul>;
}

function Specs({ specs }: { specs: LandingPageProduct["specs"] }) {
  return <dl className="specs">{specs.map((spec) => <div key={spec.name}><dt>{spec.name}</dt><dd>{spec.value}</dd></div>)}</dl>;
}

/** S1: «Tovar haqida», «Qutida», «Xususiyatlar», «Yetkazish va to‘lov». «Muddat» va «Qaytarish» qatorlari ega javobigacha yo‘q (P-7). */
export function DetailsS1({ product, view }: { product: LandingPageProduct; view: PriceView }) {
  return (
    <div className="details-grid">
      {product.highlights.length ? <section className="section"><h2>{PRODUCT.about}</h2><Benefits items={product.highlights} /></section> : null}
      {product.boxContents.length ? (
        <section className="section"><h2>{PRODUCT.boxS1}</h2><p>{product.boxContents.map((item, index) => (index ? lowerFirst(item) : item)).join(", ")}.</p></section>
      ) : null}
      {product.specs.length ? <section className="section"><h2>{PRODUCT.specs}</h2><Specs specs={product.specs} /></section> : null}
      <section className="section">
        <h2>{PRODUCT.deliveryS1}</h2>
        <p>{PRODUCT.deliveryIntro}</p>
        <dl className="rows">
          {view.free ? (
            <div><dt>{PRODUCT.delivery}</dt><dd>{PRODUCT.freeRowValue}</dd></div>
          ) : (
            <>
              <div><dt>{PRODUCT.center}</dt><dd className="nowrap">{formatSum(view.center)}</dd></div>
              <div><dt>{PRODUCT.address}</dt><dd className="nowrap">{formatSum(view.address)}</dd></div>
            </>
          )}
          <div><dt>{PRODUCT.payRow}</dt><dd>{PRODUCT.payRowValue}</dd></div>
        </dl>
      </section>
    </div>
  );
}

export function NextStepsS1() {
  return (
    <section className="section">
      <h2>{PRODUCT.nextTitle}</h2>
      <ol className="numbered">{PRODUCT.nextS1.map((step) => <li key={step}><span>{step}</span></li>)}</ol>
    </section>
  );
}

/** S3: «Qutida nima bor», «Tovar haqida» (foyda va xususiyatlar), «Yetkazish narxi» jadvali. */
export function DetailsS3({ product, view }: { product: LandingPageProduct; view: PriceView }) {
  return (
    <div className="details-grid">
      {product.boxContents.length ? <section className="section"><h2>{PRODUCT.boxS3}</h2><Benefits items={product.boxContents} /></section> : null}
      {product.highlights.length || product.specs.length ? (
        <section className="section"><h2>{PRODUCT.about}</h2>{product.highlights.length ? <Benefits items={product.highlights} /> : null}{product.specs.length ? <Specs specs={product.specs} /> : null}</section>
      ) : null}
      <section className="section">
        <h2>{PRODUCT.deliveryS3}</h2>
        <p>{PRODUCT.deliveryIntro}</p>
        {view.free ? (
          <dl className="rows"><div><dt>{PRODUCT.delivery}</dt><dd>{PRODUCT.freeRowValue}</dd></div></dl>
        ) : (
          <table className="table">
            <thead><tr><th scope="col">{PRODUCT.tableWhere}</th><th scope="col">{PRODUCT.tableDelivery}</th><th scope="col">{PRODUCT.tableTotal}</th></tr></thead>
            <tbody>
              <tr><td>{PRODUCT.center}</td><td className="nowrap">{formatSum(view.center)}</td><td>{formatSum(totalFor(view, "CENTER"))}</td></tr>
              <tr><td>{PRODUCT.address}</td><td className="nowrap">{formatSum(view.address)}</td><td>{formatSum(totalFor(view, "ADDRESS"))}</td></tr>
            </tbody>
          </table>
        )}
        <p className="hint">{PRODUCT.s3SmsNote}</p>
      </section>
    </div>
  );
}

/** S3 «Savollar va javoblar»: ega javobiga bog‘liq uch savol olinadi (texts.ts `faqS3`). */
export function FaqS3({ view }: { view: PriceView }) {
  return (
    <section className="faq">
      <div className="wrap">
        <h2 className="block__title">{PRODUCT.faqTitle}</h2>
        <dl>{faqS3(formatSum(view.center), formatSum(view.address), view.free).map((item) => <div key={item.q}><dt>{item.q}</dt><dd>{item.a}</dd></div>)}</dl>
      </div>
    </section>
  );
}
