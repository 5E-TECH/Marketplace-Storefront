import Link from "next/link";
import Image from "next/image";
import { catalogHref } from "@/lib/catalog-query";
import { getSafeImageSrc } from "@/lib/product-storage";
import { paginationItems } from "@/lib/pagination";
import type { Banner, CatalogCategory, CatalogResult, ProductQuery, StorefrontShop } from "@/types/commerce";
import { Banners, CategoryGrid, FeaturedShops, Hero, Products } from "./home-sections";
import { ProductGrid } from "./product-grid";
import { Container } from "./ui";
import { CategoryIcon } from "./category-icon";

function CatalogPagination({ query, catalog, basePath }: { query: ProductQuery; catalog: CatalogResult; basePath: string }) {
  if (catalog.totalPages <= 1) return null;
  const currentPage = Math.min(Math.max(catalog.page, 1), catalog.totalPages);
  const items = paginationItems(catalog.totalPages, currentPage);
  return <nav className="catalog-pagination" aria-label="Katalog sahifalari">
    {currentPage > 1 && <Link className="pagination-arrow" href={catalogHref(basePath, query, { page: currentPage - 1 })} rel="prev" aria-label="Oldingi sahifa">←</Link>}
    <div className="pagination-pages">{items.map((item, index) => item === "ellipsis" ? <i aria-hidden key={`ellipsis-${index}`}>…</i> : <Link key={item} href={catalogHref(basePath, query, { page: item })} aria-current={item === currentPage ? "page" : undefined} aria-label={`${item}-sahifa`}>{item}</Link>)}</div>
    {currentPage < catalog.totalPages && <Link className="pagination-arrow" href={catalogHref(basePath, query, { page: currentPage + 1 })} rel="next" aria-label="Keyingi sahifa">→</Link>}
  </nav>;
}

export function StorefrontHome({ query, catalog, featuredShops = [], banners = [] }: { query: ProductQuery; catalog: CatalogResult; featuredShops?: StorefrontShop[]; banners?: Banner[] }) {
  return <main>
    <Hero product={catalog.data[0]}/>
    <Banners banners={banners}/>
    <FeaturedShops shops={featuredShops}/>
    <Products products={catalog.data} total={catalog.total} query={query} basePath="/" apiError={catalog.error}/>
    <CatalogPagination query={query} catalog={catalog} basePath="/"/>
  </main>;
}

export function CategoryStorefront({ category, categories, query, catalog }: { category: CatalogCategory; categories: CatalogCategory[]; query: ProductQuery; catalog: CatalogResult }) {
  const shownCategories = category.children.length ? category.children : categories;
  const basePath = `/katalog/${category.slug}`;
  return <main>
    <Container><nav className="catalog-breadcrumbs" aria-label="Sahifa yo‘li"><Link href="/">Bosh sahifa</Link><span>/</span><Link href="/katalog">Katalog</Link><span>/</span><b>{category.name}</b></nav><header className="catalog-hero"><CategoryIcon name={category.name} iconUrl={category.iconUrl}/><div><small>KATEGORIYA</small><h1>{category.name}</h1><p>{catalog.total} ta mahsulot topildi</p></div></header></Container>
    <CategoryGrid categories={shownCategories} products={catalog.data}/>
    <Container><form className="search-filters catalog-price-filters" action={basePath}><input type="hidden" name="sort" value={query.sort}/><label><span>Minimal narx</span><input name="minPrice" type="number" min="0" step="1000" defaultValue={query.minPrice} placeholder="0"/></label><label><span>Maksimal narx</span><input name="maxPrice" type="number" min="0" step="1000" defaultValue={query.maxPrice} placeholder="Masalan, 5000000"/></label><button className="button button--primary" type="submit">Narxni qo‘llash</button>{(query.minPrice !== undefined || query.maxPrice !== undefined) && <Link className="button button--secondary" href={basePath}>Tozalash</Link>}</form></Container>
    <Products products={catalog.data} total={catalog.total} query={query} basePath={basePath} title={`${category.name} mahsulotlari`} apiError={catalog.error}/>
    <CatalogPagination query={query} catalog={catalog} basePath={basePath}/>
  </main>;
}

export function SearchStorefront({ query, catalog, suggestions }: { query: ProductQuery; catalog: CatalogResult; suggestions: CatalogResult["data"] }) {
  return <main><Container><nav className="catalog-breadcrumbs" aria-label="Sahifa yo‘li"><Link href="/">Bosh sahifa</Link><span>/</span><b>Qidiruv</b></nav><header className="search-page-heading"><small>MAHSULOT QIDIRISH</small><h1>{query.search ? `“${query.search}” bo‘yicha natijalar` : "Nimani qidiryapsiz?"}</h1><p>{query.search ? `${catalog.total} ta mahsulot topildi` : "Tepadagi qidiruv maydoniga mahsulot nomini yozing."}</p></header></Container>
    {query.search ? <><Container><form className="search-filters" action="/qidiruv"><input type="hidden" name="q" value={query.search}/><input type="hidden" name="sort" value={query.sort}/><label><span>Minimal narx</span><input name="minPrice" type="number" min="0" step="1000" defaultValue={query.minPrice} placeholder="0"/></label><label><span>Maksimal narx</span><input name="maxPrice" type="number" min="0" step="1000" defaultValue={query.maxPrice} placeholder="Masalan, 5000000"/></label><button className="button button--primary" type="submit">Filtrlash</button>{(query.minPrice !== undefined || query.maxPrice !== undefined) && <Link className="button button--secondary" href={catalogHref("/qidiruv", query, { minPrice: undefined, maxPrice: undefined, page: 1 })}>Narxni tozalash</Link>}</form></Container><Products products={catalog.data} total={catalog.total} query={query} basePath="/qidiruv" apiError={catalog.error}/><CatalogPagination query={query} catalog={catalog} basePath="/qidiruv"/>{!catalog.error && !catalog.data.length && suggestions.length > 0 && <Container><section className="content-section search-alternatives"><h2>Boshqa mahsulotlarni ko‘ring</h2><p>Qidiruv so‘zini qisqartirish yoki boshqa nom bilan yozish ham yordam berishi mumkin.</p><ProductGrid products={suggestions}/></section></Container>}</> : null}
  </main>;
}

export function ShopStorefront({ shop, query, catalog }: { shop: StorefrontShop; query: ProductQuery; catalog: CatalogResult }) {
  const basePath = `/dokon/${encodeURIComponent(shop.slug)}`;
  return <main><Container><nav className="catalog-breadcrumbs" aria-label="Sahifa yo‘li"><Link href="/">Bosh sahifa</Link><span>/</span><b>{shop.name}</b></nav><header className="catalog-hero shop-hero">{shop.logoUrl ? <Image src={getSafeImageSrc(shop.logoUrl)} alt="" width={92} height={92}/> : <span>{shop.name.charAt(0).toLocaleUpperCase("uz")}</span>}<div><small>SOTUVCHI DO‘KONI</small><h1>{shop.name}</h1>{(shop.description || shop.address) && <p>{shop.description || shop.address}</p>}</div></header></Container><Products products={catalog.data} total={catalog.total} query={query} basePath={basePath} title={`${shop.name} mahsulotlari`} apiError={catalog.error}/><CatalogPagination query={query} catalog={catalog} basePath={basePath}/></main>;
}
