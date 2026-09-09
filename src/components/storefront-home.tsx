import Link from "next/link";
import { catalogHref } from "@/lib/catalog-query";
import type { CatalogCategory, CatalogResult, ProductQuery } from "@/types/commerce";
import { Benefits, CategoryGrid, Hero, Inspiration, Newsletter, Products } from "./home-sections";
import { Container } from "./ui";

function CatalogPagination({ query, catalog, basePath }: { query: ProductQuery; catalog: CatalogResult; basePath: string }) {
  if (catalog.totalPages <= 1) return null;
  return <nav className="catalog-pagination" aria-label="Katalog sahifalari">
    {catalog.page > 1 ? <Link className="button button--secondary" href={catalogHref(basePath, query, { page: catalog.page - 1 })}>Oldingi sahifa</Link> : <span/>}
    <b>{catalog.page} / {catalog.totalPages}</b>
    {catalog.page < catalog.totalPages ? <Link className="button button--secondary" href={catalogHref(basePath, query, { page: catalog.page + 1 })}>Keyingi sahifa</Link> : <span/>}
  </nav>;
}

export function StorefrontHome({ query, catalog, categories }: { query: ProductQuery; catalog: CatalogResult; categories: CatalogCategory[] }) {
  return <main>
    <Hero product={catalog.data[0]}/>
    <CategoryGrid categories={categories} products={catalog.data}/>
    <Products products={catalog.data} total={catalog.total} query={query} basePath="/" apiError={catalog.error}/>
    <CatalogPagination query={query} catalog={catalog} basePath="/"/>
    <Benefits/>
    <Inspiration products={catalog.data}/>
    <Newsletter/>
  </main>;
}

export function CategoryStorefront({ category, categories, query, catalog }: { category: CatalogCategory; categories: CatalogCategory[]; query: ProductQuery; catalog: CatalogResult }) {
  const shownCategories = category.children.length ? category.children : categories;
  const basePath = `/katalog/${category.slug}`;
  return <main>
    <Container><nav className="catalog-breadcrumbs" aria-label="Sahifa yo‘li"><Link href="/">Bosh sahifa</Link><span>/</span><Link href="/katalog">Katalog</Link><span>/</span><b>{category.name}</b></nav><header className="catalog-hero"><span>{category.icon}</span><div><small>KATEGORIYA</small><h1>{category.name}</h1><p>{catalog.total} ta mahsulot topildi</p></div></header></Container>
    <CategoryGrid categories={shownCategories} products={catalog.data}/>
    <Products products={catalog.data} total={catalog.total} query={query} basePath={basePath} title={`${category.name} mahsulotlari`} apiError={catalog.error}/>
    <CatalogPagination query={query} catalog={catalog} basePath={basePath}/>
  </main>;
}
