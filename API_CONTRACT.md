# Elchi Market API contract

Manba: [`contract/openapi.json`](contract/openapi.json), Elchi Marketplace API 0.1. DTO va validatorlar shu fayldan generatsiya qilinadi. Backend snapshotining ma’lum noaniqliklari: [`contract/README.md`](contract/README.md).

## Transport

Yagona HTTP implementatsiya: `src/lib/api.ts`. Barcha service’lar `apiRequest` orqali ishlaydi.

- SSR: `.env.local` dagi `API_BASE_URL` (`/api/v1` bilan tugaydi), keyin `API_URL` va `NEXT_PUBLIC_API_URL` fallbacklari.
- Brauzer: `/api/backend/*` same-origin proxy. Backend URL brauzerga berilishi shart emas.
- `API_TIMEOUT_MS`: server timeouti, standart 10 000 ms. Brauzer uchun standart 15 000 ms. Javob tanasini o‘qish ham shu muddatga kiradi.
- Backend `{ statusCode, message, data }` envelope’i transportda ochiladi. Bare payload ham qo‘llanadi.
- Generatsiya qilingan validatorlar tanlangan DTO javobini tekshiradi. Noto‘g‘ri JSON yoki kontraktga mos kelmagan javob `invalid_response` xatosini beradi.
- Error turlari: `network`, `timeout`, `aborted`, `not_found`, `http`, `invalid_response`, `configuration`.
- Shaxsiy so‘rovlar keshlanmaydi. Ochiq katalog SSR so‘rovlari service’da 30 soniyalik revalidation ishlatadi.

## Katalog

- `GET /storefront/products`
- `GET /storefront/products/:id`
- `GET /storefront/shops/:shopId/products`

Query: `page`, `limit`, `search`, `categoryId`, `minPrice`, `maxPrice`, `sort`.
Ro‘yxat DTO: `StorefrontProductsPageDto` — `{ items, total, page, limit, totalPages }`.
Mahsulot DTO: `StorefrontProductDto`; variantlar: `ProductVariantDto`.

Eski frontend `/api/v1/storefront/products` va `/storefront/products` route’lari moslik uchun saqlangan. Ular UI uchun normalizatsiya qilingan `{ data: Product[], total, page, limit, totalPages, source, error? }` qaytaradi. `source`: `api`, `mock`, `unavailable`. `/api/backend/storefront/products` esa backend payloadini saqlaydi.

## Savatcha

- `GET /cart`
- `POST /cart/items`: `AddCartItemDto` (`productId`, `variantId`, `quantity`)
- `PATCH /cart/items/:id`: `UpdateCartItemDto`
- `DELETE /cart/items/:id`
- `POST /cart/merge`

`CartDto`: `{ id, customerId, sessionId, items, totalAmount, totalQuantity }`.
`CartItemDto`: `{ id, productId, variantId, shopId, quantity, unitPriceSnapshot, lineTotal }`.

Savatcha mahsulotlarni to‘liq bermaydi. Adapter mahsulotlarni ID orqali katalogdan oladi; bir javob ichidagi takroriy ID’lar bir marta so‘raladi. Narx `unitPriceSnapshot`dan olinadi. O‘chirilgan mahsulot uchun 404 kelganda savatcha qatori saqlanadi va uni olib tashlash mumkin bo‘ladi. Miqdor musbat butun son bo‘lishi kerak; backend narx va ombor cheklovlarini mustaqil tekshiradi.

## Sevimlilar va guest session

- `GET /favorites`: `FavoritesPageDto`, ichida `FavoriteDto.product`
- `POST /favorites/:productId`
- `DELETE /favorites/:productId`
- `GET /favorites/:productId/check`
- `POST /guest/merge`

Brauzer `X-Session-Id` va mavjud bo‘lsa `Authorization: Bearer ...` yuboradi. SSR shaxsiy so‘rovlarda sessiya headerlari chaqiruvchi tomonidan aniq beriladi. Muvaffaqiyatli guest merge’dan keyin guest session yangilanadi va providerlar qayta yuklanadi.

