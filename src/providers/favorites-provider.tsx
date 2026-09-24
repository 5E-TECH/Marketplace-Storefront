"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { favoritesService } from "@/services/favorites.service";
import { errorMessage } from "@/lib/errors";
import { useToast } from "./toast-provider";
import type { ID, Product } from "@/types/commerce";

type FavoritesContextValue = {
  products: Product[];
  count: number;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  has: (id: ID) => boolean;
  isPending: (id: ID) => boolean;
  toggle: (product: Product) => Promise<void>;
  refresh: () => Promise<void>;
};
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const productsRef = useRef(products);
  const pendingRef = useRef(new Set<string>());
  const mounted = useRef(true);
  const { show } = useToast();
  const commit = useCallback((next: Product[]) => { productsRef.current = next; setProducts(next); }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remote = await favoritesService.list();
      if (mounted.current) commit(remote);
    } catch (caught) {
      if (mounted.current) setError(errorMessage(caught, "Sevimlilarni yuklab bo‘lmadi"));
    } finally {
      if (mounted.current) { setLoading(false); setHydrated(true); }
    }
  }, [commit]);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    const load = () => { if (active) void refresh(); };
    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(load, { timeout: 1_000 });
      return () => { active = false; mounted.current = false; window.cancelIdleCallback(idleId); };
    }
    const timeoutId = setTimeout(load, 200);
    return () => { active = false; mounted.current = false; clearTimeout(timeoutId); };
  }, [refresh]);
  useEffect(() => {
    window.addEventListener("elchi:guest-merged", refresh);
    return () => window.removeEventListener("elchi:guest-merged", refresh);
  }, [refresh]);

  const has = useCallback((id: ID) => products.some((product) => String(product.id) === String(id)), [products]);
  const isPending = useCallback((id: ID) => pendingIds.has(String(id)), [pendingIds]);
  const toggle = useCallback(async (product: Product) => {
    const id = String(product.id);
    if (!hydrated || pendingRef.current.has(id)) return;
    const previous = productsRef.current;
    const existed = previous.some((item) => String(item.id) === id);
    commit(existed ? previous.filter((item) => String(item.id) !== id) : [product, ...previous]);
    pendingRef.current.add(id);
    setPendingIds(new Set(pendingRef.current));
    setError(null);
    try {
      if (existed) await favoritesService.remove(product.id);
      else await favoritesService.add(product.id);
    } catch (caught) {
      // Yurak tugmasi sahifada xato ko'rsatmaydi, shuning uchun xabar popup orqali beriladi.
      const message = errorMessage(caught, "Sevimlilar amalini bajarib bo‘lmadi");
      if (mounted.current) { commit(previous); setError(message); }
      show(message, "error");
    } finally {
      pendingRef.current.delete(id);
      if (mounted.current) setPendingIds(new Set(pendingRef.current));
    }
  }, [commit, hydrated, show]);
  const value = useMemo(() => ({ products, count: products.length, hydrated, loading, error, has, isPending, toggle, refresh }), [products, hydrated, loading, error, has, isPending, toggle, refresh]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites FavoritesProvider ichida ishlatilishi kerak");
  return context;
}
