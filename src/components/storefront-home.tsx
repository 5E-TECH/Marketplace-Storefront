import Link from "next/link";
import Image from "next/image";
import { catalogHref } from "@/lib/catalog-query";
import { getSafeImageSrc } from "@/lib/product-storage";
import { paginationItems } from "@/lib/pagination";
import type { Banner, CatalogCategory, CatalogResult, ProductQuery, StorefrontShop } from "@/types/commerce";
import { CategoryGrid, FeaturedShops, Products } from "./home-sections";
import { BannerCarousel } from "./banner-carousel";
import { ProductGrid } from "./product-grid";
import { Container } from "./ui";
import { CategoryIcon } from "./category-icon";
import { Breadcrumbs, PriceFilterForm } from "./catalog-controls";

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
    {/* Sahifa sarlavhasi qidiruv tizimi va ekran o'quvchi uchun; ko'rinadigan qism — bannerlar. */}
    <h1 className="sr-only">Elchi Market — O‘zbekistondagi onlayn marketplace</h1>
    {/* Keyingi sahifa, saralash yoki qidiruvda foydalanuvchi to'g'ridan-to'g'ri ro'yxatni ko'rsin. */}
    {(query.page ?? 1) === 1 && !query.search && query.sort === "createdAt:desc" && <Container><BannerCarousel banners={banners}/></Container>}
    <FeaturedShops shops={featuredShops}/>
    <Products products={catalog.data} total={catalog.total} query={query} basePath="/" apiError={catalog.error}/>
    <CatalogPagination query={query} catalog={catalog} basePath="/"/>
  </main>;
}

export function CategoryStorefront({ category, categories, query, catalog }: { category: CatalogCategory; categories: CatalogCategory[]; query: ProductQuery; catalog: CatalogResult }) {
  const shownCategories = category.children.length ? category.children : categories;
  const basePath = `/katalog/${category.slug}`;
  return <main>
    <Container>
      <Breadcrumbs items={[{ label: "Bosh sahifa", href: "/" }, { label: "Katalog", href: "/katalog" }, { label: category.name }]}/>
      <header className="catalog-hero"><CategoryIcon name={category.name} iconUrl={category.iconUrl}/><div><h1>{category.name}</h1><p>{catalog.total} ta mahsulot</p></div></header>
    </Container>
    <CategoryGrid categories={shownCategories}/>
    <Container><PriceFilterForm action={basePath} query={query} submitLabel="Ko‘rsatish" resetHref={basePath}/></Container>
    <Products products={catalog.data} total={catalog.total} query={query} basePath={basePath} title={`${category.name} mahsulotlari`} apiError={catalog.error}/>
    <CatalogPagination query={query} catalog={catalog} basePath={basePath}/>
  </main>;
}

export function SearchStorefront({ query, catalog, suggestions }: { query: ProductQuery; catalog: CatalogResult; suggestions: CatalogResult["data"] }) {
  return <main>
    <Container>
      <Breadcrumbs items={[{ label: "Bosh sahifa", href: "/" }, { label: "Qidiruv" }]}/>
      <header className="search-page-heading"><h1>{query.search ? `“${query.search}” bo‘yicha natijalar` : "Nimani qidiryapsiz?"}</h1><p>{query.search ? `${catalog.total} ta mahsulot topildi` : "Tepadagi qidiruv maydoniga mahsulot nomini yozing."}</p></header>
    </Container>
    {query.search && <>
      <Container><PriceFilterForm action="/qidiruv" query={query} hidden={{ q: query.search }} submitLabel="Ko‘rsatish" resetHref={catalogHref("/qidiruv", query, { minPrice: undefined, maxPrice: undefined, page: 1 })}/></Container>
      {/* Sahifa sarlavhasi qidiruv so'zini aytadi — bo'lim sarlavhasi uni takrorlamaydi. */}
      <Products products={catalog.data} total={catalog.total} query={query} basePath="/qidiruv" title="Mahsulotlar" apiError={catalog.error}/>
      <CatalogPagination query={query} catalog={catalog} basePath="/qidiruv"/>
      {!catalog.error && !catalog.data.length && suggestions.length > 0 && <Container><section className="content-section search-alternatives"><h2>Balki bular kerakdir</h2><p>So‘zni qisqaroq yoki boshqacha yozib ko‘ring — masalan, “telefon” o‘rniga “smartfon”.</p><ProductGrid products={suggestions}/></section></Container>}
    </>}
  </main>;
}

export function ShopStorefront({ shop, query, catalog }: { shop: StorefrontShop; query: ProductQuery; catalog: CatalogResult }) {
  const basePath = `/dokon/${encodeURIComponent(shop.slug)}`;
  return <main>
    <Container>
      <Breadcrumbs items={[{ label: "Bosh sahifa", href: "/" }, { label: shop.name }]}/>
      <header className="catalog-hero shop-hero">{shop.logoUrl ? <Image src={getSafeImageSrc(shop.logoUrl)} alt="" width={92} height={92}/> : <span>{shop.name.charAt(0).toLocaleUpperCase("uz")}</span>}<div><small>Do‘kon</small><h1>{shop.name}</h1>{(shop.description || shop.address) && <p>{shop.description || shop.address}</p>}</div></header>
    </Container>
    <Products products={catalog.data} total={catalog.total} query={query} basePath={basePath} title={`${shop.name} mahsulotlari`} apiError={catalog.error}/>
    <CatalogPagination query={query} catalog={catalog} basePath={basePath}/>
  </main>;
}
