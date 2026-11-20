# landing/ — sotuvchi sahifasi (SF-01)

Reklama tushadigan sotuvchi sahifasi. Do‘kon saytidan (`../src`) alohida yengil Next.js 15 ilovasi:
provayderlar, savat, sevimlilar va mijoz tokeni yo‘q; o‘z `package.json`, Dockerfile va CI job’i bor;
qidiruvga chiqmaydi (`X-Robots-Tag: noindex, nofollow` va meta robots).

## Ishga tushirish

Node ≥ 22.15 (CI va Docker — Node 24).

```bash
cd landing
npm ci
cp .env.example .env.local   # MOCK_API=true — backendsiz; backend bilan MOCK_API=false va API_BASE_URL
npm run dev                   # http://localhost:3003/k7Qm2x
```

Docker: `docker compose up landing` (shu papkada) → http://localhost:3003/k7Qm2x.

Tekshiruv (CI dagi bilan bir xil): `npm run check` — typecheck, lint, unit testlar, build va smoke
(build qilingan serverni mock bilan ko‘tarib, HTTP orqali tekshiradi).

## Qanday ishlaydi

| Qism | Fayl | Manba |
|---|---|---|
| Havola `/<kod>` → ichki `/v/<s1\|s3>/<kod>` | `src/middleware.ts`, `src/lib/routing.ts` | SF-01; SF-03 da har variant alohida statik HTML bo‘ladi |
| Birinchi kirishda 50/50, 30 kunlik `elchi_variant` cookie (HttpOnly, SameSite=Lax) | `src/lib/variant.ts` | sinov-s1-s3.md «Qanday bo‘linadi»; 30 kun — TZ 01, 9-qoida |
| Ichki `/v/…` yo‘li tashqaridan → 404 | `src/middleware.ts` | variantni havola bilan tanlab bo‘lmasin |
| Sahifa ma’lumoti `GET /landing/:code`; 404 → 404-1 | `src/lib/backend.ts`, `src/app/not-found.tsx` | BE-25 shartnomasi; SF-01 TC3 |
| Backend xatosi → xato-1, serverda (JS siz ham) | `src/app/v/[variant]/[code]/page.tsx` | holat-matnlari.md xato-1 |
| Klik: brauzer → `POST /api/clicks` → backend `POST /clicks` (`variant`, sub1–sub5, utm, fbclid, `_fbp`, `_fbc`, mijoz IP va user agenti) | `src/components/click-tracker.tsx`, `src/app/api/clicks/route.ts`, `src/lib/tracking.ts` | BE-25 `CreateLandingClickDto`; SF-02 |
| `clickId` lid formasi uchun `sessionStorage` da (`elchi_click:<kod>`) | `src/components/click-tracker.tsx` | BE-25 `CreateLeadDto.clickId`; forma SF-02 da |
| Mock: `k7Qm2x` (ochiq), `mockXato` (server xatosi), boshqa kod — 404 | `src/lib/mock.ts` | BE-25 misollari; narx holat-matnlari.md «Sums» |

Matnlar faqat `holat-matnlari.md` dan (`src/lib/texts.ts`). Aloqa telefoni (EQ-05) sozlanmagan bo‘lsa,
telefon bloki chiqmaydi — bo‘sh joy qoldirilmaydi.

## Sotuvchi sahifasi (SF-02)

