import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Staging yoki test serverda ALLOW_INDEXING=false — sayt butunlay yopiladi.
  if (process.env.ALLOW_INDEXING === "false") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // Kirish va ro'yxatdan o'tish yopilmaydi: ular noindex, Google buni faqat sahifani o'qib bilib oladi.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/api-test", "/storefront/", "/healthz", "/checkout", "/orders/", "/profile", "/cart", "/favorites"] },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
