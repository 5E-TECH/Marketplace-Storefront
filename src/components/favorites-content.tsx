"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useFavorites } from "@/providers/favorites-provider";
import { ProductCard } from "./product-card";
import { Button, LoadingGrid, StatePanel } from "./ui";

export function FavoritesContent() {
  const { products, hydrated, loading, error, refresh } = useFavorites();
  if (!hydrated) return <LoadingGrid label="Sevimlilar yuklanmoqda"/>;
  if (error && !products.length) return <StatePanel kind="error" icon={<Heart/>} title="Sevimlilarni yuklab bo‘lmadi" description={error} action={<Button loading={loading} onClick={() => void refresh()}>Qayta urinish</Button>}/>;
  if (!products.length) return <StatePanel icon={<Heart/>} title="Sevimlilar hali bo‘sh" description="Yoqtirgan mahsulotlaringizdagi yurak belgisini bosing — ular shu yerda saqlanadi." action={<Link className="button button--primary" href="/#products">Mahsulotlarni ko‘rish</Link>}/>;
  return <section className="favorites-page"><div className="favorites-title"><div><h1>Sevimli mahsulotlar</h1></div><b>{products.length} ta mahsulot</b></div><div className="products-grid favorites-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div></section>;
}
