"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import type { CatalogCategory } from "@/types/commerce";
import { CategoryIcon } from "../category-icon";
import { Container } from "../ui";

/**
 * Katalog mega-menyusi. Backdrop sarlavhaning pastki chetiga ulanadi, shuning uchun
 * sarlavha balandligi o'zgarsa ham CSS'da qo'lda yozilgan piksel kerak bo'lmaydi.
 */
export function CatalogOverlay({ categories, open, onClose }: { categories: CatalogCategory[]; open: boolean; onClose: () => void }) {
  useScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  return <>
    <button className="catalog-backdrop" type="button" onClick={onClose} aria-label="Katalogni yopish"/>
    <div className="catalog-mega" id="catalog-menu">
      <Container>
        <div className="catalog-mega-head"><div><h2>Mahsulotlar katalogi</h2></div><Link href="/katalog" onClick={onClose}>Barcha kategoriyalar →</Link></div>
        <div className="catalog-mega-grid">{categories.map((category) => <section key={category.id}>
          <Link className="catalog-category-title" href={`/katalog/${category.slug}`} onClick={onClose}><i><CategoryIcon name={category.name} iconUrl={category.iconUrl}/></i><b>{category.name}</b></Link>
          {category.children.map((child) => <Link href={`/katalog/${child.slug}`} onClick={onClose} key={child.id}>{child.name}</Link>)}
        </section>)}</div>
      </Container>
    </div>
  </>;
}
