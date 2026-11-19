"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BackendError, createLead, type LeadResult } from "@/lib/backend";
import { encodeLeadCookie, LEAD_COOKIE, LEAD_COOKIE_MAX_AGE } from "@/lib/lead-cookie";
import { buildLead, errorsFromBackend, readForm, validate, type FormState } from "@/lib/lead-form";
import { landingUrl } from "@/lib/routing";

/**
 * Buyurtma formasi → backend `POST /leads` (SF-02: «o‘z route handler i orqali, haqiqiy IP va user agent bilan»).
 * Next Server Action — shu ilovaning serveridagi handler: JS siz forma oddiy POST bo‘lib keladi,
 * xato bo‘lsa sahifa yozilganlar bilan qaytadi (forma-10, forma-11), muvaffaqiyatda «Rahmat» ga 303.
 * Lead pikseli faqat «Rahmat» da, lid yozilgandan keyin (LID-3); server xatosida «Rahmat» ochilmaydi (TC2).
 */
export async function submitLead(previous: FormState, form: FormData): Promise<FormState> {
  const incoming = await headers();
  const parsed = readForm(form, incoming.get("referer"));
  const state = (status: FormState["status"], errors: FormState["errors"] = {}): FormState => ({ status, errors, values: parsed.values, js: parsed.js });

  if (!parsed.code) return state("error");
  const errors = validate(parsed.values);
  if (Object.keys(errors).length) return state("invalid", errors);

  let result: LeadResult;
  try {
    result = await createLead(buildLead({ ...parsed, code: parsed.code }), {
      forwardedFor: incoming.get("x-forwarded-for"),
      userAgent: incoming.get("user-agent"),
    });
  } catch (error) {
    console.error(`lead ${parsed.code}:`, error instanceof BackendError ? error.message : (error as Error).message);
    return state("error");
  }

  if (result.kind === "invalid") {
    const fieldErrors = errorsFromBackend(result.fields, result.messages);
    if (!fieldErrors) console.error(`lead ${parsed.code}: 400 ${result.fields.join(",")}`);
    return fieldErrors ? state("invalid", fieldErrors) : state("error");
  }
  // Sahifa yo‘q yoki ariza qabul qilmaydi (sotuvchi sahifasi to‘xtatilgan) — sahifaning o‘zi holatni ko‘rsatadi (TC8).
  if (result.kind !== "created") redirect(landingUrl(parsed.code));

  const store = await cookies();
  store.set(LEAD_COOKIE, encodeLeadCookie({
    code: parsed.code,
    leadId: result.leadId,
    duplicate: result.duplicate,
    name: parsed.values.name,
    phone: `+998${parsed.values.phone}`,
    where: parsed.values.whereDeliver,
    // forma-13: yashirin maydon to‘ldirilsa bot oddiy «Rahmat» ko‘radi, piksel yo‘q; rahmat-4: dublikatda yangi lid va piksel yo‘q.
    pixel: !result.duplicate && !parsed.honeypot,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: incoming.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: LEAD_COOKIE_MAX_AGE,
  });
  void previous;
  redirect(landingUrl(parsed.code, "rahmat"));
}
