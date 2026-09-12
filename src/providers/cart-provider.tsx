"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartService, cartTotals } from "@/services/cart.service";
import type { AddCartInput, Cart, CartItem } from "@/types/commerce";

type CartContextValue = Cart & { loading: boolean; error: string | null; quantity: number; subtotal: number; add: (input: AddCartInput) => Promise<boolean>; update: (id: string, quantity: number) => Promise<void>; remove: (id: string) => Promise<void>; clear: () => Promise<void>; refresh: () => Promise<void> };
const CartContext = createContext<CartContextValue | null>(null);
type CartActionsContextValue = { items: CartItem[]; loading: boolean; add: (input: AddCartInput) => Promise<boolean>; update: (id: string, quantity: number) => Promise<void>; remove: (id: string) => Promise<void> };
const CartActionsContext = createContext<CartActionsContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pending = useRef(0);
  const run = useCallback((action: () => Promise<Cart>): Promise<boolean> => {
    pending.current += 1;
    setLoading(true);
    const task = queue.current.then(async () => {
      setError(null);
      try { setCart(await action()); return true; }
      catch (caught) { setError(caught instanceof Error ? caught.message : "Savatcha amalini bajarib bo‘lmadi"); return false; }
      finally { pending.current -= 1; setLoading(pending.current > 0); }
    });
    queue.current = task;
    return task;
  }, []);
  const refresh = useCallback(async () => { await run(() => cartService.get()); }, [run]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void refresh(); });
    return () => { active = false; };
  }, [refresh]);
  useEffect(() => {
    window.addEventListener("elchi:guest-merged", refresh);
    return () => window.removeEventListener("elchi:guest-merged", refresh);
  }, [refresh]);
  const add = useCallback(async (input: AddCartInput) => {
    return run(() => cartService.add(input));
  }, [run]);
  const update = useCallback(async (id: string, quantity: number) => { await run(() => cartService.update(id, quantity)); }, [run]);
  const remove = useCallback(async (id: string) => { await run(() => cartService.remove(id)); }, [run]);
  const clear = useCallback(async () => { await run(() => cartService.clear(cart)); }, [cart, run]);
  const actions = useMemo(() => ({ items: cart.items, loading, add, update, remove }), [add, cart.items, loading, remove, update]);
  const value = useMemo(() => ({ ...cart, ...cartTotals(cart.items), loading, error,
    add,
    update,
    remove,
    clear,
    refresh,
  }), [add, cart, clear, error, loading, refresh, remove, update]);
  return <CartActionsContext.Provider value={actions}><CartContext.Provider value={value}>{children}</CartContext.Provider></CartActionsContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart CartProvider ichida ishlatilishi kerak");
  return context;
}

export function useCartActions() {
  const context = useContext(CartActionsContext);
  if (!context) throw new Error("useCartActions CartProvider ichida ishlatilishi kerak");
  return context;
}
