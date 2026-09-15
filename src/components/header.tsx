"use client";

import { ChevronDown, Grid2X2, Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/providers/cart-provider";
import { useFavorites } from "@/providers/favorites-provider";
import { formatPrice } from "@/lib/format";
import { searchService, type SearchSuggestion } from "@/services/search.service";
import { authService } from "@/services/auth.service";
import { Container } from "./ui";
import type { CatalogCategory } from "@/types/commerce";

const promos = ["Arzon narxlar kafolati", "Maktab bozori", "Yozgi kolleksiya"];

export function Header({ categories }: { categories: CatalogCategory[] }) {
  const [open, setOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
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
  useEffect(() => {
    const syncAuth = () => setAuthenticated(Boolean(authService.getSession()));
    syncAuth();
    window.addEventListener("elchi:auth-changed", syncAuth);
    return () => window.removeEventListener("elchi:auth-changed", syncAuth);
  }, []);
  useEffect(() => {
    const syncSearch = () => setSearch(new URLSearchParams(window.location.search).get("q") ?? "");
    syncSearch();
    window.addEventListener("popstate", syncSearch);
    return () => window.removeEventListener("popstate", syncSearch);
  }, []);
  useEffect(() => {
    const query = search.trim();
    if (!searchFocused || query.length < 2) { setSuggestions([]); setSuggestionsLoading(false); return; }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try { setSuggestions(await searchService.suggest(query, controller.signal)); }
      catch { if (!controller.signal.aborted) setSuggestions([]); }
      finally { if (!controller.signal.aborted) setSuggestionsLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [search, searchFocused]);
  const submitSearch = (event: FormEvent) => { event.preventDefault(); const query = search.trim(); setSearchFocused(false); router.push(query ? `/qidiruv?q=${encodeURIComponent(query)}` : "/qidiruv"); };
  return <header className="header">
    <div className="announcement">Yetkazib berish 300 000 so‘mdan bepul <span>•</span> 30 kun ichida qaytarish</div>
    <Container className="nav-wrap">
      <button className="icon-button menu-button" aria-label="Menyuni ochish" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <Link className="logo" href="/" aria-label="Elchi Market bosh sahifa"><span>elchi</span><b>market</b></Link>
      <button className="catalog-button" type="button" onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu"><Grid2X2/>{catalogOpen ? "Yopish" : "Katalog"}</button>
      <nav className={open ? "nav nav--open" : "nav"}>{promos.map((item) => <Link href="/#products" onClick={() => setOpen(false)} key={item}>{item}</Link>)}</nav>
      <div className="header-actions">
        <form className="search" role="search" onSubmit={submitSearch}><Search size={18}/><input id="header-search" name="q" role="combobox" value={search} onChange={(event) => setSearch(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)} aria-label="Mahsulot qidirish" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="search-suggestions" aria-expanded={searchFocused && search.trim().length >= 2} autoComplete="off" placeholder="Nima qidiryapsiz?" />{search && <button className="search-clear" type="button" onClick={() => { setSearch(""); setSuggestions([]); }} aria-label="Qidiruvni tozalash"><X/></button>}{searchFocused && search.trim().length >= 2 && <div className="search-suggestions" id="search-suggestions" role="listbox">{suggestionsLoading ? <p>Qidirilmoqda...</p> : suggestions.length ? suggestions.map((item) => <Link href={`/product/${item.id}`} role="option" onClick={() => setSearchFocused(false)} key={item.id}><span><b>{item.name}</b>{item.shopName && <small>{item.shopName}</small>}</span><strong>{formatPrice(item.price)} so‘m</strong></Link>) : <p>Taklif topilmadi</p>}<Link className="search-all" href={`/qidiruv?q=${encodeURIComponent(search.trim())}`} onClick={() => setSearchFocused(false)}>Barcha natijalarni ko‘rish →</Link></div>}</form>
        <Link className="icon-button header-favorite" href="/favorites" aria-label={`Sevimlilar: ${favorites.count}`}><Heart fill={favorites.count ? "currentColor" : "none"}/>{favorites.count > 0 && <span>{favorites.count > 99 ? "99+" : favorites.count}</span>}</Link>
        <Link className="user-action" href={authenticated ? "/profile" : "/login"} aria-label={authenticated ? "Profil" : "Kirish"}><UserRound/><span>{authenticated ? "Profil" : "Kirish"}</span></Link>
        <Link className="icon-button bag" href="/cart" aria-label={`Savatcha: ${cart.quantity} ta mahsulot`}><ShoppingBag />{cart.quantity > 0 && <span>{cart.quantity > 99 ? "99+" : cart.quantity}</span>}</Link>
      </div>
    </Container>
    <div className="category-strip"><Container>{categories.slice(0, 6).map((category) => <Link href={`/katalog/${category.slug}`} onClick={() => setCatalogOpen(false)} key={category.id}><span>{category.icon}</span>{category.name}</Link>)}<button type="button" className={catalogOpen ? "active" : ""} onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu">Yana <ChevronDown/></button></Container></div>
    {catalogOpen && <><button className="catalog-backdrop" type="button" onClick={() => setCatalogOpen(false)} aria-label="Katalogni yopish"/><div className="catalog-mega" id="catalog-menu"><Container><div className="catalog-mega-head"><div><span>BARCHA TOIFALAR</span><h2>Mahsulotlar katalogi</h2></div><Link href="/katalog" onClick={() => setCatalogOpen(false)}>Barcha kategoriyalar →</Link></div><div className="catalog-mega-grid">{categories.map((category) => <section key={category.id}><Link className="catalog-category-title" href={`/katalog/${category.slug}`} onClick={() => setCatalogOpen(false)}><i>{category.icon}</i><b>{category.name}</b></Link>{category.children.map((child) => <Link href={`/katalog/${child.slug}`} onClick={() => setCatalogOpen(false)} key={child.id}>{child.name}</Link>)}</section>)}</div></Container></div></>}
  </header>;
}
