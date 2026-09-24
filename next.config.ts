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

const nextConfig: NextConfig = {
  // `next build` ishlayotgan dev server manifestlarini buzmasligi uchun cache'lar ajratilgan.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // Docker image `.next/standalone` serveri bilan node_modules'siz ishlaydi.
  output: "standalone",
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.1.69"],
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders(process.env.NODE_ENV === "production") }];
  },
  compress: true,
};

export default nextConfig;
