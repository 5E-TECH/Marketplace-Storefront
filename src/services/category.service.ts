import { env } from "@/config/env";
import { validateCategoryTreeDto } from "@/generated/api-validators";
import { apiRequest } from "@/lib/api";
import type { CatalogCategory, CategoryResult } from "@/types/commerce";
import type { CategoryTreeDto } from "@/types/storefront-api";

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

export const categoryService = {
  async list(): Promise<CategoryResult> {
    if (!env.apiUrl) return { data: [], source: "unavailable", error: "API_URL sozlanmagan" };
    try {
      const response = await apiRequest("/categories", { next: { revalidate: 300 }, validate: validateCategoryTree });
      return { data: response.filter((category) => category.isActive).map(normalizeCategory), source: "api" };
    } catch (error) {
      return { data: [], source: "unavailable", error: error instanceof Error ? error.message : "Kategoriyalar yuklanmadi" };
    }
  },
};

export function findCategoryBySlug(categories: CatalogCategory[], slug: string): CatalogCategory | undefined {
  for (const category of categories) {
    if (category.slug === slug) return category;
    const child = findCategoryBySlug(category.children, slug);
    if (child) return child;
  }
}
