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

Login backendning `/auth/login` endpointi bilan ishlaydi. Mehmon savati va sevimlilar login muvaffaqiyatli bo‘lgach `/guest/merge` orqali akkauntga birlashtiriladi. Buyurtmalar hozircha shu brauzerning localStorage xotirasida saqlanadi; backend buyurtmasi va haqiqiy karta to‘lovi hali ulanmagan.

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
