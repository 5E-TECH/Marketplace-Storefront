import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryStorefront } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { categoryService, findCategoryBySlug } from "@/services/category.service";
import { productService } from "@/services/product.service";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const categories = await categoryService.list();
  const category = findCategoryBySlug(categories.data, slug);
  return category ? { title: category.name, description: `${category.name} kategoriyasidagi mahsulotlar va narxlar.` } : {};
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, rawQuery, categories] = await Promise.all([params, searchParams, categoryService.list()]);
  const category = findCategoryBySlug(categories.data, slug);
  if (!category) notFound();
  const query = parseCatalogQuery(rawQuery, category.id);
  const catalog = await productService.list(query);
  return <CategoryStorefront category={category} categories={categories.data} query={query} catalog={catalog}/>;
}
