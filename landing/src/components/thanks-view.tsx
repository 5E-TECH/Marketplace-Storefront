/* eslint-disable @next/next/no-img-element -- rasm offer kartasidagi CDN manzilidan; host EQ-05 gacha noma’lum */
import type { LandingPage } from "@/lib/contract";
import type { LeadCookie } from "@/lib/lead-cookie";
import { formatPhoneFull } from "@/lib/phone";
import { deliveryFee, priceView, totalFor } from "@/lib/pricing";
import { BAD_NOTICE, formatSum, NOCARD, PAY, PRODUCT, THANKS } from "@/lib/texts";
import type { Variant } from "@/lib/variant";
import { CheckIcon, NoCardIcon, PhoneIcon } from "./icons";

/**
 * «Rahmat» (rahmat-1…6): mijoz yozgan ism va raqam, tovar, tanlangan yetkazish, Jami. Lid raqami, manzil
 * va sana ko‘rsatilmaydi (taxtalarda yo‘q). Dublikat — rahmat-4 [taklif — 9-qoida], ish vaqtidan tashqari — rahmat-3.
 */
export function ThanksView({ page, lead, variant, offHours }: { page: LandingPage; lead: LeadCookie; variant: Variant; offHours: boolean }) {
  const view = priceView(page.price);
  const total = formatSum(totalFor(view, lead.where));
  const fee = formatSum(deliveryFee(view, lead.where));
  const product = formatSum(view.product);
  const phone = formatPhoneFull(lead.phone);
  const badge = <span className="thanks__badge"><CheckIcon size={28} width={2.6} /></span>;
  const call = (
    <>
      <p>{THANKS.callTo}</p>
      <p className="callbox__number">{phone}</p>
    </>
  );

  if (variant === "s1") {
    const deliveryLabel = view.free ? THANKS.s1Steps.deliveryFree : lead.where === "ADDRESS" ? THANKS.s1Steps.deliveryAddress : THANKS.s1Steps.deliveryCenter;
    return (
      <section className="thanks" data-page="rahmat">
        <div className="thanks">
          <div className="thanks__ok" role="status">
            {badge}
            <h1 className="thanks__title">{THANKS.hello(lead.name)}<br />{lead.duplicate ? THANKS.duplicate : THANKS.accepted}</h1>
            {lead.duplicate ? <p>{THANKS.duplicateBody}</p> : null}
          </div>
          <div className="callbox">
            <p className="callbox__title"><PhoneIcon />{offHours ? THANKS.offHours : THANKS.callS1}</p>
            {call}
          </div>
        </div>
        <ol className="numbered">
          <li><div><h2 className="block__title">{THANKS.s1Steps.answer}</h2><p>{THANKS.s1Steps.answerBody}</p></div></li>
          <li>
            <div className="sumrows">
              <h2 className="block__title">{THANKS.s1Steps.sum}</h2>
              <div><span>{page.product.name}</span><span className="nowrap">{product}</span></div>
              {page.product.isBad ? <p className="bad">{BAD_NOTICE}</p> : null}
              <div><span>{deliveryLabel}</span>{view.free ? null : <span className="nowrap">{fee}</span>}</div>
              <p className="sumrows__total">{PRODUCT.total} {total}</p>
              <p className="muted">{THANKS.s1Steps.operatorSame}</p>
            </div>
          </li>
          <li><div><h2 className="block__title">{THANKS.s1Steps.sms}</h2><p>{THANKS.s1Steps.smsBody}</p></div></li>
          <li><div><h2 className="block__title payline"><CheckIcon />{THANKS.s1Steps.pay}</h2><p>{THANKS.s1Steps.payBody}</p></div></li>
        </ol>
      </section>
    );
  }

  return (
    <section className="thanks" data-page="rahmat">
      <div className="thanks">
        <div className="thanks__ok" role="status">
          {badge}
          <h1 className="thanks__title">{THANKS.hello(lead.name)} {lead.duplicate ? THANKS.duplicate : THANKS.accepted}</h1>
          {lead.duplicate ? <p>{THANKS.duplicateBody}</p> : null}
          <p>{THANKS.s3Sub}</p>
        </div>
        <div className="callbox">
          <h2 className="callbox__title"><PhoneIcon />{offHours ? THANKS.offHours : THANKS.callS3}</h2>
          <p>{THANKS.callS3Body}</p>
          {call}
        </div>
        <div className="card">
          <div className="card__product">
            {page.product.images[0] ? <img src={page.product.images[0]} alt="" /> : <span className="card__thumb" />}
            <div><p className="block__title">{page.product.name}</p>{page.product.isBad ? <p className="bad">{BAD_NOTICE}</p> : null}</div>
          </div>
          <p className="sumrows__total">{PRODUCT.total} {total}</p>
          {view.free ? null : <p>{THANKS.s3.sumLine(product, fee)}</p>}
          <p className="payline"><CheckIcon />{PAY}</p>
        </div>
      </div>
      <div>
        <h2 className="block__title">{PRODUCT.nextTitle}</h2>
        <ol className="numbered">{THANKS.s3.steps(lead.where, total).map((step) => <li key={step}><span>{step}</span></li>)}</ol>
        <p className="payline muted"><NoCardIcon />{NOCARD}</p>
      </div>
    </section>
  );
}
