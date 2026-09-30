"use client";

import { Bell, ChevronDown, Grid2X2, Heart, MapPin, Menu, ShoppingCart, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useFavorites } from "@/providers/favorites-provider";
import { useCart } from "@/providers/cart-provider";
import { authService } from "@/services/auth.service";
import { NOTIFICATIONS_CHANGED, notificationService } from "@/services/notification.service";
import type { CatalogCategory } from "@/types/commerce";
import { CategoryIcon } from "../category-icon";
import { Container } from "../ui";
import { CatalogOverlay } from "./catalog-overlay";
import { HeaderSearch } from "./header-search";

const STRIP_LIMIT = 6;
const badge = (count: number) => count > 99 ? "99+" : String(count);

export function Header({ categories }: { categories: CatalogCategory[] }) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const favorites = useFavorites();
  const cart = useCart();
  // Backend javob bermasa savat bo'sh emas, noma'lum: xaridor mahsulotlari yo'qolgan deb o'ylamasin.
  const cartUnavailable = Boolean(cart.error) && !cart.items.length && !cart.loading;
  const closeCatalog = useCallback(() => setCatalogOpen(false), []);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const syncAuth = () => setAuthenticated(Boolean(authService.getSession()));
    syncAuth();
    window.addEventListener("elchi:auth-changed", syncAuth);
    return () => window.removeEventListener("elchi:auth-changed", syncAuth);
  }, []);
  // O'qilmagan bildirishnomalar: kirishda, oynaga qaytilganda, minutiga bir va o'qilgan qilinganda.
  useEffect(() => {
    if (!authenticated) { setUnread(0); return; }
    let active = true;
    const refresh = () => { notificationService.unreadCount().then((count) => { if (active) setUnread(count); }).catch(() => { /* Hisoblagich keyingi urinishda yangilanadi. */ }); };
    refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 60_000);
    window.addEventListener("focus", refresh);
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); window.removeEventListener(NOTIFICATIONS_CHANGED, refresh); };
  }, [authenticated]);

  return <header className="header">
    <div className="utility-bar"><Container>
      <span><MapPin/> O‘zbekiston bo‘ylab yetkazib beramiz</span>
      <nav aria-label="Tezkor havolalar"><Link href="/profile/orders">Buyurtmalarim</Link><Link href="/favorites">Saralanganlar</Link><Link href="/katalog">Barcha kategoriyalar</Link></nav>
    </Container></div>
    <Container className="nav-wrap">
      <button className="icon-button menu-button" type="button" aria-label={catalogOpen ? "Katalogni yopish" : "Katalogni ochish"} onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu">{catalogOpen ? <X/> : <Menu/>}</button>
      <Link className="logo" href="/" aria-label="Elchi Market bosh sahifa"><span>elchi</span><b>market</b></Link>
      <button className="catalog-button" type="button" onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu"><Grid2X2/>{catalogOpen ? "Yopish" : "Katalog"}</button>
      <div className="header-actions">
        <HeaderSearch/>
        <Link className="header-nav-action header-favorite" href="/favorites" aria-label={`Sevimlilar: ${favorites.count}`}><i><Heart fill={favorites.count ? "currentColor" : "none"}/>{favorites.count > 0 && <span>{badge(favorites.count)}</span>}</i><b>Sevimlilar</b></Link>
        {authenticated && <Link className="header-nav-action header-notifications" href="/profile/notifications" aria-label={unread ? `Bildirishnomalar: ${unread} ta o‘qilmagan` : "Bildirishnomalar"}><i><Bell/>{unread > 0 && <span>{badge(unread)}</span>}</i><b>Xabarlar</b></Link>}
        <Link className="user-action" href={authenticated ? "/profile" : "/login"} aria-label={authenticated ? "Profil" : "Kirish"}><UserRound/><span>{authenticated ? "Profil" : "Kirish"}</span></Link>
        <Link className="header-nav-action header-cart" href="/cart" aria-label={cartUnavailable ? "Savatchani yuklab bo‘lmadi" : cart.quantity ? `Savatcha: ${cart.quantity} ta mahsulot` : "Savatcha"} aria-busy={cart.loading || undefined}><i><ShoppingCart/>{cartUnavailable ? <span className="is-warning" aria-hidden>!</span> : cart.quantity > 0 && <span>{badge(cart.quantity)}</span>}</i><b>Savat</b></Link>
      </div>
    </Container>
    <div className="category-strip"><Container>
      {categories.slice(0, STRIP_LIMIT).map((category) => <Link href={`/katalog/${category.slug}`} onClick={closeCatalog} key={category.id}><CategoryIcon name={category.name} iconUrl={category.iconUrl}/>{category.name}</Link>)}
      <button type="button" className={catalogOpen ? "active" : ""} onClick={() => setCatalogOpen((value) => !value)} aria-expanded={catalogOpen} aria-controls="catalog-menu">Yana <ChevronDown/></button>
    </Container></div>
    <CatalogOverlay categories={categories} open={catalogOpen} onClose={closeCatalog}/>
  </header>;
}