## Seller/admin

`product-admin.service.ts`: `/products`, `/products/my`, `/products/:id` va `/products/:productId/variants` operatsiyalari. Request va response DTO’lari generatsiya qilingan tiplarga bog‘langan. Haqiqiy access token tashqaridan beriladi; seller UI hozir yo‘q.

## Xaridor akkaunti

- `POST /auth/register`: `{ name, phone, password, role: "BUYER" }`
- `POST /auth/login`: `{ phone, password }`
- `POST /auth/forgot-password`: `{ phone }`
- `POST /auth/reset-password`: `{ phone, code, newPassword }`
- `GET /auth/me`
- `PATCH /auth/profile`: `{ name, phone }`
- `POST /auth/logout`
- `POST /guest/merge`: login yoki ro‘yxatdan o‘tishdan keyin mehmon savatini birlashtiradi

Auth sahifalari same-origin proxy orqali ishlaydi. Access token brauzerda saqlanadi; backend bergan refresh cookie proxy orqali mijozga uzatiladi. Profil va logout so‘rovlari Bearer token bilan yuboriladi.

### Buyurtmalar tarixi

Akkauntga kirgan xaridorning barcha qurilmalardagi tarixi quyidagi endpointdan olinadi:

- `GET /orders?page=1&limit=20`, `Authorization: Bearer <buyer-token>`;
- faqat token egasining buyurtmalari;
- javob: `{ items, total, page, limit, totalPages }`;
- har bir item: `orderId`, `createdAt`, `orderStatus`, `subtotal`, `deliveryFee`, `totalAmount`, `items[]`;
- item mahsuloti uchun kamida `productId`, `name`, `quantity`, `unitPrice`, ixtiyoriy `imageUrl`;
- token yo‘q/yaroqsiz bo‘lsa `401`, boshqa xaridor ma’lumoti hech qachon qaytmasligi kerak.

`/profile/orders` backend tarixini shu brauzerda checkoutdan keyin saqlangan, hali ro‘yxatda ko‘rinmagan buyurtma nusxalari bilan birlashtiradi. Har bir buyurtmaning joriy holati `/orders/{orderId}/tracking` orqali kuzatiladi.

## Checkout

OpenAPI checkout endpointlari storefrontga ulangan: delivery preview, idempotent order yaratish va COD confirm. `order.service.ts` localStorage’dan faqat tasdiqlangan buyurtmaning xaridor ko‘radigan qisqa tarix nusxasi sifatida foydalanadi.

Checkout manzil tanlovi real backend ma’lumotidan ishlaydi:

- `GET /regions` — viloyat va shaharlar (`id`, `name`);
- `GET /regions/{regionId}/districts` — tanlangan hudud tumanlari (`id`, `regionId`, `name`).

### Online to‘lov — holat va qolgan ishlar (2026-09-23 tekshiruvi)

Frontend tayyor. Quyidagi holat jonli `api.elchimarket.uz` da haqiqiy so‘rovlar bilan tasdiqlangan.

#### Bajarilgan ✅

| Nima | Tasdiq |
|---|---|
| `POST /payments` `returnUrl` ni qabul qiladi | `201` qaytadi |
| `POST /payments` javobida `status: "PENDING"` | `CREATED` o‘rniga to‘g‘ri qiymat |
| `GET /orders/{id}/tracking` da `payment` obyekti | `{"id":"5","provider":"PAYME","amount":185000,"status":"PENDING","failureReason":null,"updatedAt":"..."}` |
| `GET /orders` da `paymentMethod`, `paymentProvider`, `paymentStatus` | `"online"`, `"PAYME"`, `"PENDING"` |
| Takroriy `POST /payments` yangi yozuv yaratmaydi | bir buyurtmaga o‘sha `id` qaytadi |
| Noto‘g‘ri `amount` rad etiladi | `400 "To‘lov summasi buyurtmaga mos emas"` |
| Payme/Click callbacklari imzosiz so‘rovni rad qiladi | Payme `-32504`, Click `error -8` |

