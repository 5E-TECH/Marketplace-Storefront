/**
 * Mijozga ko‘rinadigan matnlar — faqat `elchi-lid-sotuv/docs/dizayn/storefront-yonalishlar/holat-matnlari.md`
 * (2026-11-08 versiyasi) dan, harfma-harf. Kalit nomi o‘sha hujjatdagi kalit yoki holat ID si.
 * S1 va S3 bu sahifalarda bir xil: 404 va xato sahifalarida variant yo‘q.
 */

/** 1-bo‘lim, umumiy satrlar. */
export const HEAD = "Elchi Market";
export const ARIZA = "Ariza — bu hali to‘lov emas.";
export const HOURS = "Qo‘ng‘iroqlar 09:00–21:00 (Toshkent vaqti).";
export const ASK = "Savolingiz bo‘lsa, qo‘ng‘iroq qiling";
/** {STEPS}, 1-qadam DZ-12 (2026-11-16) tahririda. */
export const STEPS = ["Ism, raqam va manzilni qoldirasiz", "Operator qo‘ng‘iroq qiladi", "Tasdiqlangach SMS keladi", "Tovarni olganda to‘laysiz"] as const;

/** 404-1 · Noma’lum kod · M1. */
export const NOT_FOUND = {
  title: "Bu havola bo‘yicha sahifa topilmadi",
  body: "Havola noto‘g‘ri ko‘chirilgan yoki sahifa endi ishlamaydi.",
  openedLink: "Siz ochgan havola",
  whatToDo: "Nima qilish mumkin",
  steps: [
    { title: "Reklamadagi havolani qayta bosib oching.", hint: "Instagram, Facebook yoki TikTok’dagi e’longa qayting — havola o‘sha yerda." },
    { title: "Havolani qo‘lda yozgan bo‘lsangiz, har bir harfini tekshiring.", hint: "Masalan, «q» va «g», «0» va «o» almashib qolishi mumkin." },
  ],
  whenOpened: "To‘g‘ri havola ochilganda",
} as const;

/** xato-1 · Sotuvchi sahifasi ochilmadi · M1. */
export const PAGE_ERROR = {
  title: "Sahifani ochib bo‘lmadi",
  body: "Server hozir javob bermayapti. Internet aloqasini tekshirib, birozdan keyin qayta urinib ko‘ring.",
  retry: "Qayta urinish",
  orderTitle: "Buyurtma bermoqchi edingizmi?",
  orderBody: "Reklamadagi havolani qayta bosib oching. Sahifa ochilgach, ariza qoldirasiz — operatorimiz qo‘ng‘iroq qilib, buyurtmani tasdiqlaydi.",
  question: "Savol bo‘lsa:",
} as const;

/** Pul: `262 000 so‘m`, oddiy bo‘shliq bilan (holat-matnlari.md, «Copy rules»). */
export const formatSum = (value: number): string => {
  const amount = Number.isFinite(value) ? Math.round(value) : 0;
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so‘m`;
};

/**
 * Aloqa telefoni EQ-05 javobidan keladi. Javob bo‘lmaguncha telefon bloki sahifada chiqmaydi:
 * bo‘sh joy qoldirilmaydi (sinov-s1-s3.md «Egadan kerak»; SF-07).
 */
export const supportPhone = (): string | null => process.env.NEXT_PUBLIC_SUPPORT_PHONE?.trim() || null;
