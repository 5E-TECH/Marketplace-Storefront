"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { submitLead } from "@/app/actions";
import { TRACKING_FIELDS } from "@/lib/contract";
import { FIELDS, initialFormState, type FieldKey, type FormState } from "@/lib/lead-form";
import { formatPhoneLocal, phoneDigits } from "@/lib/phone";
import { landingUrl } from "@/lib/routing";
import { BUY, CONSENT, CONSENT_LINK, FORM } from "@/lib/texts";
import { trackingFromQuery } from "@/lib/tracking";
import type { Variant } from "@/lib/variant";
import { AlertIcon } from "./icons";
import { clickStorageKey, trackingStorageKey } from "./click-tracker";

const FIELD_IDS: Record<FieldKey, string> = { name: "ism", phone: "telefon", consent: "rozilik" };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p className="field__error" id={id}><AlertIcon />{message}</p>;
}

/**
 * Buyurtma formasi asosi (SF-02): ism, telefon (+998, 2-3-2-2), rozilik, yashirin maydon, variant.
 * Manzil maydonlari (viloyat, tuman, ko‘cha/uy) SF-06 da shu joyga — telefondan keyin, rozilikdan oldin.
 * JS bilan: yuborish qo‘lda (React 19 forma maydonlarini avtomatik tozalamasin), «Yuborilmoqda…», bir marta.
 * JS siz: oddiy POST, server xatoni yozilganlar bilan qaytaradi (forma-10, forma-11).
 */
export function LeadForm({ code, variant, formId, title, summary, footer, under }: {
  code: string;
  variant: Variant;
  formId: string;
  title?: string;
  summary?: ReactNode;
  footer: ReactNode;
  under: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitLead, initialFormState());
  const [phone, setPhone] = useState(state.values.phone ? formatPhoneLocal(state.values.phone) : "");
  const sending = useRef(false);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => { if (!pending) sending.current = false; }, [pending]);
  useEffect(() => { setPhone(state.values.phone ? formatPhoneLocal(state.values.phone) : ""); }, [state]);
  useEffect(() => {
    // Xatodan keyin birinchi xato maydonga o‘tiladi (forma-3…6).
    const first = (["name", "phone", "consent"] as const).find((key) => state.errors[key]);
    if (state.js && first) document.getElementById(FIELD_IDS[first])?.focus();
  }, [state]);

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
      const tracking = { ...(saved ? (JSON.parse(saved) as Record<string, string>) : {}), ...trackingFromQuery(window.location.search) };
      for (const field of TRACKING_FIELDS) if (tracking[field]) data.set(field, tracking[field]);
    } catch { /* xususiy rejim: klik va parametrlar bo‘lmasa ham ariza ketadi */ }
    startTransition(() => formAction(data));
  };

  const errors = state.errors;
  const errorList = (Object.keys(FIELD_IDS) as FieldKey[]).filter((key) => errors[key]);
  const noJsServerError = state.status === "error" && !state.js;
  const describedBy = (key: FieldKey, extra?: string) => [errors[key] ? `${FIELD_IDS[key]}-xato` : null, extra].filter(Boolean).join(" ") || undefined;

  return (
    <form id={formId} ref={form} className="form" action={formAction} onSubmit={onSubmit} noValidate>
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
          <ul>{errorList.map((key) => <li key={key}><a href={`#${FIELD_IDS[key]}`}>{key === "phone" && errors.phone === FORM.phoneError ? FORM.phoneErrorShort : errors[key]}</a></li>)}</ul>
        </div>
      ) : null}
      {summary}
      {title ? <h1 className="form__title">{title}</h1> : null}
      <input type="hidden" name={FIELDS.code} value={code} />
      <input type="hidden" name={FIELDS.variant} value={variant} />
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
      <button className="buy" type="submit" disabled={pending}>{pending ? FORM.sending : noJsServerError ? FORM.resend : BUY}</button>
      {noJsServerError ? <Link className="button-light" href={landingUrl(code)}>{FORM.backToProduct}</Link> : under}
    </form>
  );
}
