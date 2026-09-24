"use client";

import { ChevronRight, CreditCard, PackageCheck, Store, Truck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types/commerce";

type Tab = "description" | "specifications" | "delivery";

const statusLabel = (status?: string) => {
  if (!status) return undefined;
  const labels: Record<string, string> = { ACTIVE: "Sotuvda", INACTIVE: "Sotuvda emas", OUT_OF_STOCK: "Sotuvda yo‘q", DRAFT: "Tayyorlanmoqda" };
  return labels[status.toUpperCase()] ?? status;
};

export function ProductInformation({ product }: { product: Product }) {
  const [tab, setTab] = useState<Tab>("description");
  const specifications = useMemo(() => {
    const rows: [string, string][] = [];
    if (product.shop?.name) rows.push(["Do‘kon", product.shop.name]);
    if (product.categoryInfo?.name || product.category) rows.push(["Kategoriya", product.categoryInfo?.name ?? product.category]);
    const status = statusLabel(product.status);
    if (status) rows.push(["Mahsulot holati", status]);
    if (product.variants?.length) rows.push(["Variantlar", `${product.variants.length} ta`]);
    if (product.colors.length) rows.push(["Ranglar", product.colors.join(", ")]);
    const seen = new Set(rows.map(([name]) => name.toLocaleLowerCase("uz")));
    for (const variant of product.variants ?? []) {
      for (const [key, value] of Object.entries(variant.attributes)) {
        const name = key.trim();
        if (!name || seen.has(name.toLocaleLowerCase("uz"))) continue;
        rows.push([name, String(value)]);
        seen.add(name.toLocaleLowerCase("uz"));
      }
    }
    return rows;
  }, [product]);

  return <section className="product-information">
    <div className="product-tabs" role="tablist" aria-label="Mahsulot ma’lumotlari">
      <button role="tab" aria-selected={tab === "description"} className={tab === "description" ? "active" : ""} onClick={() => setTab("description")}>Mahsulot tavsifi</button>
      <button role="tab" aria-selected={tab === "specifications"} className={tab === "specifications" ? "active" : ""} onClick={() => setTab("specifications")}>Xususiyatlar</button>
      <button role="tab" aria-selected={tab === "delivery"} className={tab === "delivery" ? "active" : ""} onClick={() => setTab("delivery")}>Yetkazish va to‘lov</button>
    </div>
    <div className="product-info-layout">
      <div className="product-info-body">
        {/* Uchala bo'lim ham HTML'da bor — qidiruv tizimi ko'radi, foydalanuvchi faqat tanlanganini. */}
        <div className="description-content" role="tabpanel" hidden={tab !== "description"}><h2>{product.name} haqida</h2><p>{product.description || "Sotuvchi bu mahsulot uchun tavsif kiritmagan."}</p></div>
        <div className="specification-table" role="tabpanel" hidden={tab !== "specifications"}><h2>Mahsulot xususiyatlari</h2>{specifications.length ? specifications.map(([name, value]) => <p key={name}><span>{name}</span><b>{value}</b></p>) : <p className="product-info-empty">Sotuvchi qo‘shimcha xususiyatlarni kiritmagan.</p>}</div>
        <div className="delivery-details" role="tabpanel" hidden={tab !== "delivery"}><h2>Yetkazib berish va to‘lov</h2><div><span><Truck/></span><p><b>Yetkazish narxi manzilga bog‘liq</b><small>Buyurtma berayotganda viloyat va tumanni tanlaysiz — narx va taxminiy muddat shu zahoti chiqadi.</small></p></div><div><span><CreditCard/></span><p><b>To‘lov qabul qilganda</b><small>Mahsulotni ko‘rib, keyin naqd yoki kuryerning terminali orqali to‘laysiz.</small></p></div><div><span><PackageCheck/></span><p><b>Buyurtmani kuzatish</b><small>Posilka qaysi bosqichdaligini “Buyurtmalarim” bo‘limida ko‘rib borasiz.</small></p></div></div>
      </div>
      {product.shop && <aside className="seller-card"><div className="seller-title"><span><Store/></span><div><small>Sotuvchi</small><h3>{product.shop.name}</h3></div></div>{product.shop.slug && <Link href={`/dokon/${encodeURIComponent(product.shop.slug)}`}>Do‘kon mahsulotlari <ChevronRight/></Link>}</aside>}
    </div>
  </section>;
}
