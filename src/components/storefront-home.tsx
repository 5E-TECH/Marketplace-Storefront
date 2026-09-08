import Link from "next/link";
import type { CatalogResult, ProductQuery } from "@/types/commerce";
import { Benefits, CategoryGrid, Hero, Inspiration, Newsletter, Products } from "./home-sections";

export function StorefrontHome({ query, catalog }: { query: ProductQuery; catalog: CatalogResult }) {
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    Object.entries({ ...query, page }).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
    return `/?${params.toString()}#products`;
  };

  return <main>
    <Hero product={catalog.data[0]}/>
    <CategoryGrid products={catalog.data}/>
    <Products products={catalog.data} search={query.search} apiError={catalog.error}/>
    {catalog.totalPages > 1 && <nav className="load-more-wrap" aria-label="Katalog sahifalari">
      {catalog.page > 1 && <Link className="button button--secondary" href={pageHref(catalog.page - 1)}>Oldingi sahifa</Link>}
      <span>{catalog.page} / {catalog.totalPages}</span>
      {catalog.page < catalog.totalPages && <Link className="button button--secondary" href={pageHref(catalog.page + 1)}>Keyingi sahifa</Link>}
    </nav>}
    <Benefits/>
    <Inspiration products={catalog.data}/>
    <Newsletter/>
  </main>;
}
