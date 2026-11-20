import type { WhereDeliver } from "@/lib/contract";
import { totalFor, type PriceView } from "@/lib/pricing";
import { BAD_NOTICE, formatSum, MARKAZ, PAY, PRODUCT } from "@/lib/texts";
import type { Variant } from "@/lib/variant";
import { CheckIcon } from "./icons";

/**
 * Yetkazish tanlovi (radio-karta, sf-tizim:263-273). «Markazgacha» sukut bo‘yicha tanlangan.
 * S1 da tanlov forma tashqarisida turadi — `form` atributi bilan formaga qo‘shiladi (JS siz ham yuboriladi, P-1).
 * Narx: S1 «+ 30 000 so‘m», S3 «30 000 so‘m» (holat-matnlari.md:82).
 */
export function DeliveryChoice({ view, variant, form, selected = "CENTER" }: { view: PriceView; variant: Variant; form?: string; selected?: WhereDeliver }) {
  if (view.free) return <p className="free-note">{PRODUCT.freeDelivery}</p>;
  const fee = (sum: number) => (variant === "s1" ? `+ ${formatSum(sum)}` : formatSum(sum));
  const options: Array<{ value: WhereDeliver; name: string; sum: number }> = [
    { value: "CENTER", name: PRODUCT.center, sum: view.center },
    { value: "ADDRESS", name: PRODUCT.address, sum: view.address },
  ];
  return (
    <>
      <fieldset className="choices">
        <legend className="sr-only">{PRODUCT.delivery}</legend>
        {options.map((option) => (
          <label className="choice" key={option.value}>
            <input type="radio" name="whereDeliver" value={option.value} defaultChecked={option.value === selected} form={form} />
            <span><span className="choice__name">{option.name}</span><span className="choice__fee">{fee(option.sum)}</span></span>
          </label>
        ))}
      </fieldset>
      <p className="hint">{MARKAZ}</p>
    </>
  );
}

/**
 * «Jami» (narx-1, narx-2): tanlangan yetkazish bo‘yicha. Ikkala summa sahifada bor, ko‘rinishini CSS
 * (`:has(:checked)`) almashtiradi — JS siz ham to‘g‘ri (standart-4 dagi S3 qo‘shimcha qatori kerak emas).
 * S1: «Eshikkacha bo‘lsa — …»; S3: «markazgacha» / «eshikkacha».
 */
export function Total({ view, variant }: { view: PriceView; variant: Variant }) {
  const center = formatSum(totalFor(view, "CENTER"));
  const address = formatSum(totalFor(view, "ADDRESS"));
  if (view.free) return <p className="total"><span className="total__sum">{PRODUCT.total} {center}</span></p>;
  return (
    <p className="total">
      <span className="total__sum"><span className="if-center">{PRODUCT.total} {center}</span><span className="if-address">{PRODUCT.total} {address}</span></span>
      {variant === "s1" ? (
        <span className="total__other"><span className="if-center">{PRODUCT.ifAddress} {address}</span><span className="if-address">{PRODUCT.ifCenter} {center}</span></span>
      ) : (
        <span className="total__other"><span className="if-center">{PRODUCT.centerShort}</span><span className="if-address">{PRODUCT.addressShort}</span></span>
      )}
    </p>
  );
}

/** {PAY} va BAD tovarda «Dori vositasi emas» — {PAY} ostida, tugmadan oldin (narx-5, standart-8). */
export function PayLine({ bad }: { bad: boolean }) {
  return (
    <>
      <p className="payline"><CheckIcon />{PAY}</p>
      {bad ? <p className="bad">{BAD_NOTICE}</p> : null}
    </>
  );
}

export function PriceHead({ name, subtitle, product }: { name: string; subtitle: string | null; product: number }) {
  return (
    <>
      <h1>{name}</h1>
      {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      <p className="pricerow"><span className="pricerow__sum">{formatSum(product)}</span><span className="pricerow__hint">{PRODUCT.productPrice}</span></p>
    </>
  );
}
