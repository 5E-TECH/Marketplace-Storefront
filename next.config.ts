import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

const toPattern = (value: string | undefined): RemotePattern[] => {
  try {
    if (!value) return [];
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return [];
    const basePath = url.pathname.replace(/\/+$/, "");
    return [{
      protocol: url.protocol.slice(0, -1) as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: basePath && basePath !== "/" ? `${basePath}/**` : "/**",
    }];
  } catch { return []; }
};

const productionImagePattern: RemotePattern = { protocol: "https", hostname: "api.elchimarket.uz", pathname: "/media/**" };
const apiUrl = process.env.API_BASE_URL ?? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const configuredPatterns = [...toPattern(apiUrl), ...toPattern(process.env.MEDIA_BASE_URL)];
const remotePatterns = [productionImagePattern, ...configuredPatterns].filter((pattern, index, patterns) =>
  patterns.findIndex((item) => item.protocol === pattern.protocol && item.hostname === pattern.hostname && item.port === pattern.port && item.pathname === pattern.pathname) === index,
);

/**
 * Production'da Cloudflare Tunnel to'g'ridan-to'g'ri `storefront:3001` ga
 * ulanadi (Caddy'siz), shuning uchun xavfsizlik sarlavhalarini Next'ning o'zi
 * qo'yadi. Skriptlarni cheklaydigan to'liq CSP ataylab yo'q — Next inline
 * skriptlari uchun nonce kerak bo'ladi; `frame-ancestors` esa skriptlarga
 * tegmaydi va clickjacking'ni yopadi. Sayt geolokatsiya, kamera va
 * mikrofondan foydalanmaydi.
 */
export const securityHeaders = (production: boolean) => [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];

// Brauzerdagi `getSafeImageSrc` ham aynan shu hostlarga ruxsat beradi — ikki ro'yxat ajralib ketmasin.
const imageHosts = remotePatterns.map((pattern) => `${pattern.hostname}${pattern.port ? `:${pattern.port}` : ""}`).join(",");

/**
 * Bu botlar title, description, canonical va og: teglarini `<head>` ichida oladi (blocking metadata).
 * Next standartda Googlebot'ga metadata'ni `<body>` oqimida beradi va JS bilan `<head>`ga ko'chiradi —
 * Google `rel=canonical` va `robots`ni faqat `<head>`dan ishonchli o'qiydi, shuning uchun u ham ro'yxatda.
 * Qolgani Next'ning standart ro'yxati + Telegram, Mail.ru va boshqa mahalliy qidiruv/preview botlari.
 */
export const htmlLimitedBots = /Googlebot|[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Mail\.RU_Bot|PetalBot|SeznamBot/i;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_IMAGE_HOSTS: imageHosts },
  // `next build` ishlayotgan dev server manifestlarini buzmasligi uchun cache'lar ajratilgan.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // Docker image `.next/standalone` serveri bilan node_modules'siz ishlaydi.
  output: "standalone",
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.69"],
  htmlLimitedBots,
  images: {
    remotePatterns,
    // AVIF birinchi kodlashda WebP'dan ~2 barobar sekin (o'lchandi: ~450 ms vs ~200 ms) va serverni
    // ko'proq yuklaydi; har yangi rasm/o'lcham birinchi ko'rishda shuncha kutadi. WebP hajmi biroz katta, lekin tez.
    formats: ["image/webp"],
    // Media fayl nomlari vaqt + UUID (o'zgarmas): optimallashtirilgan nusxa bir oy keshda turadi,
    // aks holda har 60 soniyada backenddan qayta yuklanib, qayta kodlanardi.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders(process.env.NODE_ENV === "production") },
      // Shrift fayllari o'zgarmaydi (yangi versiya yangi nom bilan qo'shiladi) — next/font kabi uzoq keshlanadi.
      { source: "/fonts/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  compress: true,
};

export default nextConfig;
