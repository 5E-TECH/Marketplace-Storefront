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

/*
 * ─── SF-02: sotuvchi sahifasi, forma va «Rahmat» ─────────────────────────────────────────────
 * Manba: holat-matnlari.md (standart-1, narx-1…8, forma-1…13, rahmat-1…6, toxtatilgan-1…3) va
 * S1/S3 taxtalari; o‘qish natijasi `elchi-lid-sotuv/mvp-plan/tahlil-2026-11-19/sf02/dizayn-oqish.md`.
 * S1 va S3 so‘zlari faqat «sotish usuli» jadvalida farq qiladi (holat-matnlari.md:77-91).
 */

/** 1-bo‘lim kalitlari (holat-matnlari.md:33-48). */
export const PAY = "To‘lov — tovarni olganingizda";
export const NOW = "Hozir hech narsa to‘lamaysiz";
export const NOCARD = "Operator karta raqami yoki SMS kodni so‘ramaydi.";
export const MARKAZ = "Markaz — viloyat yoki tuman markazi";
export const BUY = "Buyurtma berish";
export const CONSENT = "Shaxsiy ma’lumotlarimni qayta ishlashga va buyurtma bo‘yicha SMS olishga roziman.";
export const CONSENT_LINK = "Ommaviy oferta";
export const BAD_NOTICE = "Dori vositasi emas";

export const PRODUCT = {
  galleryLabel: "Tovar rasmlari va videosi",
  videoGalleryLabel: "Tovar videosi va rasmlari",
  videoChip: "Video",
  watchVideo: "Videoni ko‘rish",
  videoLabel: "Tovar videosi",
  videoLoading: "Yuklanmoqda…",
  videoFailed: "Videoni ochib bo‘lmadi.",
  videoFailedHint: "Internet sekin bo‘lishi mumkin.",
  retry: "Qayta urinish",
  showPhotos: "Rasmlarni ko‘rish",
  productPrice: "tovar narxi",
  delivery: "Yetkazish",
  center: "Markazgacha",
  address: "Eshikkacha",
  freeDelivery: "Yetkazish bepul",
  total: "Jami",
  centerShort: "markazgacha",
  addressShort: "eshikkacha",
  /** S1: «Eshikkacha bo‘lsa — 312 000 so‘m» / tanlangani eshikkacha bo‘lsa «Markazgacha bo‘lsa — …» (narx-2). */
  ifAddress: "Eshikkacha bo‘lsa —",
  ifCenter: "Markazgacha bo‘lsa —",
  s3CallLine: "Operator qo‘ng‘iroq qilib, tasdiqlaydi",
  about: "Tovar haqida",
  /** S1 «Qutida», S3 «Qutida nima bor». */
  boxS1: "Qutida",
  boxS3: "Qutida nima bor",
  specs: "Xususiyatlar",
  /** S1 «Yetkazish va to‘lov», S3 «Yetkazish narxi». */
  deliveryS1: "Yetkazish va to‘lov",
  deliveryS3: "Yetkazish narxi",
  deliveryIntro: "Elchi Pochta yetkazadi: viloyat va tuman markazigacha yoki eshikkacha.",
  payRow: "To‘lov",
  payRowValue: "tovarni olganingizda",
  freeRowValue: "haqi olinmaydi",
  tableWhere: "Qayergacha",
  tableDelivery: "Yetkazish",
  tableTotal: "Jami",
  s3SmsNote: "Tasdiqlangach SMS keladi. Posilka yo‘lga chiqqanda trek raqami bilan.",
  nextTitle: "Keyin nima bo‘ladi",
  /** S1 «Keyin nima bo‘ladi» (standart-1). */
  nextS1: [
    "Ism, raqam va manzilni qoldirasiz.",
    "Operatorimiz +998 bilan boshlanadigan raqamdan qo‘ng‘iroq qilib, buyurtmani tasdiqlaydi. Qo‘ng‘iroqlar 09:00–21:00 (Toshkent vaqti).",
    "Tasdiqlangach SMS keladi. Posilka yo‘lga chiqqanda trek raqami bilan SMS keladi.",
    "Tovarni olganingizda to‘laysiz.",
  ],
  faqTitle: "Savollar va javoblar",
  weight: "Og‘irligi",
  weightNote: "yetkazish narxi og‘irlikka qarab",
} as const;

