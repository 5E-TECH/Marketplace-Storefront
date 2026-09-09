import { StorefrontHome } from "@/components/storefront-home";
import { parseCatalogQuery, type CatalogSearchParams } from "@/lib/catalog-query";
import { categoryService } from "@/services/category.service";
import { productService } from "@/services/product.service";

export default async function Home({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const params = await searchParams;
  const query = parseCatalogQuery(params);
  const [catalog, categories] = await Promise.all([productService.list(query), categoryService.list()]);
  return <StorefrontHome query={query} catalog={catalog} categories={categories.data}/>;
}
