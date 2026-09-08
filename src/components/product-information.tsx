"use client";

import { CheckCircle2, ChevronRight, PackageCheck, RotateCcw, ShieldCheck, Star, Store, Truck } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/types/commerce";

type Tab = "description" | "specifications" | "delivery";

export function ProductInformation({ product }: { product: Product }) {
  const [tab, setTab] = useState<Tab>("description");
  const attributes = Object.entries(product.variants?.[0]?.attributes ?? {});
  const specifications = [
    ["Brend / do‘kon", product.shop?.name ?? "Elchi Select"],
    ["Kategoriya", product.categoryInfo?.name ?? product.category],
    ["Mahsulot holati", product.status === "ACTIVE" ? "Sotuvda" : product.status ?? "Yangi"],
    ["Ranglar soni", `${product.colors.length} ta`],
    ["Variantlar", `${product.variants?.length ?? 1} ta`],
    ["Kafolat", "12 oy"],
    ...attributes.map(([key, value]) => [key, String(value)]),
  ];
  return <section className="product-information">
    <div className="product-tabs" role="tablist" aria-label="Mahsulot ma’lumotlari">
      <button className={tab === "description" ? "active" : ""} onClick={() => setTab("description")}>Mahsulot tavsifi</button>
      <button className={tab === "specifications" ? "active" : ""} onClick={() => setTab("specifications")}>Xususiyatlar</button>
      <button className={tab === "delivery" ? "active" : ""} onClick={() => setTab("delivery")}>Yetkazish va qaytarish</button>
    </div>
    <div className="product-info-layout">
      <div className="product-info-body">
        {tab === "description" && <div className="description-content"><h2>{product.name} haqida</h2><p>{product.description}</p><p>Mahsulot kundalik foydalanish uchun tanlangan, sifat nazoratidan o‘tkazilgan va ehtiyotkorlik bilan qadoqlanadi. Buyurtma berishdan oldin mavjud rang hamda variantni tanlang.</p><h3>Asosiy afzalliklari</h3><ul><li><CheckCircle2/> Ishonchli material va sifatli yig‘ilish</li><li><CheckCircle2/> Kundalik foydalanishga qulay dizayn</li><li><CheckCircle2/> Rasmiy kafolat va qaytarish imkoniyati</li><li><CheckCircle2/> O‘zbekiston bo‘ylab tez yetkazib berish</li></ul></div>}
        {tab === "specifications" && <div className="specification-table"><h2>Mahsulot xususiyatlari</h2>{specifications.map(([name, value]) => <p key={name}><span>{name}</span><b>{value}</b></p>)}</div>}
        {tab === "delivery" && <div className="delivery-details"><h2>Yetkazib berish va xizmat</h2><div><span><Truck/></span><p><b>Tez yetkazib berish</b><small>Toshkent bo‘ylab odatda 1–2 kun, hududlarga 2–5 ish kuni.</small></p></div><div><span><PackageCheck/></span><p><b>Mahkam qadoqlash</b><small>Mahsulot tashish vaqtida shikastlanmasligi uchun himoyalangan holda yuboriladi.</small></p></div><div><span><RotateCcw/></span><p><b>30 kun ichida qaytarish</b><small>Mahsulot holati va komplektatsiyasi saqlangan bo‘lsa, qaytarish mumkin.</small></p></div><div><span><ShieldCheck/></span><p><b>Xavfsiz xarid</b><small>To‘lov va buyurtma ma’lumotlari himoyalangan.</small></p></div></div>}
      </div>
      <aside className="seller-card"><div className="seller-title"><span><Store/></span><div><small>SOTUVCHI</small><h3>{product.shop?.name ?? "Elchi Select"}</h3></div></div><p><Star fill="currentColor"/> <b>4.9</b><span> · 366 ta baho</span></p><div className="seller-metrics"><span><b>98%</b><small>Mamnun xaridorlar</small></span><span><b>1 kun</b><small>Jo‘natish vaqti</small></span></div><button>Do‘konga o‘tish <ChevronRight/></button></aside>
    </div>
  </section>;
}