/**
 * S3 «Savollar va javoblar». «Qachon keladi?», «Yoqmasa yoki buzuq bo‘lsa-chi?» va «Savolim bo‘lsa…»
 * javobi ega qaroriga bog‘liq (yetkazish muddati, EQ-10, EQ-05) — javob yo‘q, savol sahifadan olinadi
 * (sinov-s1-s3.md «Egadan kerak», P-7 [taklif]). Shu sabab S1 dagi «Muddat» va «Qaytarish» qatorlari ham yo‘q.
 */
export const faqS3 = (center: string, address: string, free: boolean) => [
  { q: "Qachon to‘layman?", a: "Tovarni olganingizda to‘laysiz. Ariza — bu hali to‘lov emas." },
  { q: "Kim qo‘ng‘iroq qiladi?", a: "Operatorimiz qo‘ng‘iroq qilib, buyurtmani tasdiqlaydi. Qo‘ng‘iroqlar 09:00–21:00 (Toshkent vaqti), +998 bilan boshlanadigan raqamdan." },
  { q: "Yetkazish qancha turadi?", a: free ? "Yetkazish haqi olinmaydi." : `Markazgacha ${center}, eshikkacha ${address}.` },
  { q: "Operator karta raqamini so‘raydimi?", a: "Yo‘q. Operator karta raqami yoki SMS kodni so‘ramaydi." },
  { q: "Manzilni qayerda aytaman?", a: "Buyurtma formasida yozasiz: viloyat, tuman, ko‘cha va uy. Operator qo‘ng‘iroqda tekshiradi." },
];

export const FORM = {
  /** S3-buyurtma sarlavhasi [taklif, DZ-12]. */
  s3Title: "Ism, raqam va manzilingizni qoldiring",
  name: "Ismingiz",
  phone: "Telefon raqamingiz",
  phonePrefix: "+998",
  phonePlaceholder: "90 123 45 67",
  phoneHintS1: "Shu raqamga operatorimiz qo‘ng‘iroq qiladi.",
  phoneHintS3: "Operator shu raqamga qo‘ng‘iroq qiladi.",
  honeypot: "Bu maydonni to‘ldirmang",
  sending: "Yuborilmoqda…",
  arizaS1: "Ariza — bu hali to‘lov emas. Operator karta raqami yoki SMS kodni so‘ramaydi.",
  arizaS3: "Ariza — bu hali to‘lov emas",
  nameError: "Ismingizni yozing",
  /** Namuna raqam NBSP bilan — qatorda bo‘linmaydi (forma-4). */
  phoneError: "Raqamni to‘liq kiriting: 9 ta raqam, masalan 90\u00a0123\u00a045\u00a067",
  /** forma-10 ro‘yxatidagi qisqa ko‘rinish. */
  phoneErrorShort: "Raqamni to‘liq kiriting",
  operatorError: "Bu raqam O‘zbekiston mobil operatoriga tegishli emas",
  consentError: "Davom etish uchun rozilik belgisini qo‘ying",
  /** Manzil (SF-06, holat-matnlari.md:383, forma-17…22). */
  region: "Viloyat",
  regionPlaceholder: "Viloyatni tanlang",
  district: "Tuman yoki shahar",
  districtClosed: "Avval viloyatni tanlang",
  districtPlaceholder: "Tumanni tanlang",
  /** forma-22: JS siz bitta guruhlangan ro‘yxat. */
  districtPlaceholderNoJs: "Tuman yoki shaharni tanlang",
  address: "Ko‘cha, uy",
  addressPlaceholder: "Masalan: Navoiy ko‘chasi, 12-uy",
  regionError: "Viloyatni tanlang",
  districtError: "Tuman yoki shaharni tanlang",
  addressError: "Ko‘cha va uyni kiriting",
  /** forma-20 [taklif]. */
  listFailed: "Ro‘yxatni yuklab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.",
  listRetry: "Qayta urinish",
  serverError: "Arizani yuborib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.",
  /** forma-10: «Arizani yuborib bo‘lmadi — {N} ta maydonni to‘g‘rilang:». */
  summary: (count: number) => `Arizani yuborib bo‘lmadi — ${count} ta maydonni to‘g‘rilang:`,
  /** forma-11 (JS siz server xatosi). */
  notSentTitle: "Arizangiz hali yuborilmadi",
  notSentBody: "Yozganlaringiz quyida turibdi — tekshirib, qayta yuboring.",
  resend: "Qayta yuborish",
  backToProduct: "Tovar sahifasiga qaytish",
  back: { s1: "Orqaga", s3: "Ortga" },
} as const;

