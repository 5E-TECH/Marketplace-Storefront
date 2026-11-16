# Sotuvchi sahifasi (SF-01): do‘kon saytidan alohida konteyner.
# Build konteksti — `landing/` papkasi: `docker build -t elchi-landing landing`.
# Do‘kon saytining `Dockerfile` i bilan bir xil tuzilish va Node versiyasi (CI: Node 24).

# ── 1. Bog‘liqliklar ─────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ── 2. Build ─────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Aloqa telefoni (EQ-05) bundle’ga yoziladi; bo‘sh bo‘lsa telefon bloki chiqmaydi.
ARG NEXT_PUBLIC_SUPPORT_PHONE=
ENV NEXT_PUBLIC_SUPPORT_PHONE=${NEXT_PUBLIC_SUPPORT_PHONE}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ── 3. Ishga tushirish ───────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3003

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3003/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
