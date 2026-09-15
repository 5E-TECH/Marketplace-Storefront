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

Qo‘llanadigan statuslar: `PENDING`/`CONFIRMED`, `PROCESSING`/`SHIPMENT_CREATED`, `IN_TRANSIT`/`ON_THE_ROAD`/`OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURNED`. Muvaffaqiyatli javob shu DTO bilan OpenAPI sxemasiga kiritilishi kerak. Endpoint qo‘shilgach `npm run api:sync && npm run api:generate && npm run check` bajariladi.

## Tekshirish

`npm run check`: artifactlar yangiligi, TypeScript, ESLint, unit/regression testlar va production build.
`/api-test`: mock ishlatmasdan haqiqiy backend katalogini SSR va brauzerda yuklaydi.
`npm run test:api:live`: ishlab turgan frontendni Chrome’da tekshiradi; offline va qayta ulanish holatlarini ham qamraydi.
