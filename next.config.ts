import type { NextConfig } from "next";

const apiUrl = process.env.API_BASE_URL ?? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
const apiImagePattern = (() => {
  try {
    if (!apiUrl) return [];
    const url = new URL(apiUrl);
    return [{ protocol: url.protocol.slice(0, -1) as "http" | "https", hostname: url.hostname, port: url.port, pathname: "/**" }];
  } catch { return []; }
})();

const nextConfig: NextConfig = {
    // `next build` ishlayotgan dev server manifestlarini buzmasligi uchun cache'lar ajratilgan.
    distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
    reactStrictMode: true,
    allowedDevOrigins: ["192.168.1.69"],
    images: {
      remotePatterns: [
        ...apiImagePattern,
      ],
      formats: ["image/avif", "image/webp"],
    },
    poweredByHeader: false,
    compress: true,
};

export default nextConfig;
