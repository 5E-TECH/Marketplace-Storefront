"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useFavorites } from "@/providers/favorites-provider";
import { ProductCard } from "./product-card";

export function FavoritesContent() {
  const { products, hydrated, loading, error, refresh } = useFavorites();
  if (!hydrated) return <div className="favorites-loading" aria-label="Yuklanmoqda">{Array.from({ length: 4 }, (_, index) => <i key={index}/>)}</div>;
  if (error && !products.length) return <section className="favorites-empty"><span><Heart/></span><h1>Sevimlilarni yuklab bo‘lmadi</h1><p>{error}</p><button className="button button--primary" disabled={loading} onClick={() => void refresh()}>Qayta urinish</button></section>;
  if (!products.length) return <section className="favorites-empty"><span><Heart/></span><h1>Sevimlilar hali bo‘sh</h1><p>Yoqtirgan mahsulotlaringizdagi yurak belgisini bosing — ular shu yerda saqlanadi.</p><Link className="button button--primary" href="/#products">Mahsulotlarni ko‘rish</Link></section>;
  return <section className="favorites-page"><div className="favorites-title"><div><span>SAQLANGANLAR</span><h1>Sevimli mahsulotlar</h1></div><b>{products.length} ta mahsulot</b></div><div className="products-grid favorites-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div></section>;
}
