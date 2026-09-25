"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { formatPrice } from "@/lib/format";
import { searchService, type SearchSuggestion } from "@/services/search.service";

const SUGGEST_DELAY_MS = 250;
const MIN_QUERY = 2;

/**
 * Qidiruv so'zi serverda ham maydonga qo'yiladi: qidiruv sahifasi ochilganda maydon bo'sh turib qolmaydi.
 * Statik sahifalarda `useSearchParams` Suspense talab qiladi — u yerda bo'sh maydon zaxira sifatida chiqadi.
 */
export function HeaderSearch() {
  return <Suspense fallback={<SearchField initialQuery=""/>}><SearchFieldFromUrl/></Suspense>;
}

function SearchFieldFromUrl() {
  const q = useSearchParams().get("q") ?? "";
  // key: manzildagi so'z o'zgarsa (orqaga/oldinga, yangi qidiruv) maydon shu qiymatdan qayta boshlanadi.
  return <SearchField initialQuery={q} key={q}/>;
}

/** Sarlavhadagi qidiruv: takliflar, klaviatura bilan tanlash va yuborish shu komponentda. */
function SearchField({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const text = query.trim();
    if (!focused || text.length < MIN_QUERY) { setSuggestions([]); setLoading(false); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try { setSuggestions(await searchService.suggest(text, controller.signal)); setActive(-1); }
      catch { if (!controller.signal.aborted) setSuggestions([]); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, SUGGEST_DELAY_MS);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, focused]);

  const open = focused && query.trim().length >= MIN_QUERY;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFocused(false);
    const picked = suggestions[active];
    if (picked) { router.push(`/product/${picked.id}`); return; }
    const text = query.trim();
    router.push(text ? `/qidiruv?q=${encodeURIComponent(text)}` : "/qidiruv");
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setFocused(false); setActive(-1); return; }
    if (!open || !suggestions.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      // -1 "hech biri tanlanmagan" holati: Enter oddiy qidiruvni yuboradi.
      const slots = suggestions.length + 1;
      setActive((current) => ((current + 1 + step + slots) % slots) - 1);
    }
  };

  return <form className="search" role="search" onSubmit={submit}>
    <Search size={18}/>
    <input id="header-search" name="q" role="combobox" value={query} onChange={(event) => setQuery(event.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => window.setTimeout(() => setFocused(false), 150)}
      aria-label="Mahsulot qidirish" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="search-suggestions" aria-expanded={open}
      aria-activedescendant={suggestions[active] ? `search-option-${suggestions[active].id}` : undefined}
      onKeyDown={onKeyDown} autoComplete="off" placeholder="Nima qidiryapsiz?"/>
    {query && <button className="search-clear" type="button" onClick={() => { setQuery(""); setSuggestions([]); }} aria-label="Qidiruvni tozalash"><X/></button>}
    {open && <div className="search-suggestions" id="search-suggestions">
      {loading ? <p role="status">Qidirilmoqda...</p> : suggestions.length ? <div role="listbox" aria-label="Qidiruv takliflari">
        {suggestions.map((item, index) => <Link href={`/product/${item.id}`} id={`search-option-${item.id}`} role="option" aria-selected={index === active}
          className={index === active ? "is-active" : ""} onMouseEnter={() => setActive(index)} onClick={() => setFocused(false)} key={item.id}>
          <span><b>{item.name}</b>{item.shopName && <small>{item.shopName}</small>}</span><strong>{formatPrice(item.price)} so‘m</strong>
        </Link>)}
      </div> : <p>Taklif topilmadi</p>}
      <Link className="search-all" href={`/qidiruv?q=${encodeURIComponent(query.trim())}`} onClick={() => setFocused(false)}>Barcha natijalarni ko‘rish →</Link>
    </div>}
  </form>;
}
