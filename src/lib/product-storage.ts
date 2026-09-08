import type { Product } from "@/types/commerce";

const DEMO_IMAGE = "/demo-product.svg";

export const getSafeImageSrc = (value: string): string => {
  try {
    return new URL(value).hostname === "images.unsplash.com" ? DEMO_IMAGE : value;
  } catch {
    return value || DEMO_IMAGE;
  }
};

export const migrateStoredProduct = (product: Product): Product => {
  const image = getSafeImageSrc(product.image);
  const images = [...new Set((product.images?.length ? product.images : [image]).map(getSafeImageSrc))];
  return { ...product, image, images: images.length ? images : [DEMO_IMAGE] };
};
