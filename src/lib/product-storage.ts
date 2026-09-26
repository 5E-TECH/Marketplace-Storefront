const FALLBACK_IMAGE = "/placeholder-product.svg";
// `next.config.ts` build paytida `images.remotePatterns` dan to'ldiradi (MEDIA_BASE_URL va API manzili).
const IMAGE_HOSTS = new Set((process.env.NEXT_PUBLIC_IMAGE_HOSTS || "api.elchimarket.uz").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean));

export const getSafeImageSrc = (value: string): string => {
  try {
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && IMAGE_HOSTS.has(url.host.toLowerCase()) ? url.toString() : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
};
