/**
 * Telefon maydoni (sf-tizim:199-216, 598): «+998» qotirilgan, keyin 9 raqam, ko‘rinishi 2-3-2-2.
 * Operator kodi frontendda tekshirilmaydi: ro‘yxat ega tasdig‘ida (be11-be12-savollar.md 1-savol),
 * backend `LEAD_PHONE_OPERATOR_CODES` dan tekshiradi va 400 qaytaradi — forma-5 matni shundan.
 */
export const PHONE_DIGITS = 9;

/** Yozilgan qiymatdan 9 raqam: bo‘shliq, qavs, tire olinadi; «+998» yoki «998» bilan qo‘yilsa ham. */
export function phoneDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > PHONE_DIGITS && digits.startsWith("998")) digits = digits.slice(3);
  return digits.slice(0, PHONE_DIGITS);
}

/** «901234567» → «90 123 45 67»; to‘liq bo‘lmasa ham shu guruhlar bilan («90 12»). */
export function formatPhoneLocal(digits: string): string {
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return groups.filter(Boolean).join(" ");
}

export const toE164 = (digits: string): string | null => (/^\d{9}$/.test(digits) ? `+998${digits}` : null);

/** «+998901234567» → «+998 90 123 45 67» (rahmat-1). */
export const formatPhoneFull = (e164: string): string => `+998 ${formatPhoneLocal(e164.replace(/^\+998/, ""))}`;
