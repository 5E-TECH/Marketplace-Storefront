"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/types/commerce";
import { ProductCard } from "./product-card";

const PAGE_SIZE = 10;

export function ProductGrid({ products }: { products: Product[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => { setVisible(PAGE_SIZE); }, [products]);
  const remaining = Math.max(0, products.length - visible);
  return <><div className="products-grid">{products.slice(0, visible).map((product) => <ProductCard key={product.id} product={product}/>)}</div>{remaining > 0 && <div className="load-more-wrap"><button onClick={() => setVisible((count) => Math.min(count + PAGE_SIZE, products.length))}>Yana ko‘rsatish <span>{Math.min(PAGE_SIZE, remaining)} ta</span><ChevronDown/></button><small>{visible} / {products.length} ta mahsulot ko‘rsatildi</small></div>}</>;
}
