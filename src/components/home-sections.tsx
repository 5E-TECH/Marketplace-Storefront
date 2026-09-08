import { ArrowRight, Headphones, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/commerce";
import { ProductGrid } from "./product-grid";
import { Button, Container, SectionHeader } from "./ui";

export function Hero({ product }: { product?: Product }) {
  if (!product) return null;
  return <Container><section className="hero">
    <div className="hero-copy"><span className="hero-kicker">{product.shop?.name ?? product.category}</span><h1>{product.name}</h1><p>{product.description}</p>
      <div className="hero-buttons"><Link className="button button--primary" href={`/product/${product.id}`}>Hozir xarid qilish <ArrowRight size={18}/></Link><Link className="button button--secondary" href="#products">Katalogni ko‘rish</Link></div>
      <div className="hero-meta"><span>★ {product.rating} / 5 reyting</span><span>{product.reviews} ta sharh</span></div>
    </div>
    <div className="hero-visual"><Image src={product.image} alt={product.name} fill priority sizes="(max-width: 768px) 100vw, 52vw"/><div className="hero-product-label"><small>{product.shop?.name ?? "Marketplace"}</small><b>{formatPrice(product.price)} so‘m</b></div></div>
  </section></Container>;
}

export function CategoryGrid({ products }: { products: Product[] }) {
  const categories = [...new Map(products.filter((product) => product.categoryInfo).map((product) => [String(product.categoryInfo!.id), { ...product.categoryInfo!, image: product.image }])).values()].slice(0, 6);
  if (!categories.length) return null;
  return <Container><section className="category-grid" aria-label="Kategoriyalar">{categories.map((category) => <Link href={`/?categoryId=${category.id}#products`} className="category-card" key={category.id}><Image src={category.image} alt="" width={88} height={88}/><span><b>{category.name}</b><small>Mahsulotlarni ko‘rish</small></span><ArrowRight size={18}/></Link>)}</section></Container>;
}

export function Products({ products, search, apiError }: { products: Product[]; search?: string; apiError?: string }) { return <Container><section id="products" className="content-section"><SectionHeader title={search ? `“${search}” bo‘yicha natijalar` : "Trenddagi mahsulotlar"}/>{apiError && <div className="catalog-notice catalog-notice--error"><span>API OFFLINE</span><p>Real katalogni yuklab bo‘lmadi: {apiError}. Backend manzili va server ishlayotganini tekshiring.</p></div>}{products.length ? <ProductGrid products={products}/> : <div className="catalog-empty"><h3>{apiError ? "Real mahsulotlar yuklanmadi" : "Mahsulot topilmadi"}</h3><p>{apiError ? "Static mahsulot ko‘rsatilmaydi. Backend ishga tushganda katalog avtomatik chiqadi." : "Boshqa kalit so‘z bilan qidirib ko‘ring."}</p></div>}</section></Container>; }

const benefits = [{ icon: Truck, title: "Tez yetkazib berish", text: "O‘zbekiston bo‘ylab" }, { icon: ShieldCheck, title: "Xavfsiz to‘lov", text: "100% himoyalangan" }, { icon: RefreshCcw, title: "Oson qaytarish", text: "30 kun ichida" }, { icon: Headphones, title: "Doimiy yordam", text: "24/7 qo‘llab-quvvatlash" }];
export function Benefits() { return <Container><div className="benefits">{benefits.map(({ icon: Icon, title, text }) => <div className="benefit" key={title}><span><Icon/></span><div><b>{title}</b><small>{text}</small></div></div>)}</div></Container>; }

export function Inspiration({ products }: { products: Product[] }) {
  const items = products.slice(1, 5);
  if (!items.length) return null;
  return <Container><section className="content-section"><SectionHeader title="Siz uchun g‘oyalar" link="Katalogga o‘tish"/><div className="inspiration-grid">{items.map((product) => <Link href={`/product/${product.id}`} key={product.id} className="inspiration-card"><Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 80vw, 25vw"/><div><h3>{product.name}</h3><p>{product.shop?.name ?? product.category}</p></div><span><ArrowRight/></span></Link>)}</div></section></Container>;
}

export function Newsletter() { return <Container><section className="newsletter"><div><span>FAQAT A’ZOLAR UCHUN</span><h2>Yaxshi takliflar sizni topsin.</h2><p>Yangi mahsulotlar va yopiq chegirmalarni birinchi bo‘lib oling.</p></div><form><input id="newsletter-email" name="email" type="email" required aria-label="Email manzil" placeholder="Email manzilingiz"/><Button type="submit">Obuna bo‘lish</Button></form></section></Container>; }
