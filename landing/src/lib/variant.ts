/**
 * S1/S3 bo‘linishi (SF-01, sinov-s1-s3.md «Qanday bo‘linadi»).
 * - Birinchi kirishda tasodifan 50/50. Sotuvchi tanlamaydi va ko‘rmaydi.
 * - 30 kun bir xil variant: TZ 01, 9-qoida (dublikat muddati).
 * Fayl edge (middleware) va Node’da bir xil ishlaydi: faqat Web Crypto ishlatiladi.
 */
export const VARIANTS = ["s1", "s3"] as const;
export type Variant = (typeof VARIANTS)[number];

export const VARIANT_COOKIE = "elchi_variant";
export const VARIANT_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export const isVariant = (value: unknown): value is Variant =>
  typeof value === "string" && (VARIANTS as readonly string[]).includes(value);

/** Tasodifiy bayt: juft — s1, toq — s3. 256 qiymatning aynan yarmi har variantga tushadi. */
export const variantFromByte = (byte: number): Variant => ((byte & 1) === 0 ? "s1" : "s3");

export type RandomByte = () => number;

export const cryptoRandomByte: RandomByte = () => crypto.getRandomValues(new Uint8Array(1))[0];

export const pickVariant = (random: RandomByte = cryptoRandomByte): Variant => variantFromByte(random());

/** Cookie’dagi variant to‘g‘ri bo‘lsa — o‘sha; yo‘q yoki buzuq bo‘lsa — yangi tanlov va cookie yoziladi. */
export function resolveVariant(cookieValue: string | undefined, random: RandomByte = cryptoRandomByte): { variant: Variant; assigned: boolean } {
  if (isVariant(cookieValue)) return { variant: cookieValue, assigned: false };
  return { variant: pickVariant(random), assigned: true };
}

/**
 * HttpOnly: variantni sahifa marshrutdan biladi, brauzer skriptlari cookie’ni o‘qimaydi.
 * SameSite=Lax: reklamadagi havoladan o‘tishda ham cookie yuboriladi.
 */
export const variantCookieOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: VARIANT_COOKIE_MAX_AGE,
});