#### 1. `redirectUrl` hamon `null` — asosiy blocker

```jsonc
// POST /payments, ruxsat etilgan domen bilan
{"id":"5","salesOrderId":"36","provider":"PAYME","amount":185000,
 "status":"PENDING","createdAt":"2026-09-23T10:05:05.344Z","redirectUrl":null}
```

PAYME va CLICK, `returnUrl` bilan ham, usiz ham — har doim `null`. Xaridor «To‘lov sahifasi hali backend tomonidan tayyorlanmagan» xabarida qoladi.

**Ehtimoliy sabab:** provayder konfiguratsiyasi to‘ldirilmagan. Kontraktda `PUT /admin/payments/providers/{provider}` mavjud:

```jsonc
{ "merchantId": "...", "secret": "...", "baseUrl": "https://checkout.paycom.uz",
  "serviceId": "...",   // Click uchun
  "isActive": true }
```

**Qilinishi kerak:** PAYME va CLICK uchun sandbox konfiguratsiyasi kiritilsin va shundan keyin `POST /payments` javobida `redirectUrl` haqiqiy checkout manzili bilan to‘ldirilsin. Konfiguratsiya bo‘lmasa `null` emas, tushunarli `409`/`503` xatosi qaytarilsa yaxshi.

#### 2. `returnUrl` whitelist‘iga dev manzili qo‘shilsin

```
returnUrl: http://localhost:3001/...     → 400 "returnUrl ruxsat etilgan domenda emas"
returnUrl: https://www.elchimarket.uz/... → 400 "returnUrl ruxsat etilgan domenda emas"
returnUrl: https://elchimarket.uz/...     → 201 ✅
```

Storefront dev serveri `localhost:3001` da ishlaydi (`.env.example`, `package.json`). Hozir lokal muhitda to‘lovni umuman sinab bo‘lmaydi. Whitelist‘ga `http://localhost:3001` va `https://www.elchimarket.uz` qo‘shilsin.

#### 3. Refund kontraktga kiritilsin

`POST /admin/orders/{id}/refund` jonli backendda bor (BUYER token bilan `403`, mavjud bo‘lmagan yo‘l `404`), lekin `contract/openapi.json` da yo‘q. Kerak:

- OpenAPI ga kiritilsin: so‘rov tanasi, javob DTO, ruxsat etilgan rollar;
- **idempotent** bo‘lsin — ikkinchi so‘rov yangi refund yaratmasin, xato yoki o‘sha yozuvni qaytarsin;
- refunddan keyin `tracking.payment.status` **va** `GET /orders[].paymentStatus` `REFUNDED` bo‘lsin;
- faqat `PAID` holatdagi to‘lov qaytarilsin, `PENDING` uchun tushunarli xato.

#### 4. `contract/openapi.json` yangilansin

Repodagi snapshotda `CreatePaymentDto.returnUrl` ham, `PaymentResultDto.redirectUrl` ham, refund yo‘li ham yo‘q. Backend generatoridan yangi snapshot berilsin; frontend uni `npm run api:check` bilan tekshiradi.

#### TC6/TC7 (refund) nega hali o‘tkazib bo‘lmaydi

Ikkita sabab bir vaqtda:

1. **Bazada bitta ham to‘langan buyurtma yo‘q** — oxirgi 20 ta buyurtmaning hammasi `PENDING`, `PAID` = 0. Sababi 1-band: `redirectUrl` bo‘lmagani uchun hech kim haqiqiy Payme/Click sahifasiga o‘tolmaydi, demak callback ham kelmaydi. To‘lanmagan buyurtmani qaytarib bo‘lmaydi.
2. **QA da ADMIN hisob yo‘q** — refund `403` qaytaradi.

Ya‘ni: 1-band tuzatilsin → sandboxda haqiqiy to‘lov qilinsin → `paymentStatus: "PAID"` bo‘lsin → shundan keyin ADMIN hisob bilan TC6 va TC7 o‘tkaziladi.

#### Callback talablari (o‘zgarishsiz)

