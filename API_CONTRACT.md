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

## Auth va checkout

`auth.service.ts`: `POST /auth/login`, so‘ng `POST /guest/merge`. Checkout mehmon uchun ham `X-Session-Id` bilan ishlaydi:

- `POST /checkout/delivery-preview`: `{ address: CheckoutAddressDto }`.
- `POST /checkout`: `CreateCheckoutDto`, `paymentMethod: "cod"`; `Idempotency-Key` va `X-Session-Id` saqlanadi.
- `POST /checkout/:orderId/confirm`: yaratilgan COD buyurtmani tasdiqlash.
- `GET /orders/:orderId/tracking`: xaridor yoki shu mehmon sessiyasiga tegishli buyurtma holati. `X-Session-Id` yoki bearer token qabul qiladi. Javobda kamida `orderId`/`salesOrderId`/`id` va `status`; ixtiyoriy `estimatedDeliveryAt`, `updatedAt`, `trackingUrl`, `shipment.status` bo‘ladi. Storefront `PENDING`, `CONFIRMED`, `SHIPMENT_CREATED`, `ON_THE_ROAD`, `DELIVERED`, `CANCELLED`, `RETURNED` holatlarini ko‘rsatadi. Boshqa xaridor buyurtmasi uchun ma’lumot bermasligi, topilmagan yoki ruxsatsiz raqamga 404 qaytarishi kerak.

Snapshot preview/create/confirm javob turlarini bermaydi. Preview adapteri umumiy yetkazish haqi va barcha posilkalar narxini tekshiradi; yetishmagan yoki noto‘g‘ri narx bepul deb olinmaydi. 2026-09-11 kuni haqiqiy preview `{ subtotal, deliveryFee, totalAmount, packages: [{ shopId, itemsCount, subtotal, deliveryFee, totalAmount }] }` shaklida keldi. Yaratish javobidan kabinetdagi adapter kabi `orderId`, `id` yoki `salesOrderId` o‘qiladi.

Hudud ma’lumotlari ochiq endpointlardan olinadi: `GET /regions` va `GET /regions/:regionId/districts`. Checkout backend qaytargan haqiqiy `regionId` va `districtId`ni preview hamda create so‘rovlariga yuboradi. O‘qiladigan `address` qiymati viloyat, tuman va ko‘cha nomlaridan yig‘iladi.

`order.service.ts` faqat tasdiqlangan backend buyurtmasining brauzerdagi nusxasini saqlaydi. Sotuvchi kabineti buyurtmalarni `/seller/orders`dan oladi. Onlayn karta to‘lovi va xaridorning backend buyurtma tarixini ulash alohida vazifa.

## Tekshirish

`npm run check`: artifactlar yangiligi, TypeScript, ESLint, unit/regression testlar va production build.
`/api-test`: mock ishlatmasdan haqiqiy backend katalogini SSR va brauzerda yuklaydi.
`npm run test:api:live`: ishlab turgan frontendni Chrome’da tekshiradi; offline va qayta ulanish holatlarini ham qamraydi.
