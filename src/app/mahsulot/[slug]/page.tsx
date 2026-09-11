import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BackButton } from "@/components/back-button";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { Container, SectionHeader } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { productIdFromRoute, productPath } from "@/lib/product-url";
import { productService } from "@/services/product.service";
import type { Product } from "@/types/commerce";

type Props = { params: Promise<{ slug: string }> };

const getProductPageData = cache(async (slug: string) => {
  const productId = productIdFromRoute(slug);
  const product = productId ? await productService.getById(productId) : await productService.getBySlug(slug);
  if (!product) return { product: null, similar: [] };
  const catalog = product.shop?.id
    ? await productService.listByShop(product.shop.id, { page: 1, limit: 6 })
    : await productService.list({ categoryId: product.categoryInfo?.id, page: 1, limit: 6 });
  return { product, similar: catalog.data.filter((item) => String(item.id) !== String(product.id)).slice(0, 5) };
});

const absoluteUrl = (path: string) => {
  try { return new URL(path, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001").toString(); }
  catch { return new URL(path, "http://localhost:3001").toString(); }
};

const isAvailable = (product: Product) => {
  if (["OUT_OF_STOCK", "ARCHIVED", "DRAFT"].includes(product.status ?? "ACTIVE")) return false;
  return !product.variants?.length || product.variants.some((variant) => variant.isActive !== false && variant.stock !== 0);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await getProductPageData((await params).slug);
  if (!product) return { title: "Mahsulot topilmadi", robots: { index: false, follow: false } };
  const path = productPath(product);
  const description = `${formatPrice(product.price)} so‘m — ${product.description}`.slice(0, 200);
  return {
    title: product.name,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title: product.name, description, images: [{ url: product.image, alt: product.name }] },
    twitter: { card: "summary_large_image", title: product.name, description, images: [product.image] },
    other: { "product:price:amount": String(product.price), "product:price:currency": "UZS" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { product, similar } = await getProductPageData((await params).slug);
  if (!product) notFound();
  const path = productPath(product);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map(absoluteUrl),
    sku: product.variants?.[0]?.sku ?? String(product.id),
    category: product.categoryInfo?.name ?? product.category,
    url: absoluteUrl(path),
    brand: { "@type": "Brand", name: product.shop?.name ?? "Elchi Market" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(path),
      priceCurrency: "UZS",
      price: product.price,
      availability: isAvailable(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: product.shop?.name ?? "Elchi Market" },
    },
  };
  const categoryHref = product.categoryInfo?.slug ? `/katalog/${product.categoryInfo.slug}` : "/katalog";
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}/>
    <Container><div className="detail-navigation"><BackButton/><nav className="breadcrumbs" aria-label="Sahifa yo‘li"><Link href="/">Bosh sahifa</Link><span>/</span><Link href={categoryHref}>{product.category}</Link><span>/</span><b>{product.name}</b></nav></div><ProductDetail product={product}/><section className="content-section detail-related"><SectionHeader title="Sizga yoqishi mumkin"/><div className="products-grid products-grid--related">{similar.map((item) => <ProductCard product={item} key={item.id}/>)}</div></section></Container>
  </main>;
}
