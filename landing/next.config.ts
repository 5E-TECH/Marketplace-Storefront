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
  // SF-03: CSS HTML ichida — birinchi chizish alohida CSS so‘rovini (sekin 4G da ~0.6 s) kutmaydi.
  experimental: { inlineCss: true },
  poweredByHeader: false,
  compress: true,
  /**
   * SF-03: `/<kod>` → `/v/<variant>/<kod>` (va `/buyurtma`, `/rahmat`). Variant — middleware qo‘ygan
   * `x-elchi-variant` sarlavhasi (`src/lib/routing.ts` VARIANT_HEADER). Config rewrite bilan statik sahifa
   * ISR keshidan beriladi (middleware rewrite’i bilan Next keshni ishlatmaydi — 2026-11-19 da sinab ko‘rildi).
   */
  async rewrites() {
    const has = [{ type: "header" as const, key: "x-elchi-variant", value: "(?<variant>s1|s3)" }];
    return {
      beforeFiles: [
        { source: "/:code([A-Za-z0-9_-]+)", has, destination: "/v/:variant/:code" },
        { source: "/:code([A-Za-z0-9_-]+)/:sub(buyurtma|rahmat)", has, destination: "/v/:variant/:code/:sub" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [{ source: "/:path*", headers: [robotsHeader, ...securityHeaders(process.env.NODE_ENV === "production")] }];
  },
};

export default nextConfig;
