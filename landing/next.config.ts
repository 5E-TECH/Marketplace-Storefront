import type { NextConfig } from "next";

/**
 * Sotuvchi sahifasi qidiruvga chiqmaydi (SF-01: noindex). robots.txt bilan yopilmaydi:
 * yopilsa qidiruv boti `noindex` sarlavhasini o‘qiy olmaydi, reklama platformalarining
 * tekshiruv botlari esa sahifani ko‘ra olmay qolishi mumkin.
 */
export const robotsHeader = { key: "X-Robots-Tag", value: "noindex, nofollow" };

/** Do‘kon saytidagi bilan bir xil (`../next.config.ts` securityHeaders), nusxa — import emas. */
export const securityHeaders = (production: boolean) => [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
];

const nextConfig: NextConfig = {
  // Docker image `.next/standalone` serveri bilan node_modules’siz ishlaydi.
  output: "standalone",
  // Repo ildizida do‘kon saytining package-lock.json fayli bor: kuzatuv ildizi shu papka.
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [{ source: "/:path*", headers: [robotsHeader, ...securityHeaders(process.env.NODE_ENV === "production")] }];
  },
};

export default nextConfig;
