import type { Product } from "@/types/commerce";

const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (...values: unknown[]) => String(values.find((value) => typeof value === "string" || typeof value === "number") ?? "");
const number = (...values: unknown[]) => values.filter((value) => value !== null && value !== undefined && value !== "").map(Number).find(Number.isFinite) ?? 0;

export const normalizeApiProduct = (input: unknown): Product | null => {
  const product = object(object(input).product ?? input);
  const productId = product.id ?? product.productId;
  const name = text(product.name, product.title);
  if ((typeof productId !== "string" && typeof productId !== "number") || !name) return null;
  const media = Array.isArray(product.images) ? product.images : Array.isArray(product.media) ? product.media : [];
  const imageValues = media.map((item) => typeof item === "string" ? item : text(object(item).url, object(item).src, object(item).imageUrl)).filter(Boolean);
  const image = text(product.image, product.imageUrl, product.thumbnail, imageValues[0], "/placeholder-product.svg");
  const category = object(product.category);
  const colors = Array.isArray(product.colors) ? product.colors.map((color) => typeof color === "string" ? color : text(object(color).hex, object(color).value)).filter(Boolean) : [];
  return {
    ...(product as Partial<Product>), id: productId, name,
    category: text(category.name, product.categoryName, product.category, "Mahsulot"),
    price: number(product.price, product.salePrice, product.currentPrice),
    oldPrice: number(product.oldPrice, product.originalPrice, product.compareAtPrice) || undefined,
    rating: number(product.rating, product.averageRating), reviews: number(product.reviews, product.reviewsCount, product.reviewCount),
    image, images: [...new Set([image, ...imageValues])],
    description: text(product.description, product.shortDescription), colors,
  };
};
