# Elchi Market

Next.js App Router, React va TypeScript asosidagi o‘zbekcha marketplace frontend.

## Ishga tushirish

Node.js 22.15+ (CI: Node.js 24) va npm kerak.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Frontend: http://localhost:3001. `.env.local` ichida backend manzilini belgilang. Productionda `NEXT_PUBLIC_SITE_URL=https://domen.uz` ko‘rinishida haqiqiy frontend domenini yozing; Telegram preview va canonical URL shu qiymatdan yaratiladi. `USE_MOCK_DATA=true` faqat katalog uchun demo mahsulotlarni yoqadi; savatcha va sevimlilar uchun backend kerak.

```sh
npm run check       # TypeScript, ESLint, regression testlar, production build
npm start           # Production: 3001
npm run start:prod  # Production: 3002
```

## Tuzilishi

- `src/app`: sahifalar va backendga yo‘naltiruvchi API route’lar.
- `src/components`: katalog, mahsulot, savatcha, checkout va profil interfeysi.
- `src/providers`: umumiy savatcha va sevimlilar holati. Savatcha so‘rovlari ketma-ket bajariladi.
- `src/services`: mahsulot, savatcha, sevimlilar, auth va buyurtma adapterlari.
- `src/lib`: HTTP client, token/guest session, DTO adapterlari va formatterlar.
- `src/types`: frontend domain turlari va backend DTO’lari.
- `tests`: narx, miqdor, buyurtma va HTTP xatolari bo‘yicha regression testlar.

Katalog serverda yuklanadi va 30 soniyalik revalidation ishlatadi. Bu brauzerda dastlabki qo‘shimcha API so‘rovini olib tashlaydi va mahsulotlarni HTML ichida beradi. Katalog sahifalari qidiruv/filter parametrlarini saqlaydi. Shaxsiy savatcha va sevimlilar javoblari keshlanmaydi.

## Integratsiya holati

Katalog, `/mahsulot/<slug>` mahsulot sahifasi, `/dokon/<slug>` do‘kon sahifasi, savatcha va sevimlilar backend API bilan ishlaydi. Mahsulot sahifasi Telegram uchun Open Graph/Twitter teglarini va Google uchun Product JSON-LD ma’lumotini serverda chiqaradi. Endpointlar: [API_CONTRACT.md](API_CONTRACT.md).

Login backendning `/auth/login` endpointi bilan ishlaydi. Mehmon savati va sevimlilar login muvaffaqiyatli bo‘lgach `/guest/merge` orqali akkauntga birlashtiriladi. Checkout haqiqiy backendda buyurtma yaratadi va COD (qo‘lga to‘lash) buyurtmasini tasdiqlaydi. Buyurtmalar sahifasi hozircha shu brauzerda saqlangan tasdiqlangan buyurtma nusxalarini ko‘rsatadi; backenddagi yetkazish holatini kuzatish va onlayn karta to‘lovi hali ulanmagan.

Obuna formasi, manzillar boshqaruvi va marketingdagi yetkazish da’volari to‘liq biznes integratsiyasini kutmoqda.

## GitHub

`.gitignore` maxfiy `.env` fayllari, dependency’lar va build natijalarini chiqarib tashlaydi. Faqat `.env.example` commit qilinadi. `.github/workflows/ci.yml` har bir push va pull request uchun tekshiruvlarni bajaradi.

Repository manzili va GitHub yozish huquqi kerak. Mavjud repository bilan ishlaganda avval uning tarixini olish va mos branchda birlashtirish lozim; mavjud tarixni force push bilan almashtirmang.

## Yagona API qatlami

Barcha backend so‘rovlari `src/lib/api.ts` ichidagi `apiRequest` orqali o‘tadi. Sahifa va service’larda to‘g‘ridan-to‘g‘ri `fetch` ishlatishni ESLint taqiqlaydi. SSR backendning `.env.local` dagi `API_BASE_URL` manziliga murojaat qiladi. Brauzer shu domenning `/api/backend/*` yo‘li orqali ishlaydi; backend manzili client bundle’ga kerak emas. Serverdagi shaxsiy so‘rovlarga `headers` orqali cookie/token aniq berilishi kerak; foydalanuvchi sessiyasi global server holatida saqlanmaydi.

```ts
import { apiRequest } from "@/lib/api";
import { validateStorefrontProductsPageDto } from "@/generated/api-validators";

const products = await apiRequest("/storefront/products", {
  params: { page: 1, limit: 5 },
  validate: validateStorefrontProductsPageDto,
});
```

`ApiError` ichida `status`, `message`, `kind` mavjud. `kind`: `network`, `timeout`, `aborted`, `not_found`, `http`, `invalid_response`, `configuration`. Timeout javob tanasini o‘qishni ham qamrab oladi. GET va mutatsiyalar avtomatik takrorlanmaydi. 204/205 bo‘sh javoblar mutatsiyalar uchun qabul qilinadi; katalog javobi sifatida xato beradi.

