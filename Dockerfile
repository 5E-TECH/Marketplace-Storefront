# Storefront (Next.js SSR) production image — C2.28.
#
# Kabinetdan farqi: bu statik fayllar to'plami emas, doim ishlab turadigan
# Node.js jarayoni. Sahifalar serverda yasaladi (SEO va Telegram'da havola
# ko'rinishi uchun), shuning uchun nginx bilan almashtirib bo'lmaydi.

# ── 1. Bog'liqliklar ─────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── 2. Build ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `next.config.ts` rasm hostini (images.remotePatterns) build vaqtida o'qiydi,
# shuning uchun API manzili shu yerda ham kerak. Ishlash vaqtidagi qiymat
# `API_BASE_URL` orqali alohida beriladi va uni o'zgartirish uchun qayta
# build shart emas.
ARG API_BASE_URL
ENV API_BASE_URL=${API_BASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 3. Ishga tushirish ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# Root ostida ishlatmaymiz.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# `standalone` ichida kerakli node_modules bo'lagi ham bor — butun daraxtni
# ko'chirish shart emas.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3001/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
