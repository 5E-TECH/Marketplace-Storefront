"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cartService, cartTotals } from "@/services/cart.service";
import type { AddCartInput, Cart, CartItem } from "@/types/commerce";

const UPDATE_DELAY_MS = 450;
type PendingUpdate = { quantity: number; timer?: ReturnType<typeof setTimeout> };
type CartContextValue = Cart & { loading: boolean; syncing: boolean; error: string | null; quantity: number; subtotal: number; add: (input: AddCartInput) => Promise<boolean>; update: (id: string, quantity: number) => Promise<void>; remove: (id: string) => Promise<void>; clear: () => Promise<void>; refresh: () => Promise<void>; flush: () => Promise<void> };
const CartContext = createContext<CartContextValue | null>(null);
type CartActionsContextValue = { items: CartItem[]; loading: boolean; add: (input: AddCartInput) => Promise<boolean>; update: (id: string, quantity: number) => Promise<void>; remove: (id: string) => Promise<void> };
const CartActionsContext = createContext<CartActionsContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({ items: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cartRef = useRef(cart);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const pendingActions = useRef(0);
  const pendingUpdates = useRef(new Map<string, PendingUpdate>());
  const confirmedQuantities = useRef(new Map<string, number>());
  const inFlightUpdates = useRef(new Map<string, Promise<void>>());
  const mounted = useRef(true);

  const commitCart = useCallback((next: Cart) => {
    cartRef.current = next;
    setCart(next);
  }, []);
  const withOptimisticUpdates = useCallback((serverCart: Cart): Cart => ({
    ...serverCart,
    items: serverCart.items.map((item) => {
      const pending = pendingUpdates.current.get(item.id);
      return pending ? { ...item, quantity: pending.quantity } : item;
    }),
  }), []);
  const acceptServerCart = useCallback((serverCart: Cart) => {
    serverCart.items.forEach((item) => {
      if (!pendingUpdates.current.has(item.id)) confirmedQuantities.current.set(item.id, item.quantity);
    });
    commitCart(withOptimisticUpdates(serverCart));
  }, [commitCart, withOptimisticUpdates]);
  const run = useCallback((action: () => Promise<Cart>): Promise<boolean> => {
    pendingActions.current += 1;
    setLoading(true);
    const task = queue.current.then(async () => {
      if (mounted.current) setError(null);
      try {
        const next = await action();
        if (mounted.current) acceptServerCart(next);
        return true;
      } catch (caught) {
        if (mounted.current) setError(caught instanceof Error ? caught.message : "Savatcha amalini bajarib bo‘lmadi");
        return false;
      } finally {
        pendingActions.current -= 1;
        if (mounted.current) setLoading(pendingActions.current > 0);
      }
    });
    queue.current = task;
    return task;
  }, [acceptServerCart]);

  const syncItem = useCallback(async (id: string): Promise<void> => {
    const active = inFlightUpdates.current.get(id);
    if (active) return active.then(() => pendingUpdates.current.has(id) ? syncItem(id) : undefined);
    const pending = pendingUpdates.current.get(id);
    if (!pending) return;
    if (pending.timer) clearTimeout(pending.timer);
    const sentQuantity = pending.quantity;
    const request = (async () => {
      if (mounted.current) { setSyncing(true); setError(null); }
      try {
        const serverCart = await cartService.update(id, sentQuantity);
        confirmedQuantities.current.set(id, sentQuantity);
        if (pendingUpdates.current.get(id)?.quantity === sentQuantity) pendingUpdates.current.delete(id);
        if (mounted.current) acceptServerCart(serverCart);
      } catch (caught) {
        pendingUpdates.current.delete(id);
        const confirmed = confirmedQuantities.current.get(id);
        if (mounted.current) {
          if (confirmed !== undefined) commitCart({ ...cartRef.current, items: cartRef.current.items.map((item) => item.id === id ? { ...item, quantity: confirmed } : item) });
          setError(caught instanceof Error ? caught.message : "Mahsulot miqdorini saqlab bo‘lmadi");
        }
      } finally {
        inFlightUpdates.current.delete(id);
        if (mounted.current) setSyncing(inFlightUpdates.current.size > 0 || pendingUpdates.current.size > 0);
      }
    })();
    inFlightUpdates.current.set(id, request);
    await request;
    if (pendingUpdates.current.has(id)) await syncItem(id);
  }, [acceptServerCart, commitCart]);

  const flush = useCallback(async () => {
    await Promise.all([...pendingUpdates.current.keys()].map(syncItem));
  }, [syncItem]);
  const refresh = useCallback(async () => { await flush(); await run(() => cartService.get()); }, [flush, run]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    const updates = pendingUpdates.current;
    queueMicrotask(() => { if (active) void refresh(); });
    return () => {
      active = false;
      mounted.current = false;
      updates.forEach((item) => { if (item.timer) clearTimeout(item.timer); });
    };
  }, [refresh]);
  useEffect(() => {
    window.addEventListener("elchi:guest-merged", refresh);
    return () => window.removeEventListener("elchi:guest-merged", refresh);
  }, [refresh]);

  const add = useCallback(async (input: AddCartInput) => run(() => cartService.add(input)), [run]);
  const update = useCallback(async (id: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    const previous = pendingUpdates.current.get(id);
    if (previous?.timer) clearTimeout(previous.timer);
    if (!confirmedQuantities.current.has(id)) {
      const current = cartRef.current.items.find((item) => item.id === id);
      if (current) confirmedQuantities.current.set(id, current.quantity);
    }
    const pending: PendingUpdate = { quantity };
    pending.timer = setTimeout(() => void syncItem(id), UPDATE_DELAY_MS);
    pendingUpdates.current.set(id, pending);
    commitCart({ ...cartRef.current, items: cartRef.current.items.map((item) => item.id === id ? { ...item, quantity } : item) });
    setSyncing(true);
    setError(null);
  }, [commitCart, syncItem]);
  const remove = useCallback(async (id: string) => {
    const pending = pendingUpdates.current.get(id);
    if (pending?.timer) clearTimeout(pending.timer);
    pendingUpdates.current.delete(id);
    const active = inFlightUpdates.current.get(id);
    if (active) await active;
    await run(() => cartService.remove(id));
  }, [run]);
  const clear = useCallback(async () => { await flush(); await run(() => cartService.clear(cartRef.current)); }, [flush, run]);

  const actions = useMemo(() => ({ items: cart.items, loading, add, update, remove }), [add, cart.items, loading, remove, update]);
  const value = useMemo(() => ({ ...cart, ...cartTotals(cart.items), loading, syncing, error, add, update, remove, clear, refresh, flush }), [add, cart, clear, error, flush, loading, refresh, remove, syncing, update]);
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
