import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryStorefront } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { categoryService, findCategoryBySlug } from "@/services/category.service";
import { productService } from "@/services/product.service";
import { defaultOpenGraphImages } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<CatalogSearchParams> };

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const categories = await categoryService.list();
  const category = findCategoryBySlug(categories.data, slug);
  const canonical = `/katalog/${encodeURIComponent(slug)}`;
  const description = `${category?.name} kategoriyasidagi mahsulotlar, narxlar va takliflarni Elchi Market’da ko‘ring.`;
  return category ? { title: category.name, description, alternates: { canonical }, openGraph: { title: category.name, description, url: canonical, images: defaultOpenGraphImages } } : { title: "Kategoriya topilmadi", description: "So‘ralgan mahsulot kategoriyasi topilmadi." };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, rawQuery, categories] = await Promise.all([params, searchParams, categoryService.list()]);
  const category = findCategoryBySlug(categories.data, slug);
  if (!category) notFound();
  const query = parseCatalogQuery(rawQuery, category.id);
  const catalog = await productService.list(query);
  return <CategoryStorefront category={category} categories={categories.data} query={query} catalog={catalog}/>;
}
