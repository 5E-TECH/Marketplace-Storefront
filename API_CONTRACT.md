# Elchi Market API contract

`API_BASE_URL` backendning `/api/v1` bilan tugaydigan bazaviy manzili. `API_URL` va `NEXT_PUBLIC_API_URL` fallback sifatida qo‘llanadi. Server uchun `API_BASE_URL` afzal. `API_TIMEOUT_MS` so‘rov vaqt chegarasi (standart 10 000 ms).

## Katalog

- `GET /storefront/products`
- `GET /storefront/products/:id`
- `GET /storefront/shops/:shopId/products`

Query: `page`, `limit`, `search`, `categoryId`, `minPrice`, `maxPrice`, `sort=price:asc`.
Backend ro‘yxati: `{ items, total, page, limit, totalPages }`, yoki `data` envelope.
Mahsulotda `id`, `name`, `shop`, `category`, `variants`, narx va rasm fieldlari ishlatiladi.

Frontend `/api/v1/storefront/products` va `/storefront/products` endpointlari normalizatsiya qilingan `{ data: Product[], total, page, limit, totalPages, source, error? }` javobini qaytaradi. `source`: `api`, `mock`, `unavailable`. Proxy limitni 1–100 oralig‘ida cheklaydi.

## Savatcha

Brauzer `/api/cart` orqali backend `/cart` endpointlariga murojaat qiladi.

- `GET /cart`
- `POST /cart/items`: `{ productId, variantId, quantity }`
- `PATCH /cart/items/:itemId`: `{ quantity }`
- `DELETE /cart/items/:itemId`
- `POST /cart/merge`

Savatcha: `{ id?, items: [{ id, productId, variantId?, product, variant?, quantity, color?, unitPrice? }] }`, yoki `data` envelope. Birlik narxi `unitPrice`, keyin `variant.price`, keyin `product.price` orqali olinadi. Miqdor musbat butun son bo‘lishi kerak. Narx va ombor cheklovlarini backend mustaqil tekshirishi shart.

## Sevimlilar va guest session

- `GET /favorites`
- `POST /favorites/:productId`
- `DELETE /favorites/:productId`
- `GET /favorites/:productId/check`
- `POST /guest/merge`

Frontend yo‘llariga `/api` prefiksi qo‘shiladi. Browser `X-Session-Id` yuboradi; mavjud bo‘lsa `Authorization: Bearer ...` ham yuboriladi. Muvaffaqiyatli guest merge’dan keyin guest session yangilanadi va providerlar ma’lumotni qayta yuklaydi.

## Seller/admin

`product-admin.service.ts` `/products`, `/products/my`, `/products/:id` va `/products/:id/variants` operatsiyalarini taqdim etadi. Haqiqiy access token tashqaridan beriladi; hozir seller UI yo‘q.

## Hali ulanmagan

`auth.service.ts` demo kod bilan local session yaratadi. `order.service.ts` buyurtmani faqat localStorage’da saqlaydi. Haqiqiy SMS, auth, order va payment endpointlari tasdiqlanmagan; frontend ularni taxmin qilib chaqirmaydi.
