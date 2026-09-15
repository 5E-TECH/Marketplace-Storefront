import type { Product } from "@/types/commerce";

const DEMO_IMAGE = "/demo-product.svg";

export const getSafeImageSrc = (value: string): string => {
  try {
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.hostname === "api.elchimarket.uz" ? url.toString() : DEMO_IMAGE;
  } catch {
    return DEMO_IMAGE;
  }
};

export const migrateStoredProduct = (product: Product): Product => {
  const image = getSafeImageSrc(product.image);
  const images = [...new Set((product.images?.length ? product.images : [image]).map(getSafeImageSrc))];
  return { ...product, image, images: images.length ? images : [DEMO_IMAGE] };
};
