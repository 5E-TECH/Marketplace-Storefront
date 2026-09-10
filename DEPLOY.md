# Deploy — xaridor sayti (storefront)

Kabinetdan asosiy farqi: bu statik fayllar to'plami emas, **doim ishlab
turadigan Node.js jarayoni**. Sahifalar serverda yasaladi (SSR) — SEO uchun
va Telegram'ga havola tashlanganda mahsulot nomi/narxi/rasmi ko'rinishi uchun.
Shuning uchun uni nginx bilan almashtirib bo'lmaydi.

## Hozirgi holat (2026-09-10)

Domen hali yo'q, shuning uchun port to'g'ridan-to'g'ri chiqarilgan:

```
Internet ──► :8080 ──► kabinet konteyneri     (SPA, nginx)
Internet ──► :8081 ──► storefront konteyneri  (SSR, Node)
Internet ──► :80   ──► Caddy ──► api-gateway  (API)
```

Domen olingach (C5.1/C5.2) tunnel `marketplace_edge` tarmog'i orqali
`storefront:3001` ga proxy qiladi va `docker-compose.prod.yml` dagi `ports`
bo'limi butunlay olib tashlanadi.

## Nega bu saytga CORS kerak emas

Brauzer backendga **to'g'ridan-to'g'ri murojaat qilmaydi**. Barcha so'rovlar
storefront'ning o'z `/api/backend/*` proxysi orqali ketadi, ya'ni bir xil
origin. Serverdan backendga esa ichki docker nomi bilan boriladi:

```
API_BASE_URL=http://api-gateway:3000/api/v1
```

Bu so'rov tashqi tarmoqqa umuman chiqmaydi. Kabinet boshqacha ishlaydi —
u backendga to'g'ridan-to'g'ri murojaat qiladi va shuning uchun unga
`CORS_ORIGINS` kerak.

## Muhit o'zgaruvchilari

`.env.production` serverda turadi va repo'ga **commit qilinmaydi** —
namunasi `.env.production.example` da.

| O'zgaruvchi | Vaqti | Izoh |
| --- | --- | --- |
| `API_BASE_URL` | ishlash | Backend manzili. O'zgartirish uchun qayta build SHART EMAS |
| `API_TIMEOUT_MS` | ishlash | SSR so'rovi kutish muddati |
| `NEXT_PUBLIC_SITE_URL` | build | Kanonik havola va `og:url` |
| `STOREFRONT_PORT` | ishlash | Tashqi port (domen qo'shilgach kerak bo'lmaydi) |

> `next.config.ts` rasm hostini (`images.remotePatterns`) **build vaqtida**
> o'qiydi, shuning uchun `API_BASE_URL` compose'da `build.args` sifatida ham
> uzatiladi. Rasm hosti o'zgarsa qayta build kerak.

## Qo'lda deploy

```bash
cd /home/deploy/marketplace-storefront
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## Avtomatik deploy

`main` ga push bo'lganda CI: `npm run check` (kontrakt, tiplar, lint, test,
build) → docker image quriladi → server yangilanadi → `/healthz` tekshiriladi.

Deploy job **secretlar qo'yilmaguncha o'zini o'tkazib yuboradi** (har push'da
qizil bo'lib turmasligi uchun). Kerakli secretlar — `Settings → Secrets and
variables → Actions`:

| Secret | Qiymat |
| --- | --- |
| `DEPLOY_HOST` | Server IP yoki domeni |
| `DEPLOY_USER` | SSH foydalanuvchi (`deploy`) |
| `DEPLOY_SSH_KEY` | Xususiy kalit, **base64** ko'rinishida |
| `DEPLOY_KNOWN_HOSTS` | `ssh-keyscan -H <host>` natijasi |

```bash
base64 -w0 ~/.ssh/deploy_key      # DEPLOY_SSH_KEY
ssh-keyscan -H 169.58.98.223      # DEPLOY_KNOWN_HOSTS
```

## Tekshirish

```bash
curl -s http://169.58.98.223:8081/healthz          # {"status":"ok",...}
curl -s http://169.58.98.223:8081/ | grep product-card
docker compose -f docker-compose.prod.yml logs -f storefront
```

## Orqaga qaytarish

Deploydan oldin joriy image teglab qo'yiladi:

```bash
docker tag marketplace-storefront:latest marketplace-storefront:rollback-$(date +%Y%m%d)
# qaytarish:
docker tag marketplace-storefront:rollback-YYYYMMDD marketplace-storefront:latest
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

## Ko'p uchraydigan xatolar

| Belgi | Sabab va yechim |
| --- | --- |
| `network marketplace_edge not found` | Avval backend stack'ini ko'taring |
| Sahifa ochiladi, mahsulot yo'q | `API_BASE_URL` noto'g'ri yoki backend yiqilgan — `/healthz` baribir 200 qaytaradi, chunki u backendga bog'liq emas |
| Rasm ko'rinmaydi | Rasm hosti build vaqtida yozilgan; `API_BASE_URL` o'zgargan bo'lsa qayta build kerak |
| Konteyner qayta-qayta ishga tushadi | `docker compose logs storefront` — odatda `.env.production` da majburiy qiymat yo'q |