`/api-test` sahifasi haqiqiy backenddan mahsulotlarni SSR va brauzerda alohida yuklaydi. Bu sahifa `USE_MOCK_DATA`ni chetlab o‘tadi: demo mahsulotlar muvaffaqiyat deb ko‘rsatilmaydi. Natija va xatolar sahifada ko‘rinadi.

OpenAPI manbasi, generatsiya buyruqlari va kontraktdagi noaniqliklar: [contract/README.md](contract/README.md).

Haqiqiy backend va Chrome bilan smoke test (alohida terminalda `npm run dev` yoki build qilingan server ishlab tursin):

```sh
npm run test:api:live
# Boshqa frontend porti uchun:
API_TEST_URL=http://127.0.0.1:3101 npm run test:api:live
```

Test Google Chrome (`CHROME_PATH` bilan almashtirish mumkin) orqali mahsulotlarning SSR HTML va brauzerda chiqishini, internet uzilgandagi xatoni va qayta ulanishni tekshiradi. U real backendga bog‘liq bo‘lgani uchun odatiy CI unit testlaridan alohida ishlatiladi.

## Checkout

`/checkout` mehmon va kirgan xaridorning mavjud savatini ishlatadi. Oqim: `POST /checkout/delivery-preview` → `POST /checkout` → `POST /checkout/:orderId/confirm`. Barcha so‘rovlarda savatning `X-Session-Id` qiymati, kirgan xaridorda access token ham bor. Yaratish uchun `Idempotency-Key` proxy orqali saqlanadi. Yaratish javobi yo‘qolsa bir xil kalit bilan qayta so‘raladi; ID olingach faqat tasdiqlash takrorlanadi. SessionStorage davom etayotgan buyurtmani sahifa yangilanganda tiklaydi. Backend bir xil kalitni deduplikatsiya qilishi va COD tasdiqlashni takrorlashga ruxsat berishi kerak.

Tasdiqlangach xaridor `/orders/:orderId?placed=1` sahifasiga o‘tadi. Buyurtma cheki mehmon uchun localStorage’da qoladi, `/track-order` saqlangan raqamlarni ko‘rsatadi va qo‘lda raqam kiritishga imkon beradi. Holat `GET /orders/:orderId/tracking` orqali `X-Session-Id` yoki login tokeni bilan yangilanadi; backend hali mavjud bo‘lmasa saqlangan chek ko‘rsatiladi.

Manzil/miqdor/narx o‘zgarganda eski yetkazish hisobi darhol bekor bo‘ladi. Narx olinmasdan tasdiqlash mumkin emas. So‘rov vaqtida savat mutatsiyalari bloklanadi. Tasdiqlangan buyurtmani brauzer tarixiga saqlashdagi xato backend muvaffaqiyatini bekor qilmaydi.

### Viloyat va tumanlar

Checkout viloyatlarni `GET /regions`, tanlangan viloyat tumanlarini `GET /regions/:regionId/districts` orqali oladi. Tanlov qiymatlari backendning haqiqiy IDlari bo‘lib, preview va buyurtma yaratish so‘rovlariga `regionId` hamda `districtId` sifatida yuboriladi. Endpoint ishlamasa select bloklanadi va qayta yuklash tugmasi chiqadi; lokal yoki tartib raqamidan yasalgan ID ishlatilmaydi.

### Checkout tekshiruvlari

```sh
npm run check
npm run test:checkout # builddan keyin: lokal fixture backend + Chrome, haqiqiy buyurtmasiz
```

Brauzer testi mehmon oqimi, proxy headerlari, mobil ekran, ikki marta bosish, eski narxni bekor qilish, narxni qayta hisoblash, qoldiq/manzil xatolari, create/confirm timeoutidan keyin reload va tarixga yozishdagi xatoni tekshiradi.

Haqiqiy sotuvchi kabinetida ko‘rinishini tekshirish uchun `npm run test:checkout:live` bor. Bu **haqiqiy COD test buyurtmasi yaratadi**. Ishlab turgan storefront va test sotuvchi/mahsulotdan foydalaning. Kerakli env: `CHECKOUT_API_URL` (`/api/v1` bilan), `CHECKOUT_TEST_PRODUCT_ID`, `CHECKOUT_TEST_VARIANT_ID`, `CHECKOUT_TEST_NAME`, `CHECKOUT_TEST_PHONE`, `CHECKOUT_TEST_ADDRESS`. Seller auth uchun `CHECKOUT_SELLER_TOKEN_FILE` yoki `CHECKOUT_SELLER_PHONE` + `CHECKOUT_SELLER_PASSWORD_FILE` beriladi; parol va token repoga yozilmaydi. Ixtiyoriy: `CHECKOUT_STOREFRONT_URL` (standart `http://127.0.0.1:3001`), `CHECKOUT_TEST_REGION_ID`, `CHECKOUT_TEST_DISTRICT_ID`. Test `/seller/orders`dagi `salesOrderId` orqali natijani tekshiradi; test buyurtmasi ko‘rib chiqish uchun kabinetda qoldiriladi.

Kabinetdagi eski `CheckoutPage`ni olib tashlash alohida C5.4 vazifasidir; bu repository storefront oqimini amalga oshiradi.
