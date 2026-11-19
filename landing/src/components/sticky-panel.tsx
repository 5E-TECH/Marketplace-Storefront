import { totalFor, type PriceView } from "@/lib/pricing";
import { BUY, formatSum, PAY, PRODUCT } from "@/lib/texts";
import type { Variant } from "@/lib/variant";
import { CheckIcon } from "./icons";

const Sum = ({ view }: { view: PriceView }) => (
  <span className="sticky__value">
    <span className="if-center">{formatSum(totalFor(view, "CENTER"))}</span>
    {view.free ? null : <span className="if-address">{formatSum(totalFor(view, "ADDRESS"))}</span>}
  </span>
);

/**
 * {STICKY} (standart-2): «Jami», tanlangan summa, {BUY}. Sahifaning oxirgi bolasi, `position:sticky` —
 * birinchi blok (`.lp-first`, z-index 2) ekrandan chiqqach ko‘rinadi, faqat CSS. Kompyuterda yo‘q.
 * S1: «Ismingiz» ga (`#ism`, JS siz); S3: buyurtma qadami (tanlangan yetkazish bilan, `form="s3-order"`).
 */
export function StickyPanel({ view, variant }: { view: PriceView; variant: Variant }) {
  return (
    <div className="sticky">
      <span className="sticky__sum"><span className="sticky__label">{PRODUCT.total}</span><Sum view={view} /></span>
      {variant === "s1" ? <a className="buy" href="#ism">{BUY}</a> : <button className="buy" type="submit" form="s3-order">{BUY}</button>}
    </div>
  );
}

/** S1 kompyuter: panel o‘rnida tafsilotlardan keyin kulrang blok (S1-mahsulot:136-203; tugma rangi — P-4). */
export function DesktopCta({ name, view }: { name: string; view: PriceView }) {
  return (
    <div className="desk-cta">
      <div><p className="block__title">{name}</p><p className="payline"><CheckIcon />{PAY}</p></div>
      <span className="sticky__sum"><span className="sticky__label">{PRODUCT.total}</span><Sum view={view} /></span>
      <a className="buy" href="#ism">{BUY}</a>
    </div>
  );
}