Payme/Click callbacklari brauzerga bog‘liq bo‘lmasligi kerak: imzo backendda tekshiriladi, operatsiya idempotent yangilanadi, `PAID` bo‘lganda buyurtma atomar tarzda to‘langan deb belgilanadi. `returnUrl` faqat UI navigatsiyasi — frontend query parametridagi `success` qiymatiga ishonmaydi va har safar `GET /orders/{orderId}/tracking` orqali haqiqiy holatni oladi.

## Tovarni qaytarish (C4.2) — backend uchun texnik topshiriq

**Holat:** bu funksiya backendda umuman yo‘q. 2026-09-23 da jonli `api.elchimarket.uz` da 32 ta yo‘l tekshirildi (`returns`, `return-requests`, `refund-requests`, `claims`, `disputes`, `exchanges` va ularning `seller/`, `admin/`, `buyer/`, `orders/{id}/` variantlari) — uchtasidan boshqa hammasi `404`.

Tekshirish usuli: bu backendda mavjud lekin rol yetmagan yo‘l `403`, ma’lumot xato bo‘lsa `400`, mavjud bo‘lmagani `404` qaytaradi.

### Allaqachon bor va o‘zgartirilmaydi

- `POST /orders/{orderId}/refund` — xaridor buyurtmani bekor qiladi. Tanasi `{ reason?: string }`, javob `{ id, status: "CANCELLED", idempotent: boolean }`. Takroriy chaqiruvda `idempotent: true`. COD buyurtmada `400`. Bu **ko‘rib chiqishsiz darhol bekor qilish** — quyidagi oqimning o‘rnini bosmaydi.
- `POST /admin/orders/{orderId}/refund` — admin uchun (kontraktda yo‘q, OpenAPI ga kiritilishi kerak).
- `GET /seller/orders`, `GET /admin/orders` — mavjud.

---

### Holatlar oqimi

```
REQUESTED ──> IN_REVIEW ──> APPROVED ──> REFUNDED
     │             │
     └─────────────┴──────> REJECTED
```

| Holat | Kim o‘tkazadi | Izoh |
|---|---|---|
| `REQUESTED` | xaridor | so‘rov yaratilgan |
| `IN_REVIEW` | sotuvchi | ko‘rib chiqilmoqda |
| `APPROVED` | sotuvchi | rozi, pul qaytarilishi kerak |
| `REJECTED` | sotuvchi | rad etildi, `decisionReason` majburiy |
| `REFUNDED` | admin / avtomatik | pul qaytarildi, yakuniy |

Ruxsat etilmagan o‘tish `409 CONFLICT`. `REJECTED` va `REFUNDED` — yakuniy holatlar, ulardan chiqib bo‘lmaydi.

---

### 1. `POST /orders/{orderId}/return-requests` — xaridor so‘rov yaratadi

Rol: `BUYER` (buyurtma egasi). Begona buyurtma — `403`, mavjud bo‘lmagani — `404`.

```jsonc
// So'rov
{
  "items": [{ "orderItemId": "55", "quantity": 1 }],   // majburiy, kamida 1 ta
  "reason": "DEFECTIVE",                                // majburiy, enum (pastda)
  "comment": "Qopqog'i singan holda keldi",             // ixtiyoriy, 0–1000 belgi
  "attachments": ["https://api.elchimarket.uz/media/..."] // ixtiyoriy, 0–5 ta URL
}
```

`reason` enum: `DEFECTIVE` (nuqsonli), `WRONG_ITEM` (boshqa tovar keldi), `NOT_AS_DESCRIBED` (tavsifga mos emas), `DAMAGED_IN_DELIVERY` (yetkazishda shikastlangan), `CHANGED_MIND` (fikrim o‘zgardi), `OTHER` (boshqa — bunda `comment` majburiy).

Javob: `201` + `ReturnRequestDto`.

