import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BackButton } from "@/components/back-button";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { Container, SectionHeader } from "@/components/ui";
import { productService } from "@/services/product.service";

type Props = { params: Promise<{ id: string }> };

const getProductPageData = cache(async (id: string) => {
  const product = await productService.getById(id);
  if (!product) return { product: null, similar: [] };
  const catalog = product.shop?.id
    ? await productService.listByShop(product.shop.id, { page: 1, limit: 6 })
    : await productService.list({ categoryId: product.categoryInfo?.id, page: 1, limit: 6 });
  return { product, similar: catalog.data.filter((item) => String(item.id) !== String(product.id)).slice(0, 5) };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await getProductPageData((await params).id);
  return product ? { title: product.name, description: product.description, openGraph: { images: [product.image] } } : {};
}

export default async function ProductPage({ params }: Props) {
  const id = (await params).id;
  const { product, similar } = await getProductPageData(id);
  if (!product) notFound();
  return <main><Container><div className="detail-navigation"><BackButton/><nav className="breadcrumbs" aria-label="Sahifa yo‘li"><Link href="/">Bosh sahifa</Link><span>/</span><Link href="/#products">{product.category}</Link><span>/</span><b>{product.name}</b></nav></div><ProductDetail product={product}/><section className="content-section detail-related"><SectionHeader title="Sizga yoqishi mumkin"/><div className="products-grid products-grid--related">{similar.map((item) => <ProductCard product={item} key={item.id}/>)}</div></section></Container></main>;
}
