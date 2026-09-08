"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { favoritesService } from "@/services/favorites.service";
import type { ID, Product } from "@/types/commerce";

type FavoritesContextValue = { products: Product[]; count: number; hydrated: boolean; loading: boolean; error: string | null; has: (id: ID) => boolean; toggle: (product: Product) => Promise<void>; refresh: () => Promise<void> };
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try { setProducts(await favoritesService.list()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Sevimlilarni yuklab bo‘lmadi"); }
    finally { setLoading(false); setHydrated(true); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    window.addEventListener("elchi:guest-merged", refresh);
    return () => window.removeEventListener("elchi:guest-merged", refresh);
  }, [refresh]);
  const has = useCallback((id: ID) => products.some((product) => String(product.id) === String(id)), [products]);
  const toggle = useCallback(async (product: Product) => {
    if (loading) return;
    const existed = products.some((item) => String(item.id) === String(product.id));
    const previous = products;
    setProducts(existed ? products.filter((item) => String(item.id) !== String(product.id)) : [product, ...products]);
    setLoading(true); setError(null);
    try { if (existed) await favoritesService.remove(product.id); else await favoritesService.add(product.id); }
    catch (caught) { setProducts(previous); setError(caught instanceof Error ? caught.message : "Sevimlilar amalini bajarib bo‘lmadi"); }
    finally { setLoading(false); }
  }, [loading, products]);
  const value = useMemo(() => ({ products, count: products.length, hydrated, loading, error, has, toggle, refresh }), [products, hydrated, loading, error, has, toggle, refresh]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites FavoritesProvider ichida ishlatilishi kerak");
  return context;
}
