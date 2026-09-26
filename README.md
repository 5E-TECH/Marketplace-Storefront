# Elchi Market

Next.js App Router, React va TypeScript asosidagi o‘zbekcha marketplace frontend.

## Ishga tushirish

Node.js 22.15+ (CI: Node.js 24) va npm kerak.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Frontend: http://localhost:3001. `.env.local` ichida backend manzilini belgilang. Katalog, kategoriyalar va mahsulot sahifalari backend ma’lumotidan ishlaydi.

```sh
npm run check       # TypeScript, ESLint, regression testlar, production build
npm start           # Production: 3001
npm run start:prod  # Production: 3002
```

## Tuzilishi

- `src/app`: sahifalar va backendga yo‘naltiruvchi API route’lar.
- `src/components`: katalog, mahsulot, savatcha, checkout va profil interfeysi.
- `src/providers`: umumiy savatcha va sevimlilar holati. Savatcha miqdori UI’da darhol yangilanadi, tezkor o‘zgarishlar bitta backend so‘roviga birlashtiriladi.
- `src/services`: mahsulot, savatcha, sevimlilar, auth va buyurtma adapterlari.
- `src/lib`: HTTP client, token/guest session, DTO adapterlari va formatterlar.
- `src/types`: frontend domain turlari va backend DTO’lari.
- `tests`: narx, miqdor, buyurtma va HTTP xatolari bo‘yicha regression testlar.

Katalog serverda yuklanadi va 30 soniyalik revalidation ishlatadi. Bu brauzerda dastlabki qo‘shimcha API so‘rovini olib tashlaydi va mahsulotlarni HTML ichida beradi. Katalog sahifalari qidiruv/filter parametrlarini saqlaydi. Shaxsiy savatcha va sevimlilar javoblari keshlanmaydi.

Productionda ildiz domen Next.js SSR storefrontga, `admin.` subdomen esa alohida kabinet SPA’ga yo‘naltiriladi. Storefront sahifalari indekslanadi, admin kabinet esa `noindex` bilan yopiladi. Reverse-proxy namunasi va tekshiruvlar [DEPLOY.md](DEPLOY.md) ichida.

## Integratsiya holati

Katalog, mahsulot detail, savatcha va sevimlilar backend API bilan ishlaydi. Endpointlar: [API_CONTRACT.md](API_CONTRACT.md).

Checkout mehmon sessiyasi bilan ishlaydi: yetkazish narxini backenddan oladi, buyurtmani idempotent tarzda yaratadi va COD sifatida tasdiqlaydi. Tasdiqlangan buyurtmaning qisqa nusxasi shu brauzerda xaridor tarixi uchun saqlanadi. v1 (MVP) faqat COD bilan ishlaydi; Payme/Click v2’da, merchant shartnomalari rasmiylashtirilgach yoqiladi.

Xaridor telefon va parol bilan ro‘yxatdan o‘tishi yoki kirishi, parolini tiklashi, profilidagi ism va telefonni yangilashi hamda logout qilishi mumkin. Login paytida mehmon savati backenddagi akkaunt savatiga birlashtiriladi. Kirgan xaridorning buyurtmalar tarixi backenddan olinadi; hali sync bo‘lmagan shu brauzerdagi buyurtma nusxalari ham yo‘qolmaydi.

Obuna formasi, ijtimoiy tarmoq havolalari, manzillar boshqaruvi va marketingdagi reyting/yetkazish da’volari to‘liq biznes integratsiyasini kutmoqda. Statik kategoriya ID’lari backend kategoriyalari bilan moslashtirilishi kerak.

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

`/api-test` sahifasi haqiqiy backenddan mahsulotlarni SSR va brauzerda alohida yuklaydi. Natija va xatolar sahifada ko‘rinadi.

OpenAPI manbasi, generatsiya buyruqlari va kontraktdagi noaniqliklar: [contract/README.md](contract/README.md).

Haqiqiy backend va Chrome bilan smoke test (alohida terminalda `npm run dev` yoki build qilingan server ishlab tursin):

```sh
npm run test:api:live
# Boshqa frontend porti uchun:
API_TEST_URL=http://127.0.0.1:3101 npm run test:api:live
```

Test Google Chrome (`CHROME_PATH` bilan almashtirish mumkin) orqali mahsulotlarning SSR HTML va brauzerda chiqishini, internet uzilgandagi xatoni va qayta ulanishni tekshiradi. U real backendga bog‘liq bo‘lgani uchun odatiy CI unit testlaridan alohida ishlatiladi.
