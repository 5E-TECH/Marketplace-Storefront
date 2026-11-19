"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { submitLead } from "@/app/actions";
import { TRACKING_FIELDS, type RegionGroup, type TrackingField, type WhereDeliver } from "@/lib/contract";
import { FIELD_ORDER, FIELDS, initialFormState, readForm, type FieldKey, type FormState } from "@/lib/lead-form";
import type { PriceView } from "@/lib/pricing";
import { formatPhoneLocal, phoneDigits } from "@/lib/phone";
import { landingUrl } from "@/lib/routing";
import { BUY, CONSENT, CONSENT_LINK, FORM } from "@/lib/texts";
import { trackingFromQuery } from "@/lib/tracking";
import type { Variant } from "@/lib/variant";
import { AddressFields } from "./address-fields";
import { AlertIcon } from "./icons";
import { DeliveryChoice } from "./price-block";
import { clickStorageKey, trackingStorageKey } from "./click-tracker";

const FIELD_IDS: Record<FieldKey, string> = { name: "ism", phone: "telefon", region: "viloyat", district: "tuman", address: "manzil", consent: "rozilik" };
/** forma-10 ro‘yxatidagi qisqa matnlar (holat-matnlari.md:423). */
const SHORT: Partial<Record<string, string>> = { [FORM.phoneError]: FORM.phoneErrorShort };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p className="field__error" id={id}><AlertIcon />{message}</p>;
}

/**
 * Buyurtma formasi asosi (SF-02): ism, telefon (+998, 2-3-2-2), rozilik, yashirin maydon, variant.
 * Manzil (viloyat, tuman, ko‘cha/uy — SF-06) telefondan keyin, rozilikdan oldin.
 * Yetkazish tanlovi ham shu komponentda: xatodan keyin tanlangani saqlanadi (P-1, forma-10/11).
 * S1 — tanlov forma tashqarisidagi narx blokida (`buybox`, `form` atributi bilan); S3 — forma ichidagi kartada (`summary`).
 * JS siz: `useActionState` server action bilan — oddiy POST, xato yozilganlar bilan qaytadi.
 * JS bilan: server action to‘g‘ridan-to‘g‘ri chaqiriladi — so‘rov yiqilsa (tarmoq, 502, deploy) sahifa xato
 * sahifasiga almashmaydi, forma-8 ko‘rsatiladi va yozilganlar qoladi; «Yuborilmoqda…», bir marta.
 */
