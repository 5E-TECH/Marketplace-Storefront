# landing/ — sotuvchi sahifasi (SF-01)

Reklama tushadigan sotuvchi sahifasi. Do‘kon saytidan (`../src`) alohida yengil Next.js 15 ilovasi:
provayderlar, savat, sevimlilar va mijoz tokeni yo‘q; o‘z `package.json`, Dockerfile va CI job’i bor;
qidiruvga chiqmaydi (`X-Robots-Tag: noindex, nofollow` va meta robots).

## Ishga tushirish

Node ≥ 22.15 (CI va Docker — Node 24).

```bash
cd landing
npm ci
cp .env.example .env.local   # MOCK_API=true — backend BE-11 tayyor bo‘lguncha
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

## Hali yo‘q (keyingi kartalar)

- S1 va S3 shablonlari, forma, «rahmat», piksellar — SF-02 (DZ-02 ega tasdig‘idan keyin). Hozir ikkala variant bir xil karkas: tovar nomi va narxi.
- Manzil maydonlari — SF-06. Statik HTML, kesh, Lighthouse — SF-03. Huquqiy sahifalar va {FOOT} — SF-07.
- Prod deploy (`docker-compose.prod.yml`, `marketplace_edge`, Cloudflare hostname) — domen (EQ-05) aniq bo‘lgach.
