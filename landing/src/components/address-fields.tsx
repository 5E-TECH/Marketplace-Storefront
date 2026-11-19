"use client";

import { useState, useSyncExternalStore } from "react";
import { regionOfDistrict } from "@/lib/address";
import type { RegionGroup } from "@/lib/contract";
import { FIELDS, type FieldKey, type FormValues } from "@/lib/lead-form";
import { FORM } from "@/lib/texts";
import { AlertIcon } from "./icons";

type Errors = Partial<Record<FieldKey, string>>;

/**
 * Brauzerda JS ishlayaptimi: serverda va gidratsiyada `false` (JS siz ko‘rinish bilan bir xil HTML), keyin `true`.
 * Effekt emas — forma qayta chizilganda (xatodan keyin) JS siz ko‘rinish bir lahza ham chiqmaydi va fokus yo‘qolmaydi.
 */
const noop = () => () => {};
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p className="field__error" id={id}><AlertIcon />{message}</p> : null;
}

/**
 * Manzil bloki (SF-06, holat-matnlari.md:383, forma-17…22) — telefondan keyin, rozilikdan oldin; S1 va S3 da bir xil.
 * Serverda va JS siz: bitta «Tuman yoki shahar» ro‘yxati, viloyatlar `optgroup` sarlavha (forma-22, ega 2026-11-16).
 * JS bilan: «Viloyat» → «Tuman yoki shahar» (viloyat tanlanmaguncha yopiq, forma-17); viloyat almashsa tuman tozalanadi
 * (forma-18 [taklif]). Tanlagich — brauzerning o‘z ro‘yxati; telefonda u pastdan chiqadi [taklif: forma-19 dagi
 * qidiruvli varaq keyinroq]. Ro‘yxat yuklanmasa — forma-20, ariza yuborilmaydi (server tuman so‘raydi).
 */
export function AddressFields({ regions, values, errors, describedBy }: {
  regions: RegionGroup[] | null;
  values: FormValues;
  errors: Errors;
  describedBy: (key: FieldKey) => string | undefined;
}) {
  const hydrated = useHydrated();
  const [region, setRegion] = useState(values.regionSoato || (regions ? regionOfDistrict(regions, values.districtSoato) ?? "" : ""));
  const [district, setDistrict] = useState(values.districtSoato);

  const street = (
    <div className="field field--wide">
      <label htmlFor="manzil">{FORM.address}</label>
      <input className="input" id="manzil" name={FIELDS.address} type="text" autoComplete="street-address" maxLength={255}
        placeholder={FORM.addressPlaceholder} defaultValue={values.addressLine}
        aria-invalid={errors.address ? true : undefined} aria-describedby={describedBy("address")} />
      <FieldError id="manzil-xato" message={errors.address} />
    </div>
  );

  if (!regions) {
    return (
      <div className="fields fields--row">
        <div className="server-error field--wide" role="alert">
          <AlertIcon />
          <span>{FORM.listFailed} <a className="button-light" href="">{FORM.listRetry}</a></span>
        </div>
        <FieldError id="tuman-xato" message={errors.district ?? errors.region} />
        {street}
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="fields fields--row">
        <div className="field field--wide">
          <label htmlFor="tuman">{FORM.district}</label>
          <select className="input" id="tuman" name={FIELDS.district} defaultValue={values.districtSoato}
            aria-invalid={errors.district ? true : undefined} aria-describedby={describedBy("district")}>
            <option value="">{FORM.districtPlaceholderNoJs}</option>
            {regions.map((group) => (
              <optgroup key={group.satoCode} label={group.name}>
                {group.districts.map((item) => <option key={item.satoCode} value={item.satoCode}>{item.name}</option>)}
              </optgroup>
            ))}
          </select>
          <FieldError id="tuman-xato" message={errors.district ?? errors.region} />
        </div>
        {street}
      </div>
    );
  }

  const districts = regions.find((group) => group.satoCode === region)?.districts ?? [];
  return (
    <div className="fields fields--row">
      <div className="field">
        <label htmlFor="viloyat">{FORM.region}</label>
        <select className="input" id="viloyat" name={FIELDS.region} value={region}
          onChange={(event) => { setRegion(event.target.value); setDistrict(""); }}
          aria-invalid={errors.region ? true : undefined} aria-describedby={describedBy("region")}>
          <option value="">{FORM.regionPlaceholder}</option>
          {regions.map((group) => <option key={group.satoCode} value={group.satoCode}>{group.name}</option>)}
        </select>
        <FieldError id="viloyat-xato" message={errors.region} />
      </div>
      <div className="field">
        <label htmlFor="tuman">{FORM.district}</label>
        <select className="input" id="tuman" name={FIELDS.district} value={district} disabled={!region}
          onChange={(event) => setDistrict(event.target.value)}
          aria-invalid={errors.district ? true : undefined} aria-describedby={describedBy("district")}>
          <option value="">{region ? FORM.districtPlaceholder : FORM.districtClosed}</option>
          {districts.map((item) => <option key={item.satoCode} value={item.satoCode}>{item.name}</option>)}
        </select>
        <FieldError id="tuman-xato" message={errors.district} />
      </div>
      {street}
    </div>
  );
}
