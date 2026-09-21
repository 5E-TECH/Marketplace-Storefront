import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BackButton } from "@/components/back-button";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { Container, SectionHeader } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { productService } from "@/services/product.service";
import { reviewService } from "@/services/review.service";
import { absoluteUrl, jsonLd } from "@/lib/seo";
import type { ProductReviewsResult } from "@/types/commerce";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ reviewPage?: string }> };

const getProductPageData = cache(async (id: string) => {
  const product = await productService.getById(id);
  if (!product) return { product: null, similar: [] };
  const catalog = product.shop?.id
    ? await productService.listByShop(product.shop.id, { page: 1, limit: 6 })
    : await productService.list({ categoryId: product.categoryInfo?.id, page: 1, limit: 6 });
  return { product, similar: catalog.data.filter((item) => String(item.id) !== String(product.id)).slice(0, 5) };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  const { product } = await getProductPageData(id);
  if (!product) return { title: "Mahsulot topilmadi", description: "So‘ralgan mahsulot topilmadi." };
  const socialDescription = product.description ? `${formatPrice(product.price)} so‘m — ${product.description}` : `${product.name} — ${formatPrice(product.price)} so‘m`;
  const canonical = `/product/${encodeURIComponent(id)}`;
  const usesDefaultImage = product.image === "/placeholder-product.svg";
  const socialImage = usesDefaultImage ? "/og-default.png" : product.image;
  const openGraphImage = usesDefaultImage
    ? { url: socialImage, width: 1200, height: 630, alt: product.name }
    : { url: socialImage, alt: product.name };
  return { title: product.name, description: socialDescription, alternates: { canonical }, openGraph: { title: product.name, description: socialDescription, url: canonical, images: [openGraphImage], type: "website" }, twitter: { card: "summary_large_image", title: product.name, description: socialDescription, images: [socialImage] } };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const id = (await params).id;
  const rawReviewPage = Number((await searchParams).reviewPage);
  const reviewPage = Number.isSafeInteger(rawReviewPage) && rawReviewPage > 0 ? rawReviewPage : 1;
  const { product, similar } = await getProductPageData(id);
  if (!product) notFound();
  let reviews: ProductReviewsResult;
  try { reviews = await reviewService.list(id, reviewPage, 5); }
  catch (error) { reviews = { items: [], rating: product.rating, total: product.reviews, page: reviewPage, limit: 5, totalPages: 0, error: error instanceof Error ? error.message : "Sharhlarni yuklab bo‘lmadi" }; }
  const available = product.status !== "OUT_OF_STOCK" && (!product.variants?.length || product.variants.some((variant) => variant.stock === undefined || variant.stock > 0));
  const structuredData = { "@context": "https://schema.org", "@type": "Product", name: product.name, ...(product.description ? { description: product.description } : {}), image: product.images.length ? product.images.map(absoluteUrl) : [absoluteUrl(product.image)], sku: String(product.id), category: product.categoryInfo?.name ?? product.category, ...(product.shop?.name ? { brand: { "@type": "Brand", name: product.shop.name } } : {}), ...(reviews.total > 0 && !reviews.error ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.rating, reviewCount: reviews.total } } : {}), offers: { "@type": "Offer", url: absoluteUrl(`/product/${encodeURIComponent(id)}`), priceCurrency: "UZS", price: product.price, availability: `https://schema.org/${available ? "InStock" : "OutOfStock"}`, itemCondition: "https://schema.org/NewCondition", ...(product.shop?.name ? { seller: { "@type": "Organization", name: product.shop.name } } : {}) } };
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}/><Container><div className="detail-navigation"><BackButton/><nav className="breadcrumbs" aria-label="Sahifa yo‘li"><Link href="/">Bosh sahifa</Link><span>/</span><Link href="/#products">{product.category}</Link><span>/</span><b>{product.name}</b></nav></div><ProductDetail product={product} reviews={reviews}/>{similar.length > 0 && <section className="content-section detail-related"><SectionHeader title="Sizga yoqishi mumkin" href={product.shop?.slug ? `/dokon/${encodeURIComponent(product.shop.slug)}` : "/#products"} linkLabel={product.shop?.slug ? "Do‘kon mahsulotlari" : "Barcha mahsulotlar"}/><div className="products-grid products-grid--related">{similar.map((item) => <ProductCard product={item} key={item.id}/>)}</div></section>}</Container></main>;
}
