/**
 * SF-07 (M1) huquqiy va tizim sahifalari matnlari — dizayn taxtalaridan harfma-harf.
 * Taxtalar: elchi-lid-sotuv/docs/dizayn/storefront-yonalishlar/project/sf-*.dc.html; holatlar:
 * holat-matnlari.md:544-787, o‘zgarishlar 5-bo‘lim (:817-844).
 * Ega yoki yurist javobini kutayotgan «[…]» joylar (EQ-05, EQ-06, EQ-10, savollar) sahifaga chiqmaydi:
 * o‘sha gap, qator yoki band olingan, bo‘sh joy qoldirilmagan. [taklif] va ‹M2› belgilari, «Namuna …» satri
 * va kulrang izohlar sahifa matni emas. Har bir olib tashlash va noaniqlik:
 * elchi-lid-sotuv/mvp-plan/tahlil-2026-11-20/sf07/matnlar-oqish.md.
 * Shakl: oferta bandlari raqami matn boshida, taxtadagidek («1.2 …»); nom–qiymat qatorlari, kartalar va
 * qadamlar `head: []` jadval. Havolalar oddiy matn — qaysi so‘z havola ekani hisobotda.
 */

export type LegalBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "note"; text: string };

export interface LegalSection {
  id: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalPage {
  title: string; // h1 as drawn
  linkLabel: string; // how footer/consent links name it
  intro: LegalBlock[]; // text before the first section
  draftBand?: string; // only if drawn as customer-visible text
  meta: Array<{ label: string; value: string }>; // version/date lines etc.
  sections: LegalSection[];
  toc?: { title: string; summary: string }; // «Mundarija», «Mundarija · N bo‘lim»
}

// oferta-1, oferta-3: sf-oferta.dc.html:18 (markup), :24 (D); «Mundarija · 10 bo‘lim» sf-oferta.mobil.dc.html:19 — 9, 10-bo‘lim faqat joy egasi bo‘lgani uchun olindi, son 8.
export const OFERTA: LegalPage = {
  title: "Ommaviy oferta",
  linkLabel: "Ommaviy oferta",
  intro: [
    { kind: "p", text: "Tovar sotib olish shartnomasi. Buyurtma formasidagi rozilik belgisi shu versiyaga tegishli." },
  ],
  draftBand: "Bo‘limlar va matn — qoralama",
  meta: [],
  sections: [
    {
      id: "umumiy",
      title: "1. Umumiy qoidalar",
      blocks: [
        { kind: "p", text: "1.2 Kompaniya tovarni uning egasi — ulgurji yetkazib beruvchi nomidan komissioner sifatida sotadi." },
        { kind: "p", text: "1.3 Buyurtma formasida rozilik belgisini qo‘yib ariza yuborsangiz, shu versiya shartlariga rozilik bildirasiz." },
      ],
    },
    {
      id: "buyurtma",
      title: "2. Buyurtma qanday rasmiylashtiriladi",
      blocks: [
        { kind: "p", text: "2.1 Ariza — bu hali to‘lov emas. Ariza qoldirganingizdan keyin operator 09:00–21:00 oralig‘ida qo‘ng‘iroq qiladi." },
        { kind: "p", text: "2.2 Qo‘ng‘iroqda tovar, miqdor, yetkazish manzili va jami summa siz bilan tasdiqlanadi." },
        { kind: "p", text: "2.3 Tasdiqlangach SMS keladi. Posilka yo‘lga chiqqanda — trek raqami bilan." },
        { kind: "p", text: "2.4 Suhbat sifat nazorati uchun yozib olinadi; qo‘ng‘iroq boshida bu haqda aytiladi." },
      ],
    },
    {
      id: "narx",
      title: "3. Narx va yetkazish",
      blocks: [
        { kind: "p", text: "3.1 Tovar narxi va yetkazish summasi tovar sahifasida ko‘rsatiladi. Operator, SMS va chekdagi summa sahifadagi bilan bir xil." },
        { kind: "p", text: "3.2 Tasdiqlangan buyurtmaning narxi keyin o‘zgarmaydi." },
        { kind: "p", text: "3.3 Buyurtma 3 kg dan og‘ir bo‘lsa, yetkazish Elchi Pochta tarifi bo‘yicha qayta hisoblanadi; yangi summani operator qo‘ng‘iroqda aytadi." },
        { kind: "p", text: "3.4 Sahifada yetkazish haqi olinmasligi yozilgan tovar uchun keyin yetkazish haqi olinmaydi." },
      ],
    },
    {
      id: "yetkazish",
      title: "4. Yetkazish",
      blocks: [
        { kind: "p", text: "4.1 Tovarni Elchi Pochta yetkazadi: viloyat va tuman markazigacha yoki eshikkacha. Qayergacha yetkazishni tovar sahifasida tanlaysiz." },
      ],
    },
    {
      id: "tolov",
      title: "5. To‘lov va chek",
      blocks: [
        { kind: "p", text: "5.1 To‘lov tovarni olganingizda, naqd pulda amalga oshiriladi." },
        { kind: "p", text: "5.2 To‘lov paytida fiskal chek beriladi. Chekda tovar egasining STIR raqami va komissioner belgisi bo‘ladi." },
        { kind: "p", text: "5.3 Bir telefon raqamidan ikki marta posilka olinmasa, shu raqamdan keyingi buyurtma faqat yetkazish puli oldindan to‘langanda yuboriladi." },
      ],
    },
    {
      id: "bekor-qilish",
      title: "6. Bekor qilish va posilkani olmaslik",
      blocks: [
        { kind: "p", text: "6.1 Buyurtma Elchi Pochta’ga topshirilgunga qadar bekor qilinishi mumkin; bekor qilishni operator bajaradi." },
        { kind: "p", text: "6.2 Posilkani olishdan bosh tortsangiz, to‘lov olinmaydi; posilka omborga qaytadi." },
      ],
    },
    {
      id: "qaytarish",
      title: "7. Tovarni qaytarish",
      blocks: [
        { kind: "p", text: "7.2 Qisqacha — «Qaytarish tartibi» sahifasida." },
      ],
    },
    {
      id: "shaxsiy",
      title: "8. Shaxsiy ma’lumotlar",
      blocks: [
        { kind: "p", text: "8.1 Ism, telefon va manzil buyurtmani tasdiqlash va yetkazish uchun ishlatiladi. Batafsil — «Shaxsiy ma’lumotlar siyosati»." },
        { kind: "p", text: "8.2 Reklama xabarlari faqat alohida roziligingiz bilan yuboriladi." },
      ],
    },
  ],
  toc: { title: "Mundarija", summary: "Mundarija · 8 bo‘lim" },
};

// maxfiylik-1: sf-maxfiylik.dc.html:18 (markup), :24 (D); «Mundarija · 8 bo‘lim» sf-maxfiylik.mobil.dc.html:19. ‹M2› gaplar M1 da yo‘q (holat-matnlari.md:844).
export const MAXFIYLIK: LegalPage = {
  title: "Shaxsiy ma’lumotlar siyosati",
  linkLabel: "Maxfiylik",
  intro: [
    { kind: "p", text: "Telefon raqamingiz, qo‘ng‘iroq yozuvi, SMS va reklama piksellari qanday ishlatiladi, kim ko‘radi va qancha saqlanadi." },
  ],
  meta: [],
  sections: [
    {
      id: "qisqacha",
      title: "Qisqacha",
      blocks: [
        {
          kind: "table",
          head: [],
          rows: [
            ["O‘zbekistonda", "Serverlar va har kungi zaxira nusxa O‘zbekistonda."],
            ["90 kun", "Qo‘ng‘iroq yozuvi shifrlangan holda saqlanadi, keyin o‘chiriladi."],
            ["Raqam yashirin", "Operator raqamingizni ko‘rmaydi: qo‘ng‘iroq server orqali o‘tadi."],
            ["Rozilik bilan", "Reklama SMS — faqat alohida roziligingiz bilan va 09:00–18:00 oralig‘ida."],
          ],
        },
      ],
    },
    {
      id: "malumotlar",
      title: "1. Qaysi ma’lumotni olamiz",
      blocks: [
        { kind: "p", text: "Faqat buyurtmani tasdiqlash, yetkazish va firibgarlikdan himoya uchun keragini olamiz." },
        {
          kind: "table",
          head: ["Ma’lumot", "Qachon", "Nima uchun"],
          rows: [
            ["Ism, telefon va manzil: viloyat, tuman, ko‘cha va uy", "Ariza qoldirganingizda", "Qo‘ng‘iroq qilib, buyurtmani tasdiqlash va posilkani yetkazish"],
            ["Manzilga tuzatish, markaz yoki uy", "Operator qo‘ng‘irog‘ida", "Posilkani yetkazish"],
            ["Qo‘ng‘iroq yozuvi", "Har suhbatda", "Sifat nazorati, nizoni hal qilish"],
            ["IP manzil, qurilma, reklama belgilari", "Ariza yuborilganda", "Spam va soxta arizadan himoya, reklama samarasini o‘lchash"],
            ["Buyurtmalar tarixi", "Har buyurtmada", "Takroriy arizani avvalgisiga bog‘lash"],
          ],
        },
        { kind: "note", text: "Operator karta raqami yoki SMS kodni so‘ramaydi." },
      ],
    },
    {
      id: "qongiroq-yozuvi",
      title: "2. Qo‘ng‘iroq yozuvi",
      blocks: [
        { kind: "p", text: "Har qo‘ng‘iroq boshida aytamiz: «Suhbat sifat nazorati uchun yozib olinadi»." },
        {
          kind: "table",
          head: [],
          rows: [
            ["Qayerda", "O‘zbekistondagi serverda, shifrlangan holda"],
            ["Qancha", "90 kun, keyin avtomatik o‘chiriladi. Nizoli buyurtmaning yozuvi — 1 yil"],
            ["Kim tinglaydi", "Suhbatni olib borgan operator, sifat nazoratchisi va administrator. Yuklab olish — faqat administrator"],
            ["Nazorat", "Har tinglash jurnalga yoziladi"],
          ],
        },
      ],
    },
    {
      id: "sms",
      title: "3. SMS va xabarlar",
      blocks: [
        { kind: "p", text: "Buyurtma haqidagi SMS ariza bilan bergan roziligingiz asosida keladi. Reklama — faqat alohida rozilik bilan." },
        {
          kind: "table",
          head: ["Xabar", "Qachon", "Rozilik"],
          rows: [
            ["«Buyurtmangiz tasdiqlandi»", "Operator tasdiqlagach", "Ariza bilan"],
            ["«Posilka yo‘lga chiqdi» — trek raqami bilan", "Posilka jo‘natilganda", "Ariza bilan"],
            ["«Buyurtmangiz bo‘yicha qo‘ng‘iroq qildik»", "Javob bermasangiz, 2-urinishdan keyin bir marta", "Ariza bilan"],
            ["Yangi takliflar va qayta xarid narxi", "Faqat 09:00–18:00 da", "Alohida rozilik; xohlagan payt to‘xtatasiz"],
          ],
        },
      ],
    },
    {
      id: "piksellar",
      title: "4. Reklama piksellari",
      blocks: [
        { kind: "p", text: "Tovar sahifasi reklamadan ochilsa, reklama tarmoqlarining (Meta, TikTok) piksellari ishlaydi." },
      ],
    },
    {
      id: "kim-koradi",
      title: "5. Kim ko‘radi",
      blocks: [
        {
          kind: "table",
          head: ["Kim", "Nimani ko‘radi"],
          rows: [
            ["Operator", "Ism, tovar va manzil. Telefon raqamingizni ko‘rmaydi — qo‘ng‘iroq server orqali o‘tadi."],
            ["Elchi Pochta", "Posilkani yetkazish uchun ism, manzil va telefon."],
            ["Reklama hamkorlari", "Ariza holati va telefon raqamingizning faqat oxirgi 4 raqami."],
            ["Nazoratchi va administrator", "Qo‘ng‘iroq yozuvlari va buyurtma tarixi; har tinglash jurnalda."],
          ],
        },
        { kind: "p", text: "Ma’lumotni tashqariga yuklab olish (eksport) faqat administratorga ruxsat etilgan." },
      ],
    },
    {
      id: "saqlash",
      title: "6. Qayerda va qancha saqlanadi",
      blocks: [
        {
          kind: "table",
          head: [],
          rows: [
            ["Serverlar", "O‘zbekistonda"],
            ["Zaxira nusxa", "Har kuni, O‘zbekiston ichidagi boshqa serverga"],
            ["Qo‘ng‘iroq yozuvi", "90 kun; nizoli buyurtmada 1 yil"],
          ],
        },
      ],
    },
    {
      id: "huquqlar",
      title: "7. Huquqlaringiz",
      blocks: [
        { kind: "p", text: "Ma’lumotlaringizni ko‘rish, o‘chirishni so‘rash va reklama roziligini qaytarib olish huquqingiz bor." },
        {
          kind: "table",
          head: [],
          rows: [
            ["Ma’lumotlarimni ko‘rish", "Biz saqlagan ma’lumotlaringiz ro‘yxatini olasiz."],
            ["O‘chirishni so‘rash", "Ochiq buyurtma yoki hisob-kitob bo‘lsa, u yakunlangach o‘chiriladi."],
            ["Reklama roziligini qaytarish", "Reklama SMS va Telegram xabarlari to‘xtaydi. Buyurtma haqidagi SMS kelaveradi."],
          ],
        },
      ],
    },
    {
      id: "aloqa",
      title: "8. Aloqa va o‘zgarishlar",
      blocks: [
        { kind: "p", text: "Siyosat o‘zgarsa, yangi versiya shu sahifada e’lon qilinadi; oldingi versiyalar saqlanadi." },
      ],
    },
  ],
  toc: { title: "Mundarija", summary: "Mundarija · 8 bo‘lim" },
};

// qaytarish-2: sf-qaytarish-tartibi.holatlar.dc.html:18 (markup), :24 (D.pathsno) — telefonsiz.
export const QAYTARISH_NO_FORM: { lines: string[] } = {
  lines: [
    "So‘rov uchun qo‘ng‘iroq qiling:",
    "Qo‘ng‘iroqlar 09:00–21:00 (Toshkent vaqti).",
  ],
};

// qaytarish-1: sf-qaytarish-tartibi.dc.html:18 (markup), :24 (D); «Olgandan keyin» = qaytarish-2.
export const QAYTARISH: LegalPage = {
  title: "Qaytarish tartibi",
  linkLabel: "Qaytarish tartibi",
  intro: [
    { kind: "p", text: "Tovarni olgandan keyin ham qaytarish so‘rovini qoldirasiz. Muddat va shartlar iste’molchilar huquqlari qonuni bo‘yicha belgilanadi." },
  ],
  meta: [
    { label: "Asos", value: "Ommaviy oferta, 7-bo‘lim" },
  ],
  sections: [
    {
      id: "olishdan-oldin",
      title: "Olishdan oldin",
      blocks: [
        { kind: "p", text: "Posilkani olmasangiz, to‘lamaysiz — u omborga qaytadi." },
        {
          kind: "table",
          head: [],
          rows: [
            ["Bekor qilish", "Elchi Pochta’ga topshirilgunga qadar operator buyurtmani bekor qiladi."],
            ["Eslatma", "Bir raqamdan ikki marta posilka olinmasa, keyingi buyurtmada yetkazish puli oldindan to‘lanadi."],
          ],
        },
      ],
    },
    {
      id: "olgandan-keyin",
      title: "Olgandan keyin",
      blocks: [
        { kind: "p", text: "So‘rov uchun qo‘ng‘iroq qiling:" },
        { kind: "note", text: "Qo‘ng‘iroqlar 09:00–21:00 (Toshkent vaqti)." },
      ],
    },
    {
      id: "qadamlar",
      title: "Qaytarish to‘rt qadamda bo‘ladi",
      blocks: [
        { kind: "p", text: "So‘rovning holati: yuborildi, ko‘rib chiqilmoqda, tasdiqlandi yoki rad etildi (sababi bilan), pul qaytarildi." },
        {
          kind: "table",
          head: [],
          rows: [
            ["1", "So‘rov", "Sabab va izoh yozasiz, tovar rasmini qo‘shasiz."],
            ["2", "Javob", "So‘rov ko‘rib chiqiladi, javob SMS bilan keladi."],
            ["3", "Topshirish"],
            ["4", "Pul", "Qaytarish cheki beriladi."],
          ],
        },
      ],
    },
    {
      id: "shartlar",
      title: "Qaytarish shartlari",
      blocks: [
        { kind: "p", text: "Shartlar iste’molchilar huquqlari qonuni bo‘yicha belgilanadi va ommaviy ofertaning 7-bo‘limida yoziladi." },
        { kind: "p", text: "Muddat va shartlar ommaviy ofertada yoziladi." },
      ],
    },
  ],
};

// yetkazish-1 (sotuvchi sahifasi bo‘limi, M1 da alohida sahifa yo‘q): sf-yetkazish-tolov.holatlar.dc.html:18; namuna summali qatorlar olinmagan.
export const YETKAZISH: LegalPage = {
  title: "Yetkazish va to‘lov",
  linkLabel: "Yetkazish va to‘lov",
  intro: [
    { kind: "p", text: "Elchi Pochta yetkazadi: viloyat va tuman markazigacha yoki eshikkacha." },
  ],
  meta: [],
  sections: [
    {
      id: "s1",
      title: "Yetkazish va to‘lov",
      blocks: [
        {
          kind: "table",
          head: [],
          rows: [
            ["To‘lov", "tovarni olganingizda"],
          ],
        },
      ],
    },
    {
      id: "s3",
      title: "Yetkazish narxi",
      blocks: [
        { kind: "note", text: "Tasdiqlangach SMS keladi. Posilka yo‘lga chiqqanda trek raqami bilan." },
      ],
    },
  ],
};

// oferta-4: sf-oferta.holatlar.dc.html:19 — versiya qatorlari (joy egasi) olindi; versiya bitta bo‘lsa oyna ochilmaydi.
export const OFERTA_VERSIONS: { title: string; lines: string[] } = {
  title: "Oferta versiyalari",
  lines: [
    "Mijoz bilan shartnoma — barcha e’lon qilingan versiyalar",
    "E’lon qilingan versiya matni o‘zgarmaydi. Arizangiz qaysi versiyaga rozilik bilan yuborilgani saqlanadi.",
    "Yopish",
  ],
};

// oferta-5: sf-oferta.holatlar.dc.html:19 (band), :25 (D.ointro — eski versiyadagi kirish matni).
export const OFERTA_OLD_BANNER: { lines: string[] } = {
  lines: [
    "Joriy versiyani ochish",
    "Tovar sotib olish shartnomasining oldingi versiyasi. Shu davrda yuborilgan arizalar shu versiyaga rozilik bilan yozilgan.",
  ],
};

// texnik-1: sf-texnik-ishlar.dc.html:18, sf-texnik-ishlar.holatlar.dc.html:18; oxirgi ikki satr — aloqa bloki (telefonsiz).
export const TEXNIK: { title: string; lines: string[] } = {
  title: "Sahifa vaqtincha ishlamayapti",
  lines: [
    "Texnik ishlar ketmoqda. Hozir ariza qoldirib bo‘lmaydi.",
    "Sahifani yangilash",
    "Havolani saqlab qo‘ying.",
    "Ishlar tugagach, shu havola bilan sahifa yana ochiladi va ariza qoldirasiz.",
    "Savol bo‘lsa:",
    "Qo‘ng‘iroqlar 09:00–21:00 (Toshkent vaqti).",
  ],
};

// xato-2: sf-xato.holatlar.dc.html:18 — xato-1 ning tepasi, tugma «Tekshirilmoqda…» (o‘chiq).
export const XATO_RETRYING: { lines: string[] } = {
  lines: [
    "Sahifani ochib bo‘lmadi",
    "Server hozir javob bermayapti. Internet aloqasini tekshirib, birozdan keyin qayta urinib ko‘ring.",
    "Tekshirilmoqda…",
  ],
};

// 404-2: sf-landing-404.holatlar.dc.html:18 (markup), :25 (st2); pastki qismi 404-1 dagidek.
export const NOT_FOUND_REMOVED: { title: string; lines: string[] } = {
  title: "Bu sahifa endi ishlamaydi",
  lines: [
    "Havola eskirgan: sahifa yopilgan. Tovarni reklamadagi yangi havola orqali oching.",
    "Siz ochgan havola",
    "Nima qilish mumkin",
    "Reklamadagi havolani qayta bosib oching.",
    "Instagram, Facebook yoki TikTok’dagi e’longa qayting — havola o‘sha yerda.",
    "Yangi havola topilmasa, qo‘ng‘iroq qiling.",
    "Operator tovar hozir sotuvdami — aytib beradi.",
  ],
};

// {FOOT}: sf-karkas.dc.html:50-58, :303 — huquqiy satr (EQ-10) olindi; «Aloqa» telefon bo‘lmasa olinadi (sf-karkas.dc.html:76).
export const FOOT: {
  links: Array<{ label: string; page: "oferta" | "maxfiylik" | "qaytarish" | "yetkazish" | "aloqa" }>;
  lines: string[];
} = {
  links: [
    { label: "Ommaviy oferta", page: "oferta" },
    { label: "Maxfiylik", page: "maxfiylik" },
    { label: "Qaytarish tartibi", page: "qaytarish" },
    { label: "Aloqa", page: "aloqa" },
  ],
  lines: [],
};

// sf-oferta.dc.html:18, sf-maxfiylik.dc.html:18, sf-qaytarish-tartibi.dc.html:18 (karkasda chizilmagan).
export const BACK_TO_PRODUCT = "Tovar sahifasiga qaytish";
