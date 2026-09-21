"use client";

import { ChevronDown, Grid2X2, Heart, MapPin, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/providers/favorites-provider";
import { useCart } from "@/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import { searchService, type SearchSuggestion } from "@/services/search.service";
import { authService } from "@/services/auth.service";
import { Container } from "./ui";
import type { CatalogCategory } from "@/types/commerce";
import { CategoryIcon } from "./category-icon";

export function Header({ categories }: { categories: CatalogCategory[] }) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();
  const favorites = useFavorites();
  const cart = useCart();
  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCatalogOpen(false);
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
      try { setSuggestions(await searchService.suggest(query, controller.signal)); setActiveSuggestion(-1); }
      catch { if (!controller.signal.aborted) setSuggestions([]); }
      finally { if (!controller.signal.aborted) setSuggestionsLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [search, searchFocused]);
  const suggestionsOpen = searchFocused && search.trim().length >= 2;
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setSearchFocused(false);
    const picked = suggestions[activeSuggestion];
    if (picked) { router.push(`/product/${picked.id}`); return; }
    const query = search.trim();
    router.push(query ? `/qidiruv?q=${encodeURIComponent(query)}` : "/qidiruv");
  };
  const onSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setSearchFocused(false); setActiveSuggestion(-1); return; }
    if (!suggestionsOpen || !suggestions.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      // -1 "hech biri tanlanmagan" holati: Enter oddiy qidiruvni yuboradi.
      const slots = suggestions.length + 1;
      setActiveSuggestion((current) => ((current + 1 + step + slots) % slots) - 1);
    }
  };
  return <header className="header">
    <div className="utility-bar"><Container><span><MapPin/> Yetkazish manzil bo‘yicha hisoblanadi</span><nav aria-label="Tezkor havolalar"><Link href="/profile/orders">Buyurtmalarim</Link><Link href="/favorites">Saralanganlar</Link><Link href="/katalog">Barcha kategoriyalar</Link></nav></Container></div>
    <Container className="nav-wrap">
      <button className="icon-button menu-button" aria-label={catalogOpen ? "Katalogni yopish" : "Katalogni ochish"} onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu">{catalogOpen ? <X /> : <Menu />}</button>
      <Link className="logo" href="/" aria-label="Elchi Market bosh sahifa"><span>elchi</span><b>market</b></Link>
      <button className="catalog-button" type="button" onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu"><Grid2X2/>{catalogOpen ? "Yopish" : "Katalog"}</button>
      <div className="header-actions">
        <form className="search" role="search" onSubmit={submitSearch}><Search size={18}/><input id="header-search" name="q" role="combobox" value={search} onChange={(event) => setSearch(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)} aria-label="Mahsulot qidirish" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="search-suggestions" aria-expanded={suggestionsOpen} aria-activedescendant={suggestions[activeSuggestion] ? `search-option-${suggestions[activeSuggestion].id}` : undefined} onKeyDown={onSearchKeyDown} autoComplete="off" placeholder="Nima qidiryapsiz?" />{search && <button className="search-clear" type="button" onClick={() => { setSearch(""); setSuggestions([]); }} aria-label="Qidiruvni tozalash"><X/></button>}{suggestionsOpen && <div className="search-suggestions" id="search-suggestions">{suggestionsLoading ? <p role="status">Qidirilmoqda...</p> : suggestions.length ? <div role="listbox" aria-label="Qidiruv takliflari">{suggestions.map((item, index) => <Link href={`/product/${item.id}`} id={`search-option-${item.id}`} role="option" aria-selected={index === activeSuggestion} className={index === activeSuggestion ? "is-active" : ""} onMouseEnter={() => setActiveSuggestion(index)} onClick={() => setSearchFocused(false)} key={item.id}><span><b>{item.name}</b>{item.shopName && <small>{item.shopName}</small>}</span><strong>{formatPrice(item.price)} so‘m</strong></Link>)}</div> : <p>Taklif topilmadi</p>}<Link className="search-all" href={`/qidiruv?q=${encodeURIComponent(search.trim())}`} onClick={() => setSearchFocused(false)}>Barcha natijalarni ko‘rish →</Link></div>}</form>
        <Link className="header-nav-action header-favorite" href="/favorites" aria-label={`Sevimlilar: ${favorites.count}`}><i><Heart fill={favorites.count ? "currentColor" : "none"}/>{favorites.count > 0 && <span>{favorites.count > 99 ? "99+" : favorites.count}</span>}</i><b>Sevimlilar</b></Link>
        <Link className="user-action" href={authenticated ? "/profile" : "/login"} aria-label={authenticated ? "Profil" : "Kirish"}><UserRound/><span>{authenticated ? "Profil" : "Kirish"}</span></Link>
        <Link className="header-nav-action header-cart" href="/cart" aria-label={cart.quantity ? `Savatcha: ${cart.quantity} ta mahsulot` : "Savatcha"} aria-busy={cart.loading || undefined}><i><ShoppingCart/>{cart.quantity > 0 && <span>{cart.quantity > 99 ? "99+" : cart.quantity}</span>}</i><b>Savat</b></Link>
      </div>
    </Container>
    <div className="category-strip"><Container>{categories.slice(0, 6).map((category) => <Link href={`/katalog/${category.slug}`} onClick={() => setCatalogOpen(false)} key={category.id}><CategoryIcon name={category.name} iconUrl={category.iconUrl}/>{category.name}</Link>)}<button type="button" className={catalogOpen ? "active" : ""} onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu">Yana <ChevronDown/></button></Container></div>
    {catalogOpen && <><button className="catalog-backdrop" type="button" onClick={() => setCatalogOpen(false)} aria-label="Katalogni yopish"/><div className="catalog-mega" id="catalog-menu"><Container><div className="catalog-mega-head"><div><span>BARCHA TOIFALAR</span><h2>Mahsulotlar katalogi</h2></div><Link href="/katalog" onClick={() => setCatalogOpen(false)}>Barcha kategoriyalar →</Link></div><div className="catalog-mega-grid">{categories.map((category) => <section key={category.id}><Link className="catalog-category-title" href={`/katalog/${category.slug}`} onClick={() => setCatalogOpen(false)}><i><CategoryIcon name={category.name} iconUrl={category.iconUrl}/></i><b>{category.name}</b></Link>{category.children.map((child) => <Link href={`/katalog/${child.slug}`} onClick={() => setCatalogOpen(false)} key={child.id}>{child.name}</Link>)}</section>)}</div></Container></div></>}
  </header>;
}
