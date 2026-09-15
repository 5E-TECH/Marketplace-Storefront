import type { NextConfig } from "next";

const apiUrl = process.env.API_BASE_URL ?? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const productionImagePattern = { protocol: "https" as const, hostname: "api.elchimarket.uz", pathname: "/media/**" };
const apiImagePattern = (() => {
  try {
    if (!apiUrl) return [];
    const url = new URL(apiUrl);
    if (url.hostname === productionImagePattern.hostname && url.protocol === "https:") return [];

const toPattern = (value: string | undefined) => {
  try {
    if (!value) return [];
    const url = new URL(value);
    return [{ protocol: url.protocol.slice(0, -1) as "http" | "https", hostname: url.hostname, port: url.port, pathname: "/**" }];
  } catch { return []; }
};

/**
 * Mahsulot rasmlari MinIO'da turadi va BRAUZERGA `MINIO_PUBLIC_URL` orqali
 * beriladi (masalan `https://api.elchimarket.uz/media/...`). `API_BASE_URL`
 * esa ICHKI manzil (`http://api-gateway:3000`) — SSR shu orqali boradi.
 * Ikkalasi boshqa host, shuning uchun faqat `API_BASE_URL` ni ruxsat berish
 * yetarli emas edi: `next/image` yuklangan rasmlarni rad etardi va katalog
 * bo'sh joy bilan chiqardi. `MEDIA_BASE_URL` shuning uchun alohida.
 */
const imagePatterns = [
  ...toPattern(apiUrl),
  ...toPattern(process.env.MEDIA_BASE_URL),
];

const nextConfig: NextConfig = {
    // `next build` ishlayotgan dev server manifestlarini buzmasligi uchun cache'lar ajratilgan.
    distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
    // Docker uchun: `.next/standalone` ichida o'zi yetarli server chiqadi,
    // shuning uchun image'ga butun node_modules ni ko'chirish shart emas.
    output: "standalone",
    reactStrictMode: true,
    allowedDevOrigins: ["192.168.1.69"],
    images: {
      remotePatterns: [
        productionImagePattern,
        ...apiImagePattern,
      ],
      remotePatterns: imagePatterns,
      formats: ["image/avif", "image/webp"],
    },
    poweredByHeader: false,
    compress: true,
};

export default nextConfig;
