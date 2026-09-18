import { ArrowRight, Package, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { catalogHref } from "@/lib/catalog-query";
import { getSafeImageSrc } from "@/lib/product-storage";
import type { CatalogCategory, Product, ProductQuery, ProductSort, StorefrontShop } from "@/types/commerce";
import { ProductGrid } from "./product-grid";
import { Container } from "./ui";
import { CategoryIcon } from "./category-icon";

export function Hero({ product }: { product?: Product }) {
  if (!product) return null;
  return <Container><section className="hero">
    <div className="hero-copy"><span className="hero-kicker">{product.shop?.name ?? product.category}</span><h1>{product.name}</h1><p>{product.description}</p>
      <div className="hero-buttons"><Link className="button button--primary" href={`/product/${product.id}`}>Hozir xarid qilish <ArrowRight size={18}/></Link><Link className="button button--secondary" href="#products">Katalogni ko‘rish</Link></div>
      {(product.rating > 0 || product.reviews > 0) && <div className="hero-meta"><span>★ {product.rating} / 5 reyting</span><span>{product.reviews} ta sharh</span></div>}
    </div>
    <div className="hero-visual"><Image src={getSafeImageSrc(product.image)} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 52vw"/><div className="hero-product-label"><small>{product.shop?.name ?? "Marketplace"}</small><b>{formatPrice(product.price)} so‘m</b></div></div>
  </section></Container>;
}

const categoryIds = (category: CatalogCategory): string[] => [String(category.id), ...category.children.flatMap(categoryIds)];

export function CategoryGrid({ categories, products }: { categories: CatalogCategory[]; products: Product[] }) {
  const cards = categories.slice(0, 6).map((category) => ({ category, product: products.find((product) => categoryIds(category).includes(String(product.categoryInfo?.id))) }));
  if (!categories.length) return null;
  return <Container><section className="category-grid" aria-label="Kategoriyalar">{cards.map(({ category, product }) => <Link href={`/katalog/${category.slug}`} className="category-card" key={category.id}>{product ? <Image src={getSafeImageSrc(product.image)} alt="" width={88} height={88}/> : <CategoryIcon className="category-card-icon" name={category.name} iconUrl={category.iconUrl}/>}<span><b>{category.name}</b><small>Mahsulotlarni ko‘rish</small></span><ArrowRight size={18}/></Link>)}</section></Container>;
}

export function FeaturedShops({ shops }: { shops: StorefrontShop[] }) {
  if (!shops.length) return null;
  return <Container><section className="featured-shops" aria-labelledby="featured-shops-title">
    <div className="section-header"><div><span>TANLANGAN SOTUVCHILAR</span><h2 id="featured-shops-title">Tavsiya etilgan do‘konlar</h2></div></div>
    <div className="featured-shops-grid">{shops.map((shop) => <Link className="featured-shop-card" href={`/dokon/${encodeURIComponent(shop.slug)}`} key={shop.id}>
      <span className="featured-shop-logo">{shop.logoUrl ? <Image src={getSafeImageSrc(shop.logoUrl)} alt="" width={72} height={72}/> : shop.name.charAt(0).toLocaleUpperCase("uz")}</span>
      <span className="featured-shop-copy"><b>{shop.name}</b>{shop.description && <small>{shop.description}</small>}<span className="featured-shop-meta"><span><Star size={14} fill="currentColor"/> {shop.rating.toLocaleString("uz-UZ", { maximumFractionDigits: 1 })}</span><span><Package size={14}/> {shop.productCount ?? 0} ta mahsulot</span></span></span>
      <ArrowRight aria-hidden size={19}/>
    </Link>)}</div>
  </section></Container>;
}

const sorts: { value: ProductSort; label: string }[] = [{ value: "createdAt:desc", label: "Yangi kelganlar" }, { value: "price:asc", label: "Arzondan qimmatga" }, { value: "price:desc", label: "Qimmatdan arzonga" }];

export function Products({ products, total, query, basePath, title, apiError }: { products: Product[]; total: number; query: ProductQuery; basePath: string; title?: string; apiError?: string }) {
  const heading = title ?? (query.search ? `“${query.search}” bo‘yicha natijalar` : "Sotuvdagi mahsulotlar");
  return <Container><section id="products" className="content-section"><div className="catalog-heading"><div><h2>{heading}</h2><p>{total} ta mahsulot</p></div><nav className="sort-control" aria-label="Mahsulotlarni saralash">{sorts.map((sort) => <Link key={sort.value} href={catalogHref(basePath, query, { sort: sort.value, page: 1 })} aria-current={query.sort === sort.value ? "page" : undefined}>{sort.label}</Link>)}</nav></div>{apiError && <div className="catalog-notice catalog-notice--error"><span>ALOQA YO‘Q</span><p>Mahsulotlarni yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.</p></div>}{products.length ? <ProductGrid key={products.map((product) => product.id).join(":")} products={products}/> : <div className="catalog-empty"><h3>{apiError ? "Mahsulotlar yuklanmadi" : "Mahsulot topilmadi"}</h3><p>{apiError ? "Backend qayta ishlaganda katalog shu yerda avtomatik ko‘rinadi." : "Bu kategoriya yoki filtr bo‘yicha hozircha mahsulot yo‘q."}</p>{(query.search || query.minPrice !== undefined || query.maxPrice !== undefined) && <Link className="button button--secondary" href={basePath}>Filtrlarni tozalash</Link>}</div>}</section></Container>;
}