Tekshiruvlar:
- `orderItemId` shu buyurtmaga tegishli bo‘lishi shart, aks holda `400`;
- `quantity` musbat butun son va buyurtmadagi miqdordan oshmasligi kerak (avval qaytarilganlari hisobga olinadi) — `400`;
- buyurtma `DELIVERED` yoki `COMPLETED` bo‘lishi kerak — aks holda `409` va tushunarli xabar;
- o‘sha pozitsiya uchun yakunlanmagan so‘rov bo‘lsa `409`;
- yetkazilgandan keyin 14 kun o‘tgan bo‘lsa `409` (muddatni backend sozlamasi belgilaydi).

### 2. `GET /return-requests?page=&limit=&status=` — xaridorning so‘rovlari

Rol: `BUYER`. Faqat token egasining so‘rovlari. Javob: `{ items: ReturnRequestDto[], total, page, limit, totalPages }`.

### 3. `GET /seller/return-requests?page=&limit=&status=` — sotuvchi ro‘yxati

Rol: `SELLER`. Faqat o‘z do‘koni(lari)ga tegishli so‘rovlar. Javob — 2-banddagi kabi sahifalangan ro‘yxat.

### 4. `GET /admin/return-requests?page=&limit=&status=&shopId=` — admin ro‘yxati

Rol: `ADMIN`, `SUPERADMIN`. Barcha so‘rovlar, `shopId` bo‘yicha filtr.

### 5. `GET /return-requests/{id}` — bitta so‘rov

Rol: `BUYER` (egasi), `SELLER` (do‘koni), `ADMIN`. Boshqasiga `403`.

### 6. `PATCH /seller/return-requests/{id}` — sotuvchi qarori

Rol: `SELLER` (shu do‘kon), shuningdek `ADMIN`.

```jsonc
// So'rov
{ "status": "APPROVED", "decisionReason": "Nuqson tasdiqlandi" }
```

- `status`: `IN_REVIEW` | `APPROVED` | `REJECTED`;
- `REJECTED` uchun `decisionReason` **majburiy**, 5–500 belgi — xaridorga shu matn ko‘rsatiladi;
- `APPROVED` uchun `decisionReason` ixtiyoriy;
- yakuniy holatdagi so‘rovni o‘zgartirishga urinish — `409`.

Javob: `200` + yangilangan `ReturnRequestDto`.

### 7. `POST /return-requests/{id}/refund` — pul qaytarish

Rol: `ADMIN`, `SUPERADMIN`.

- So‘rov `APPROVED` holatida bo‘lishi shart, aks holda `409`;
- **idempotent bo‘lishi shart**: takroriy chaqiruv yangi refund yaratmasin, o‘sha natijani `{ ..., "idempotent": true }` bilan qaytarsin;
- online to‘lovda provayderga refund yuboriladi; COD buyurtmada `400` va tushunarli xabar;
- muvaffaqiyatda: so‘rov `REFUNDED`, buyurtmaning `payment.status` ham `REFUNDED`.

Javob: `{ "returnRequestId": "12", "status": "REFUNDED", "refundedAmount": 160000, "idempotent": false }`.

---

### `ReturnRequestDto`

```jsonc
{
  "id": "12",
  "orderId": "41",
  "shopId": "7",
  "shopName": "UyBozor",
  "status": "REQUESTED",
  "reason": "DEFECTIVE",
  "comment": "Qopqog'i singan holda keldi",
  "attachments": [],
  "decisionReason": null,
  "items": [
    { "orderItemId": "55", "productId": "137", "name": "Yong'oq mag'zi 1 kg",
      "imageUrl": null, "quantity": 1, "unitPrice": 160000 }
  ],
  "refundAmount": 160000,
  "createdAt": "2026-09-23T10:00:00.000Z",
  "updatedAt": "2026-09-23T10:00:00.000Z"
}
```

Barcha `id` maydonlari string. Summalar — so‘mda butun son. Sanalar — ISO-8601.

### Mavjud endpointlarga qo‘shiladigan maydonlar

Xaridor buyurtma sahifasida so‘rov holatini ko‘rishi uchun:

