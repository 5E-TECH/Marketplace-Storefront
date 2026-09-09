import { env } from "@/config/env";
import { categorySlug, marketplaceCategories } from "@/data/categories";
import { validateCategoryTreeDto } from "@/generated/api-validators";
import { apiRequest } from "@/lib/api";
import type { CatalogCategory, CategoryResult } from "@/types/commerce";
import type { CategoryTreeDto } from "@/types/storefront-api";

const fallbackCategories: CatalogCategory[] = marketplaceCategories.map((category) => ({
  id: category.id,
  name: category.name,
  slug: categorySlug(category.name),
  icon: category.icon,
  children: category.children.map((name) => ({ id: categorySlug(name), name, slug: categorySlug(name), parentId: category.id, icon: category.icon, children: [] })),
}));

const iconFor = (name: string, slug: string) => marketplaceCategories.find((category) => categorySlug(category.name) === slug || category.name === name)?.icon ?? "🛍️";
const normalizeCategory = (category: CategoryTreeDto): CatalogCategory => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  parentId: category.parentId,
  iconUrl: category.iconUrl ?? undefined,
  icon: iconFor(category.name, category.slug),
  children: category.children.filter((child) => child.isActive).map(normalizeCategory),
});
const validateCategoryTree = (value: unknown): value is CategoryTreeDto[] => Array.isArray(value) && value.every(validateCategoryTreeDto);

export const categoryService = {
  async list(): Promise<CategoryResult> {
    if (env.useMockData || !env.apiUrl) return { data: fallbackCategories, source: "fallback" };
    try {
      const response = await apiRequest("/categories", { next: { revalidate: 300 }, validate: validateCategoryTree });
      return { data: response.filter((category) => category.isActive).map(normalizeCategory), source: "api" };
    } catch (error) {
      return { data: fallbackCategories, source: "fallback", error: error instanceof Error ? error.message : "Kategoriyalar yuklanmadi" };
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
