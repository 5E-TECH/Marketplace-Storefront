import type { Product } from "@/types/commerce";

const FALLBACK_IMAGE = "/placeholder-product.svg";

export const getSafeImageSrc = (value: string): string => {
  try {
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.hostname === "api.elchimarket.uz" ? url.toString() : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
};

export const migrateStoredProduct = (product: Product): Product => {
  const image = getSafeImageSrc(product.image);
  const images = [...new Set((product.images?.length ? product.images : [image]).map(getSafeImageSrc))];
  return { ...product, image, images: images.length ? images : [FALLBACK_IMAGE] };
};
