import { ArrowRight, Headphones, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { catalogHref } from "@/lib/catalog-query";
import { productPath } from "@/lib/product-url";
import type { CatalogCategory, Product, ProductQuery, ProductSort } from "@/types/commerce";
import { ProductGrid } from "./product-grid";
import { Button, Container, SectionHeader } from "./ui";

export function Hero({ product }: { product?: Product }) {
  if (!product) return null;
  return <Container><section className="hero">
    <div className="hero-copy"><span className="hero-kicker">{product.shop?.name ?? product.category}</span><h1>{product.name}</h1><p>{product.description}</p>
      <div className="hero-buttons"><Link className="button button--primary" href={productPath(product)}>Hozir xarid qilish <ArrowRight size={18}/></Link><Link className="button button--secondary" href="#products">Katalogni ko‘rish</Link></div>
      <div className="hero-meta"><span>★ {product.rating} / 5 reyting</span><span>{product.reviews} ta sharh</span></div>
    </div>
    <div className="hero-visual"><Image src={product.image} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 52vw"/><div className="hero-product-label"><small>{product.shop?.name ?? "Marketplace"}</small><b>{formatPrice(product.price)} so‘m</b></div></div>
  </section></Container>;
}

const categoryIds = (category: CatalogCategory): string[] => [String(category.id), ...category.children.flatMap(categoryIds)];

export function CategoryGrid({ categories, products }: { categories: CatalogCategory[]; products: Product[] }) {
  const cards = categories.slice(0, 6).map((category) => ({ category, product: products.find((product) => categoryIds(category).includes(String(product.categoryInfo?.id))) }));
  if (!categories.length) return null;
  return <Container><section className="category-grid" aria-label="Kategoriyalar">{cards.map(({ category, product }) => <Link href={`/katalog/${category.slug}`} className="category-card" key={category.id}>{product ? <Image src={product.image} alt="" width={88} height={88}/> : <i className="category-card-icon" aria-hidden>{category.icon}</i>}<span><b>{category.name}</b><small>Mahsulotlarni ko‘rish</small></span><ArrowRight size={18}/></Link>)}</section></Container>;
}

const sorts: { value: ProductSort; label: string }[] = [{ value: "createdAt:desc", label: "Yangi kelganlar" }, { value: "price:asc", label: "Arzondan qimmatga" }];

export function Products({ products, total, query, basePath, title, apiError }: { products: Product[]; total: number; query: ProductQuery; basePath: string; title?: string; apiError?: string }) {
  const heading = title ?? (query.search ? `“${query.search}” bo‘yicha natijalar` : "Sotuvdagi mahsulotlar");
  return <Container><section id="products" className="content-section"><div className="catalog-heading"><div><h2>{heading}</h2><p>{total} ta mahsulot</p></div><nav className="sort-control" aria-label="Mahsulotlarni saralash">{sorts.map((sort) => <Link key={sort.value} href={catalogHref(basePath, query, { sort: sort.value, page: 1 })} aria-current={query.sort === sort.value ? "page" : undefined}>{sort.label}</Link>)}</nav></div>{apiError && <div className="catalog-notice catalog-notice--error"><span>ALOQA YO‘Q</span><p>Mahsulotlarni yuklab bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.</p></div>}{products.length ? <ProductGrid products={products}/> : <div className="catalog-empty"><h3>{apiError ? "Mahsulotlar yuklanmadi" : "Mahsulot topilmadi"}</h3><p>{apiError ? "Backend qayta ishlaganda katalog shu yerda avtomatik ko‘rinadi." : "Bu kategoriya yoki filtr bo‘yicha hozircha mahsulot yo‘q."}</p>{(query.search || query.minPrice !== undefined || query.maxPrice !== undefined) && <Link className="button button--secondary" href={basePath}>Filtrlarni tozalash</Link>}</div>}</section></Container>;
}

const benefits = [{ icon: Truck, title: "Tez yetkazib berish", text: "O‘zbekiston bo‘ylab" }, { icon: ShieldCheck, title: "Xavfsiz to‘lov", text: "100% himoyalangan" }, { icon: RefreshCcw, title: "Oson qaytarish", text: "30 kun ichida" }, { icon: Headphones, title: "Doimiy yordam", text: "24/7 qo‘llab-quvvatlash" }];
export function Benefits() { return <Container><div className="benefits">{benefits.map(({ icon: Icon, title, text }) => <div className="benefit" key={title}><span><Icon/></span><div><b>{title}</b><small>{text}</small></div></div>)}</div></Container>; }

export function Inspiration({ products }: { products: Product[] }) {
  const items = products.slice(1, 5);
  if (!items.length) return null;
  return <Container><section className="content-section"><SectionHeader title="Siz uchun g‘oyalar" link="Katalogga o‘tish"/><div className="inspiration-grid">{items.map((product) => <Link href={productPath(product)} key={product.id} className="inspiration-card"><Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 80vw, 25vw"/><div><h3>{product.name}</h3><p>{product.shop?.name ?? product.category}</p></div><span><ArrowRight/></span></Link>)}</div></section></Container>;
}

export function Newsletter() { return <Container><section className="newsletter"><div><span>FAQAT A’ZOLAR UCHUN</span><h2>Yaxshi takliflar sizni topsin.</h2><p>Yangi mahsulotlar va yopiq chegirmalarni birinchi bo‘lib oling.</p></div><form><input id="newsletter-email" name="email" type="email" required aria-label="Email manzil" placeholder="Email manzilingiz"/><Button type="submit">Obuna bo‘lish</Button></form></section></Container>; }