| Qism | Fayl | Manba |
|---|---|---|
| S1: forma mahsulot sahifasida; S3: forma `/<kod>/buyurtma` qadamida | `src/app/v/[variant]/[code]/page.tsx`, `buyurtma/page.tsx` | holat-matnlari.md:77-91 |
| Narx, yetkazish tanlovi, Jami — tanlov CSS `:has()` bilan, JS siz ham | `src/components/price-block.tsx`, `src/lib/pricing.ts` | narx-1…5 |
| Forma: ism, +998 (2-3-2-2), rozilik, yashirin `website`, variant, clickId, sub/utm | `src/components/lead-form.tsx`, `src/lib/lead-form.ts` | forma-1…13, BE-12 |
| Yuborish: Server Action → backend `POST /leads` (mijoz IP va user agenti bilan); JS siz xato yozilganlar bilan qaytadi | `src/app/actions.ts`, `src/lib/backend.ts` | forma-10, forma-11 |
| «Rahmat»: ism va raqam HttpOnly cookie’dan (URL da emas), dublikat — rahmat-4, ish vaqtidan tashqari — rahmat-3 | `src/app/v/[variant]/[code]/rahmat/page.tsx`, `src/components/thanks-view.tsx` | rahmat-1…6 |
| Piksellar: PageView; Lead faqat «Rahmat» da, bir marta, eventID = lid ID | `src/lib/pixel-events.ts`, `src/components/pixels.tsx` | LID-3, BE-31 |
| Ochiq bo‘lmagan sahifa: forma va Lead yo‘q | `src/components/stopped-view.tsx` | toxtatilgan-1…3 |

Mock kodlar: `k7Qm2x` (oddiy), `mockVideo`, `mockBad`, `mockBepul`, `mockYoq`, `mockHavola`, `mockOlingan`, `mockRoyxat` (viloyat ro‘yxati yuklanmaydi), `mockPiksel` (piksel ID lari bilan, e2e).
Ism «Xato Sinov» — server xatosi, raqam `90 111 11 11` — dublikat.

## Tezlik va kesh (SF-03)

- **Statik sahifa (ISR).** Sotuvchi sahifasi har kod va variant uchun bir marta yasaladi va 60 soniyada yangilanadi [taklif].
  - Middleware variantni `x-elchi-variant` sarlavhasiga yozadi, `next.config.ts` dagi rewrite `/<kod>` ni `/v/<variant>/<kod>` ga yo‘naltiradi.
  - Middleware rewrite'i bilan Next ISR keshini ishlatmaydi, shuning uchun config rewrite qilindi.
  - Mijoz yuborgan sarlavha olib tashlanadi.
- **Kesh.** Sahifa query string, cookie va so‘rov sarlavhalarini o‘qimaydi. sub/utm/fbclid brauzerda o‘qiladi.
  - Javob `Cache-Control: private, no-store`: `/<kod>` manzili ikkala variantda bir xil, CDN ularni ajrata olmaydi.
  - Statik HTML Next serverida har variant yo‘li bo‘yicha alohida saqlanadi.
- **CSS HTML ichida** (`experimental.inlineCss`). Shrift — faqat lotin to‘plami.
- **Tezlik byudjeti:** `npm run test:lighthouse`.
  - Lighthouse mobil profili (sekin 4G, 4× CPU), `devtools` usuli, har variant 3 marta, mediana.
  - Shart: S1 va S3 da LCP ≤ 1500 ms.
- **e2e:** `npm run test:e2e`.
  - Tizimdagi Chrome, `npm i --no-save playwright-core@1.64.1`.
  - Oqim: manzilli forma → «Rahmat» → Lead pikseli, S1 va S3 da.
- Ikkalasi CI dagi `landing` job'ida.

## Hali yo‘q (keyingi kartalar)

- Manzil maydonlari (viloyat, tuman, ko‘cha/uy) — SF-06. **Haqiqiy backend manzilsiz lidni 400 bilan rad etadi** — SF-02 SF-06 bilan birga ishga tushadi.
- Statik HTML, kesh, Lighthouse — SF-03. Huquqiy sahifalar, {FOOT} va «Ommaviy oferta» havolasi sahifasi — SF-07.
- S3 kompyuterdagi yuqori yopishqoq panel — [taklif] keyinroq; birinchi ekranda tugma bor.
- Prod deploy (`docker-compose.prod.yml`, `marketplace_edge`, Cloudflare hostname) — domen (EQ-05) aniq bo‘lgach.