- `GET /orders/{orderId}/tracking` javobiga: `"returnRequest": { "id": "12", "status": "REQUESTED", "decisionReason": null } | null`
- `GET /orders` har bir elementiga: `"returnStatus": "REQUESTED" | null`

### Umumiy talablar

- Barcha endpointlar `{ statusCode, message, data }` envelope‘ida qaytadi (mavjud konventsiya).
- Xatolar `errorCode` bilan: `VALIDATION_ERROR`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`.
- Xatolar matni xaridorga ko‘rsatsa bo‘ladigan darajada tushunarli bo‘lsin (masalan “Bu buyurtma hali yetkazilmagan”), texnik matn emas.
- Har bir holat o‘zgarishi audit jurnaliga yozilsin: kim, qachon, qaysi holatdan qaysisiga.
- Barchasi OpenAPI ga kiritilsin va yangilangan `contract/openapi.json` frontendga berilsin — frontend uni `npm run api:check` bilan tekshiradi.

### Frontend nima qiladi (endpointlar chiqqach)

Storefront: buyurtma sahifasida «Qaytarish» tugmasi va sabab formasi (1-band), `/profile/returns` ro‘yxati (2-band), buyurtma va ro‘yxatda holat ko‘rinishi (`returnRequest` maydoni). Sotuvchi va admin ekranlari — `Marketplace-FrontEnd` repozitoriysida (3, 4, 6-bandlar).

## Mahsulot sharhlari

- `GET /storefront/products/{productId}/reviews?page=1&limit=5` sharhlar, `rating`, `total` va sahifalash ma’lumotini qaytaradi.
- `POST /storefront/products/{productId}/reviews` buyer bearer tokeni va `{ orderItemId, rating, comment? }` qabul qiladi.
- Frontend formani faqat `/orders` ichidagi shu mahsulotga tegishli `DELIVERED` yoki `COMPLETED` pozitsiya uchun ochadi; backend xarid, yetkazilish va takroriy sharh cheklovini yakuniy tekshiradi.
- Buyer orders javobidagi `items[].id` haqiqiy sales order item ID bo‘lishi shart.

## Xaridor buyurtmasini kuzatish — backend talabi

Storefront quyidagi endpoint tayyor bo‘lishini kutadi:

- `GET /orders/{orderId}/tracking`
- autentifikatsiyadan o‘tgan xaridor uchun `Authorization: Bearer ...`;
- mehmon uchun buyurtma yaratilganda ishlatilgan `X-Session-Id`; 2026-09-14 jonli tekshiruvda ayni sessiyaga tegishli buyurtma `200`, begona sessiya `403` qaytardi;
- begona sessiyaga buyurtma ma’lumotini bermaslik;
- topilmagan buyurtma uchun `404`, sessiya buyurtmaga tegishli bo‘lmasa `403`;
- javob: `orderId`, `orderStatus`, ixtiyoriy `estimatedDeliveryAt`, `updatedAt`, va `shipments` massivi;
- har bir shipment: `shipmentId`, ixtiyoriy `shopId`, `shopName`, `shipmentStatus`, `trackingUrl`, `updatedAt`.

Online to‘lov uchun shu javobga `payment` obyekti ham qo‘shiladi — «Online to‘lov» bo‘limining 3-bandiga qarang.

Qo‘llanadigan statuslar: `PENDING`/`CONFIRMED`, `PENDING_PAYMENT`, `PROCESSING`/`SHIPMENT_CREATED`, `IN_TRANSIT`/`ON_THE_ROAD`/`OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURNED`. Muvaffaqiyatli javob shu DTO bilan OpenAPI sxemasiga kiritilishi kerak. Endpoint qo‘shilgach `npm run api:sync && npm run api:generate && npm run check` bajariladi.

## Tekshirish

`npm run check`: artifactlar yangiligi, TypeScript, ESLint, unit/regression testlar va production build.
`/api-test`: mock ishlatmasdan haqiqiy backend katalogini SSR va brauzerda yuklaydi.
`npm run test:api:live`: ishlab turgan frontendni Chrome’da tekshiradi; offline va qayta ulanish holatlarini ham qamraydi.
