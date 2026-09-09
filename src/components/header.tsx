"use client";

import { ChevronDown, Grid2X2, Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { Container } from "./ui";
import type { CatalogCategory } from "@/types/commerce";

const promos = ["Arzon narxlar kafolati", "Maktab bozori", "Yozgi kolleksiya"];

export function Header({ categories }: { categories: CatalogCategory[] }) {
  const [open, setOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const cart = useCart();
  const favorites = useFavorites();
  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setCatalogOpen(false); setOpen(false); }
    };
    window.addEventListener("keydown", closeMenus);
    return () => window.removeEventListener("keydown", closeMenus);
  }, []);
  const submitSearch = (event: FormEvent) => { event.preventDefault(); router.push(search.trim() ? `/?search=${encodeURIComponent(search.trim())}#products` : "/#products"); };
  return <header className="header">
    <div className="announcement">Yetkazib berish 300 000 so‘mdan bepul <span>•</span> 30 kun ichida qaytarish</div>
    <Container className="nav-wrap">
      <button className="icon-button menu-button" aria-label="Menyuni ochish" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <Link className="logo" href="/" aria-label="Elchi Market bosh sahifa"><span>elchi</span><b>market</b></Link>
      <button className="catalog-button" type="button" onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu"><Grid2X2/>{catalogOpen ? "Yopish" : "Katalog"}</button>
      <nav className={open ? "nav nav--open" : "nav"}>{promos.map((item) => <Link href="/#products" onClick={() => setOpen(false)} key={item}>{item}</Link>)}</nav>
      <div className="header-actions">
        <form className="search" onSubmit={submitSearch}><Search size={18}/><input id="header-search" name="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Mahsulot qidirish" placeholder="Nima qidiryapsiz?" />{search && <button className="search-clear" type="button" onClick={() => setSearch("")} aria-label="Qidiruvni tozalash"><X/></button>}</form>
        <Link className="icon-button header-favorite" href="/favorites" aria-label={`Sevimlilar: ${favorites.count}`}><Heart fill={favorites.count ? "currentColor" : "none"}/>{favorites.count > 0 && <span>{favorites.count > 99 ? "99+" : favorites.count}</span>}</Link>
        <Link className="user-action" href="/profile" aria-label="Kirish yoki profil"><UserRound/><span>Kirish</span></Link>
        <button className="icon-button bag" onClick={() => cart.setOpen(true)} aria-label="Savatcha"><ShoppingBag />{cart.quantity > 0 && <span>{cart.quantity > 99 ? "99+" : cart.quantity}</span>}</button>
      </div>
    </Container>
    <div className="category-strip"><Container>{categories.slice(0, 6).map((category) => <Link href={`/katalog/${category.slug}`} onClick={() => setCatalogOpen(false)} key={category.id}><span>{category.icon}</span>{category.name}</Link>)}<button type="button" className={catalogOpen ? "active" : ""} onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu">Yana <ChevronDown/></button></Container></div>
    {catalogOpen && <><button className="catalog-backdrop" type="button" onClick={() => setCatalogOpen(false)} aria-label="Katalogni yopish"/><div className="catalog-mega" id="catalog-menu"><Container><div className="catalog-mega-head"><div><span>BARCHA TOIFALAR</span><h2>Mahsulotlar katalogi</h2></div><Link href="/katalog" onClick={() => setCatalogOpen(false)}>Barcha kategoriyalar →</Link></div><div className="catalog-mega-grid">{categories.map((category) => <section key={category.id}><Link className="catalog-category-title" href={`/katalog/${category.slug}`} onClick={() => setCatalogOpen(false)}><i>{category.icon}</i><b>{category.name}</b></Link>{category.children.map((child) => <Link href={`/katalog/${child.slug}`} onClick={() => setCatalogOpen(false)} key={child.id}>{child.name}</Link>)}</section>)}</div></Container></div></>}
  </header>;
}
