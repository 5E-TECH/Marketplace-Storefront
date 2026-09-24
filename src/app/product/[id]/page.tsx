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
import { absoluteUrl, baseOpenGraph, clipDescription, jsonLd, SITE_NAME } from "@/lib/seo";
import type { ProductReviewsResult } from "@/types/commerce";
import { errorMessage } from "@/lib/errors";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ reviewPage?: string }> };

const getProductPageData = cache(async (id: string) => {
  // Backend faqat raqamli ID qabul qiladi; boshqasiga 400 qaytarib xato sahifasini chiqarmasin.
  const product = /^\d+$/.test(id) ? await productService.getById(id) : null;
  if (!product) return { product: null, similar: [] };
  const catalog = product.shop?.id
    ? await productService.listByShop(product.shop.id, { page: 1, limit: 6 })
    : await productService.list({ categoryId: product.categoryInfo?.id, page: 1, limit: 6 });
  return { product, similar: catalog.data.filter((item) => String(item.id) !== String(product.id)).slice(0, 5) };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  const { product } = await getProductPageData(id);
  // Sahifa tanasida chaqirilgan notFound() oqim boshlangach ishlaydi va status 200 qoladi.
  if (!product) notFound();
  const seller = product.shop?.name ? `${product.shop.name} do‘konidan` : `${SITE_NAME}’da`;
  const socialDescription = clipDescription(`${product.name} — ${formatPrice(product.price)} so‘m. ${product.description ? `${product.description.replace(/[.\s]+$/, "")}. ` : ""}${seller} buyurtma bering, O‘zbekiston bo‘ylab yetkazib beramiz.`);
  const canonical = `/product/${encodeURIComponent(String(product.id))}`;
  const usesDefaultImage = product.image === "/placeholder-product.svg";
  const socialImage = usesDefaultImage ? "/og-default.png" : product.image;
  const openGraphImage = usesDefaultImage
    ? { url: socialImage, width: 1200, height: 630, alt: product.name }
    : { url: socialImage, alt: product.name };
  return { title: product.name, description: socialDescription, alternates: { canonical }, openGraph: { ...baseOpenGraph, title: product.name, description: socialDescription, url: canonical, images: [openGraphImage] }, twitter: { card: "summary_large_image", title: product.name, description: socialDescription, images: [socialImage] } };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const id = (await params).id;
  const rawReviewPage = Number((await searchParams).reviewPage);
  const reviewPage = Number.isSafeInteger(rawReviewPage) && rawReviewPage > 0 ? rawReviewPage : 1;
  // Sharhlar mahsulotga bog'liq emas — mahsulot va o'xshashlari bilan bir vaqtda so'raladi.
  const reviewsRequest = reviewService.list(id, reviewPage, 5).then((value) => ({ value, error: "" })).catch((error) => ({ value: null, error: errorMessage(error, "Sharhlarni yuklab bo‘lmadi") }));
  const { product, similar } = await getProductPageData(id);
  if (!product) notFound();
  const loaded = await reviewsRequest;
  const reviews: ProductReviewsResult = loaded.value ?? { items: [], rating: product.rating, total: product.reviews, page: reviewPage, limit: 5, totalPages: 0, error: loaded.error };
  const available = product.status !== "OUT_OF_STOCK" && (!product.variants?.length || product.variants.some((variant) => variant.stock === undefined || variant.stock > 0));
  const productUrl = absoluteUrl(`/product/${encodeURIComponent(String(product.id))}`);
  const hasPhoto = product.image !== "/placeholder-product.svg";
  const categoryHref = product.categoryInfo?.slug ? `/katalog/${encodeURIComponent(product.categoryInfo.slug)}` : "/katalog";
  // Do'kon — sotuvchi, brend emas; shuning uchun `brand` berilmaydi.
  const structuredData = [{
    "@context": "https://schema.org", "@type": "Product", name: product.name, url: productUrl,
    ...(product.description ? { description: product.description } : {}),
    ...(hasPhoto ? { image: (product.images.length ? product.images : [product.image]).map(absoluteUrl) } : {}),
    sku: product.variants?.[0]?.sku ?? String(product.id),
    category: product.categoryInfo?.name ?? product.category,
    ...(reviews.total > 0 && !reviews.error ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.rating, reviewCount: reviews.total } } : {}),
    ...(product.price > 0 ? { offers: { "@type": "Offer", url: productUrl, priceCurrency: "UZS", price: product.price, availability: `https://schema.org/${available ? "InStock" : "OutOfStock"}`, itemCondition: "https://schema.org/NewCondition", ...(product.shop?.name ? { seller: { "@type": "Organization", name: product.shop.name } } : {}) } } : {}),
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: absoluteUrl("/") },
      ...(product.categoryInfo?.slug ? [{ "@type": "ListItem", position: 2, name: product.categoryInfo.name, item: absoluteUrl(categoryHref) }] : []),
      { "@type": "ListItem", position: product.categoryInfo?.slug ? 3 : 2, name: product.name, item: productUrl },
    ],
  }];
  return <main><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}/><Container><div className="detail-navigation"><BackButton/><nav className="breadcrumbs" aria-label="Sahifa yo‘li"><Link href="/">Bosh sahifa</Link><span>/</span><Link href={categoryHref}>{product.categoryInfo?.name ?? product.category}</Link><span>/</span><b>{product.name}</b></nav></div><ProductDetail product={product} reviews={reviews}/>{similar.length > 0 && <section className="content-section detail-related"><SectionHeader title="Sizga yoqishi mumkin" href={product.shop?.slug ? `/dokon/${encodeURIComponent(product.shop.slug)}` : "/#products"} linkLabel={product.shop?.slug ? "Do‘kon mahsulotlari" : "Barcha mahsulotlar"}/><div className="products-grid products-grid--related">{similar.map((item) => <ProductCard product={item} key={item.id}/>)}</div></section>}</Container></main>;
}
