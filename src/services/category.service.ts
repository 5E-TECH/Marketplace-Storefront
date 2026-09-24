import { cache } from "react";
import { env } from "@/config/env";
import { validateCategoryTreeDto } from "@/generated/api-validators";
import { apiRequest } from "@/lib/api";
import type { CatalogCategory, CategoryResult } from "@/types/commerce";
import type { CategoryTreeDto } from "@/types/storefront-api";
import { errorMessage } from "@/lib/errors";

const normalizeCategory = (category: CategoryTreeDto): CatalogCategory => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  parentId: category.parentId,
  iconUrl: category.iconUrl ?? undefined,
  icon: category.name.trim().charAt(0).toLocaleUpperCase("uz") || "K",
  children: category.children.filter((child) => child.isActive).map(normalizeCategory),
});
const validateCategoryTree = (value: unknown): value is CategoryTreeDto[] => Array.isArray(value) && value.every(validateCategoryTreeDto);

async function loadCategories(): Promise<CategoryResult> {
  if (!env.apiUrl) return { data: [], source: "unavailable", error: "API_URL sozlanmagan" };
  try {
    // Layout ham shu ro'yxatni kutadi — sekin backend har bir sahifaning birinchi baytini ushlab turmasin.
    const response = await apiRequest("/categories", { next: { revalidate: 300 }, timeoutMs: 4000, validate: validateCategoryTree });
    return { data: response.filter((category) => category.isActive).map(normalizeCategory), source: "api" };
  } catch (error) {
    return { data: [], source: "unavailable", error: errorMessage(error, "Kategoriyalar yuklanmadi") };
  }
}

export const categoryService = {
  // Layout, generateMetadata va sahifa bitta so'rov ichida bir marta chaqiradi (fetch signal tufayli dedupe ishlamaydi).
  list: cache(loadCategories),
};

export function findCategoryBySlug(categories: CatalogCategory[], slug: string): CatalogCategory | undefined {
  for (const category of categories) {
    if (category.slug === slug) return category;
    const child = findCategoryBySlug(category.children, slug);
    if (child) return child;
  }
}
