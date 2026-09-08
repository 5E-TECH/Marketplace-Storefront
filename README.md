# Elchi Market

Next.js App Router, React va TypeScript asosidagi o‘zbekcha marketplace frontend.

## Ishga tushirish

Node.js 22.15+ (CI: Node.js 24) va npm kerak.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Frontend: http://localhost:3001. `.env.local` ichida backend manzilini belgilang. `USE_MOCK_DATA=true` faqat katalog uchun demo mahsulotlarni yoqadi; savatcha va sevimlilar uchun backend kerak.

```sh
npm run check       # TypeScript, ESLint, regression testlar, production build
npm start           # Production: 3001
npm run start:prod  # Production: 3002
```

## Tuzilishi

- `src/app`: sahifalar va backendga yo‘naltiruvchi API route’lar.
- `src/components`: katalog, mahsulot, savatcha, checkout va profil interfeysi.
- `src/providers`: umumiy savatcha va sevimlilar holati. Savatcha so‘rovlari ketma-ket bajariladi.
- `src/services`: mahsulot, savatcha, sevimlilar, demo auth/buyurtma adapterlari.
- `src/lib`: HTTP client, token/guest session, DTO adapterlari va formatterlar.
- `src/types`: frontend domain turlari va backend DTO’lari.
- `tests`: narx, miqdor, buyurtma va HTTP xatolari bo‘yicha regression testlar.

Katalog serverda yuklanadi va 30 soniyalik revalidation ishlatadi. Bu brauzerda dastlabki qo‘shimcha API so‘rovini olib tashlaydi va mahsulotlarni HTML ichida beradi. Katalog sahifalari qidiruv/filter parametrlarini saqlaydi. Shaxsiy savatcha va sevimlilar javoblari keshlanmaydi.

## Integratsiya holati

Katalog, mahsulot detail, savatcha va sevimlilar backend API bilan ishlaydi. Endpointlar: [API_CONTRACT.md](API_CONTRACT.md).

Telefon tasdiqlash **demo**: `111111`, SMS yuborilmaydi va haqiqiy access token yaratilmaydi. Buyurtmalar faqat shu brauzerning localStorage xotirasida saqlanadi; backend buyurtmasi, haqiqiy karta to‘lovi, foydalanuvchilar orasida ajratilgan buyurtma tarixi hali yo‘q. Demo checkout backenddagi savatcha elementlarini tozalashga urinadi. Uni real savdo jarayoni deb ishlatishdan oldin auth, order va payment API contractlari bilan integratsiya qilish kerak.

Obuna formasi, ijtimoiy tarmoq havolalari, manzillar boshqaruvi va marketingdagi reyting/yetkazish da’volari to‘liq biznes integratsiyasini kutmoqda. Statik kategoriya ID’lari backend kategoriyalari bilan moslashtirilishi kerak.

## GitHub

`.gitignore` maxfiy `.env` fayllari, dependency’lar va build natijalarini chiqarib tashlaydi. Faqat `.env.example` commit qilinadi. `.github/workflows/ci.yml` har bir push va pull request uchun tekshiruvlarni bajaradi.

Repository manzili va GitHub yozish huquqi kerak. Mavjud repository bilan ishlaganda avval uning tarixini olish va mos branchda birlashtirish lozim; mavjud tarixni force push bilan almashtirmang.
