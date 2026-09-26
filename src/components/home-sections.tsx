import { ArrowRight, Package, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { catalogHref } from "@/lib/catalog-query";
import { getSafeImageSrc } from "@/lib/product-storage";
import type { CatalogCategory, Product, ProductQuery, ProductSort, StorefrontShop } from "@/types/commerce";
import { ProductGrid } from "./product-grid";
import { Container } from "./ui";
import { CategoryIcon } from "./category-icon";

export function CategoryGrid({ categories }: { categories: CatalogCategory[] }) {
  if (!categories.length) return null;
  return <Container><section className="category-grid" aria-label="Kategoriyalar">{categories.slice(0, 6).map((category) => <Link href={`/katalog/${category.slug}`} className="category-card" key={category.id}><CategoryIcon className="category-card-icon" name={category.name} iconUrl={category.iconUrl}/><span><b>{category.name}</b></span><ArrowRight size={18}/></Link>)}</section></Container>;
}

export function FeaturedShops({ shops }: { shops: StorefrontShop[] }) {
  if (!shops.length) return null;
  return <Container><section className="featured-shops" aria-labelledby="featured-shops-title">
    <div className="section-header"><h2 id="featured-shops-title">Tavsiya etilgan do‘konlar</h2></div>
    <div className="featured-shops-grid">{shops.map((shop) => <Link className="featured-shop-card" href={`/dokon/${encodeURIComponent(shop.slug)}`} key={shop.id}>
      <span className="featured-shop-logo">{shop.logoUrl ? <Image src={getSafeImageSrc(shop.logoUrl)} alt="" width={72} height={72}/> : shop.name.charAt(0).toLocaleUpperCase("uz")}</span>
      <span className="featured-shop-copy"><b>{shop.name}</b>{shop.description && <small>{shop.description}</small>}<span className="featured-shop-meta"><span><Star size={14} fill="currentColor"/> {shop.rating.toLocaleString("uz-UZ", { maximumFractionDigits: 1 })}</span>{shop.productCount !== undefined && <span><Package size={14}/> {shop.productCount} ta mahsulot</span>}</span></span>
      <ArrowRight aria-hidden size={19}/>
    </Link>)}</div>
  </section></Container>;
}

// `short` — telefonda uchala variant bir qatorga sig'ishi uchun.
const sorts: { value: ProductSort; label: string; short: string }[] = [{ value: "createdAt:desc", label: "Yangi kelganlar", short: "Yangi" }, { value: "price:asc", label: "Arzondan qimmatga", short: "Arzonroq" }, { value: "price:desc", label: "Qimmatdan arzonga", short: "Qimmatroq" }];

export function Products({ products, total, query, basePath, title, apiError }: { products: Product[]; total: number; query: ProductQuery; basePath: string; title?: string; apiError?: string }) {
  const heading = title ?? (query.search ? `“${query.search}” bo‘yicha natijalar` : "Barcha mahsulotlar");
  return <Container><section id="products" className="content-section"><div className="catalog-heading"><div><h2>{heading}</h2><p>{total} ta mahsulot</p></div><nav className="sort-control" aria-label="Mahsulotlarni saralash">{sorts.map((sort) => <Link key={sort.value} href={catalogHref(basePath, query, { sort: sort.value, page: 1 })} aria-current={query.sort === sort.value ? "page" : undefined} aria-label={sort.label}><span className="sort-label">{sort.label}</span><span className="sort-label--short" aria-hidden>{sort.short}</span></Link>)}</nav></div>{apiError && <div className="catalog-notice catalog-notice--error"><p>Mahsulotlarni hozir yuklab bo‘lmadi. Internet aloqasini tekshirib, sahifani yangilang.</p></div>}{products.length ? <ProductGrid key={products.map((product) => product.id).join(":")} products={products}/> : <div className="catalog-empty"><h3>{apiError ? "Mahsulotlar yuklanmadi" : "Mahsulot topilmadi"}</h3><p>{apiError ? "Server javob bermayapti. Birozdan keyin qayta kirib ko‘ring." : "Bu kategoriya yoki filtr bo‘yicha hozircha mahsulot yo‘q."}</p>{(query.search || query.minPrice !== undefined || query.maxPrice !== undefined) && <Link className="button button--secondary" href={basePath}>Filtrlarni tozalash</Link>}</div>}</section></Container>;
}
