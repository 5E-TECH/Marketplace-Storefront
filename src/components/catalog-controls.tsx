import Link from "next/link";
import { Fragment } from "react";
import type { ProductQuery } from "@/types/commerce";

type Crumb = { label: string; href?: string };

/** Katalog sahifalari yo'li: oxirgi element joriy sahifa, havolasiz. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return <nav className="catalog-breadcrumbs" aria-label="Sahifa yo‘li">
    {items.map((item, index) => <Fragment key={item.label}>
      {index > 0 && <span aria-hidden>/</span>}
      {item.href ? <Link href={item.href}>{item.label}</Link> : <b aria-current="page">{item.label}</b>}
    </Fragment>)}
  </nav>;
}

/**
 * Narx oralig'i filtri — oddiy GET forma, JS'siz ham ishlaydi.
 * `hidden` joriy saralash va qidiruv so'zini saqlab qoladi.
 */
export function PriceFilterForm({ action, query, hidden = {}, submitLabel, resetHref }: { action: string; query: ProductQuery; hidden?: Record<string, string | undefined>; submitLabel: string; resetHref: string }) {
  const filtered = query.minPrice !== undefined || query.maxPrice !== undefined;
  return <form className="search-filters catalog-price-filters" action={action}>
    {Object.entries({ ...hidden, sort: query.sort }).map(([name, value]) => value ? <input type="hidden" name={name} value={value} key={name}/> : null)}
    <label><span>Narxi, dan</span><input name="minPrice" type="number" inputMode="numeric" min="0" step="1000" defaultValue={query.minPrice} placeholder="0"/></label>
    <label><span>Narxi, gacha</span><input name="maxPrice" type="number" inputMode="numeric" min="0" step="1000" defaultValue={query.maxPrice} placeholder="Masalan, 500 000"/></label>
    <button className="button button--primary" type="submit">{submitLabel}</button>
    {filtered && <Link className="button button--secondary" href={resetHref}>Tozalash</Link>}
  </form>;
}