export const THANKS = {
  /** rahmat-1 S1: ikki qator; S3: bitta sarlavha. */
  hello: (name: string) => `Rahmat, ${name}!`,
  accepted: "Arizangiz qabul qilindi",
  s3Sub: "Ariza — bu hali to‘lov emas. Hozir hech narsa to‘lamaysiz.",
  /** rahmat-4 [taklif — 9-qoida]: dublikat. */
  duplicate: "Bu tovarga arizangiz bizda bor",
  duplicateBody: "Yangisi ochilmadi, ikki marta buyurtma bo‘lmaydi.",
  callS1: "Endi telefoningizni yoningizda tuting: operatorimiz qo‘ng‘iroq qiladi.",
  callS3: "Endi qo‘ng‘iroqni kuting va javob bering",
  callS3Body: "Operatorimiz +998 bilan boshlanadigan raqamdan qo‘ng‘iroq qilib, buyurtmani tasdiqlaydi. Qo‘ng‘iroqlar 09:00–21:00 (Toshkent vaqti).",
  /** rahmat-3: 21:00 dan keyin yoki 09:00 dan oldin (Toshkent vaqti). */
  offHours: "Hozir ish vaqtidan tashqari — operatorimiz 09:00 dan keyin qo‘ng‘iroq qiladi.",
  callTo: "Shu raqamga qo‘ng‘iroq qilamiz:",
  s1Steps: {
    answer: "Qo‘ng‘iroqqa javob bering",
    answerBody: "Sizga +998 bilan boshlanadigan raqamdan 09:00–21:00 (Toshkent vaqti) oralig‘ida qo‘ng‘iroq qilinadi. Operatorimiz buyurtmani tasdiqlaydi.",
    sum: "Summa siz ko‘rganingizdek:",
    deliveryCenter: "Yetkazish markazgacha",
    deliveryAddress: "Yetkazish eshikkacha",
    deliveryFree: "Yetkazish bepul",
    operatorSame: "Operator ham shu summani aytadi.",
    sms: "SMS keladi",
    smsBody: "Tasdiqlangach SMS keladi. Posilka yo‘lga chiqqanda trek raqami bilan SMS keladi.",
    pay: "Tovarni olganingizda to‘laysiz",
    payBody: "Ariza — bu hali to‘lov emas. Operator karta raqami yoki SMS kodni so‘ramaydi.",
  },
  s3: {
    sumLine: (product: string, delivery: string) => `Summa siz ko‘rganingizdek: tovar ${product} va yetkazish ${delivery}.`,
    /** Bepul yetkazishda (narx-4) radio yo‘q — tanlov sukut bo‘yicha markazgacha. */
    steps: (where: "CENTER" | "ADDRESS", total: string) => [
      "Operator qo‘ng‘iroq qilib, buyurtmani tasdiqlaydi.",
      "Tasdiqlangach SMS keladi. Posilka yo‘lga chiqqanda trek raqami bilan.",
      where === "ADDRESS" ? "Elchi Pochta eshikkacha yetkazadi." : "Elchi Pochta markazgacha yetkazadi.",
      `Tovarni olganingizda ${total} to‘laysiz.`,
    ],
  },
} as const;

/** toxtatilgan-1…3 (sf-landing-toxtatilgan): forma, narx tugmasi va Lead hodisasi yo‘q. */
export const STOPPED = {
  outOfStockTag: "Vaqtincha yo‘q",
  outOfStock: "Hozir buyurtma qabul qilinmaydi",
  notAccepted: "Bu havola orqali hozir buyurtma qabul qilinmaydi",
  withdrawnTitle: "Bu tovar sotuvdan olingan",
  withdrawnBody: "Unga buyurtma qabul qilinmaydi. Siz ochgan havola:",
  keepLink: "Bu sahifa yana ishlasa, buyurtmani shu yerdan berasiz — havolani saqlab qo‘ying.",
  box: "Qutida:",
} as const;