export function LeadForm({ code, variant, formId, title, view, initialWhere, regions, buybox, summary, tracking, footer, under }: {
  code: string;
  variant: Variant;
  formId: string;
  title?: string;
  view: PriceView;
  initialWhere: WhereDeliver;
  /** `GET /regions/tree`; null — ro‘yxat yuklanmadi (forma-20). */
  regions: RegionGroup[] | null;
  buybox?: { head: ReactNode; after: ReactNode };
  summary?: { head: ReactNode; after: ReactNode };
  tracking?: Partial<Record<TrackingField, string>>;
  footer: ReactNode;
  under: ReactNode;
}) {
  const [serverState, formAction] = useActionState<FormState, FormData>(submitLead, initialFormState(initialWhere));
  const [clientState, setClientState] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();
  const state = clientState ?? serverState;
  const [phone, setPhone] = useState(state.values.phone ? formatPhoneLocal(state.values.phone) : "");
  const sending = useRef(false);

  useEffect(() => { setPhone(state.values.phone ? formatPhoneLocal(state.values.phone) : ""); }, [state]);
  useEffect(() => {
    // Xatodan keyin birinchi xato maydonga o‘tiladi (forma-3…6).
    const first = FIELD_ORDER.find((key) => state.errors[key]);
    if (state.js && first) document.getElementById(regions === null && (first === "region" || first === "district") ? "royxat" : FIELD_IDS[first])?.focus();
  }, [state, regions]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current) return; // ikki marta yuborishdan himoya
    sending.current = true;
    const data = new FormData(event.currentTarget);
    data.set(FIELDS.js, "1");
    try {
      const clickId = sessionStorage.getItem(clickStorageKey(code));
      if (clickId) data.set(FIELDS.clickId, clickId);
      const saved = sessionStorage.getItem(trackingStorageKey(code));
      const stored = { ...(saved ? (JSON.parse(saved) as Record<string, string>) : {}), ...trackingFromQuery(window.location.search) };
      for (const field of TRACKING_FIELDS) if (stored[field]) data.set(field, stored[field]);
    } catch { /* xususiy rejim: klik va parametrlar bo‘lmasa ham ariza ketadi */ }
    const submitted = readForm(data, null);
    startTransition(async () => {
      try {
        const next = await submitLead(state, data);
        if (next) setClientState(next); // muvaffaqiyatda server «Rahmat» ga o‘tkazadi
      } catch (error) {
        unstable_rethrow(error);
        setClientState({ status: "error", errors: {}, values: submitted.values, js: true, tracking: submitted.tracking });
      } finally {
        sending.current = false;
      }
    });
  };

  const where = state.status === "idle" ? initialWhere : state.values.whereDeliver;
  const choice = <DeliveryChoice key={`${state.status}-${where}`} view={view} variant={variant} form={buybox ? formId : undefined} selected={where} />;
  const hidden = { ...tracking, ...state.tracking };

  const errors = state.errors;
  const errorList = FIELD_ORDER.filter((key) => errors[key]);
  // forma-20: ro‘yxat yuklanmadi — manzil xatolari ro‘yxat blokiga olib boradi, ariza yuborilmaydi (SF-06 TC5).
  const listFailed = regions === null;
  const anchor = (key: FieldKey) => (listFailed && (key === "region" || key === "district") ? "royxat" : key === "region" && !state.js ? FIELD_IDS.district : FIELD_IDS[key]);
  const noJsServerError = state.status === "error" && !state.js;
  const describedBy = (key: FieldKey, extra?: string) => [errors[key] ? `${FIELD_IDS[key]}-xato` : null, extra].filter(Boolean).join(" ") || undefined;

  return (
    <>
    {buybox ? <section className="buybox">{buybox.head}{choice}{buybox.after}</section> : null}
    <form id={formId} className="form" action={formAction} onSubmit={onSubmit} noValidate>
      {noJsServerError ? (
        <>
          <h2 className="form__title">{FORM.notSentTitle}</h2>
          <p className="server-error" role="alert"><AlertIcon />{FORM.serverError}</p>
          <p>{FORM.notSentBody}</p>
        </>
      ) : null}
      {state.status === "invalid" && !state.js && errorList.length ? (
        <div className="summary" role="alert">
          <p><strong>{FORM.summary(errorList.length)}</strong></p>
          <ul>{errorList.map((key) => <li key={key}><a href={`#${anchor(key)}`}>{SHORT[errors[key] ?? ""] ?? errors[key]}</a></li>)}</ul>
        </div>
      ) : null}
      {summary ? <div className="card">{summary.head}{choice}{summary.after}</div> : null}
      {title ? <h1 className="form__title">{title}</h1> : null}
      <input type="hidden" name={FIELDS.code} value={code} />
      <input type="hidden" name={FIELDS.variant} value={variant} />
      {TRACKING_FIELDS.filter((field) => hidden[field]).map((field) => <input key={field} type="hidden" name={field} value={hidden[field]} />)}
      <div className="fields fields--row">
        <div className="field">
          <label htmlFor="ism">{FORM.name}</label>
          <input className="input" id="ism" name={FIELDS.name} type="text" autoComplete="name" maxLength={100}
            defaultValue={state.values.name} key={`ism-${state.values.name}`} aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy("name")} />
          <FieldError id="ism-xato" message={errors.name} />
        </div>
        <div className="field">
          <label htmlFor="telefon">{FORM.phone}</label>
          <div className="phone">
            <span className="phone__prefix" aria-hidden="true">{FORM.phonePrefix}</span>
            <input id="telefon" name={FIELDS.phone} type="tel" inputMode="tel" autoComplete="tel-national" placeholder={FORM.phonePlaceholder}
              value={phone} onChange={(event) => setPhone(formatPhoneLocal(phoneDigits(event.target.value)))}
              aria-invalid={errors.phone ? true : undefined} aria-describedby={describedBy("phone", "telefon-izoh")} />
          </div>
          <p className="field__hint" id="telefon-izoh">{variant === "s1" ? FORM.phoneHintS1 : FORM.phoneHintS3}</p>
          <FieldError id="telefon-xato" message={errors.phone} />
        </div>
      </div>
      <AddressFields key={`manzil-${state.status}-${state.values.districtSoato}-${state.values.addressLine}`} regions={regions} values={state.values} errors={errors} describedBy={(key) => describedBy(key)} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">{FORM.honeypot}</label>
        <input id="website" name={FIELDS.honeypot} type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="field">
        <label className="consent">
          <input id="rozilik" name={FIELDS.consent} type="checkbox" value="1" defaultChecked={state.values.consent} key={`rozilik-${state.values.consent}`}
            aria-invalid={errors.consent ? true : undefined} aria-describedby={describedBy("consent")} />
          <span>{CONSENT} <Link href="/oferta">{CONSENT_LINK}</Link></span>
        </label>
        <FieldError id="rozilik-xato" message={errors.consent} />
      </div>
      {footer}
      {state.status === "error" && state.js ? <p className="server-error" role="alert"><AlertIcon />{FORM.serverError}</p> : null}
      <button className="buy" type="submit" disabled={pending || listFailed}>{pending ? FORM.sending : noJsServerError ? FORM.resend : BUY}</button>
      {noJsServerError ? <Link className="button-light" href={landingUrl(code)}>{FORM.backToProduct}</Link> : under}
    </form>
    </>
  );
}
