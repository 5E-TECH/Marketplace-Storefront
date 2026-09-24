"use client";

import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type ToastTone = "success" | "error" | "info";
type Toast = { id: number; tone: ToastTone; message: string };
type ToastContextValue = { show: (message: string, tone?: ToastTone) => void; dismiss: (id: number) => void };

const VISIBLE_MS = 5_000;
const MAX_VISIBLE = 3;
const ToastContext = createContext<ToastContextValue | null>(null);
const icons = { success: CheckCircle2, error: CircleAlert, info: Info } as const;

/**
 * Sahifada alohida xato joyi yo'q amallar (kartadan savatga qo'shish, yurak tugmasi)
 * shu yerda xabar beradi — aks holda xato jimgina yo'qoladi.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);
  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const text = message.trim();
    if (!text) return;
    const id = (nextId.current += 1);
    // Bir xil xabar ketma-ket kelsa (masalan backend uzilganda) ro'yxat to'lib ketmasin.
    setToasts((current) => [...current.filter((toast) => toast.message !== text), { id, tone, message: text }].slice(-MAX_VISIBLE));
    timers.current.set(id, setTimeout(() => dismiss(id), VISIBLE_MS));
  }, [dismiss]);
  useEffect(() => {
    const active = timers.current;
    return () => { active.forEach(clearTimeout); active.clear(); };
  }, []);
  const value = useMemo(() => ({ show, dismiss }), [dismiss, show]);
  return <ToastContext.Provider value={value}>
    {children}
    <div className="toast-stack" role="region" aria-label="Bildirishnomalar">
      {toasts.map(({ id, tone, message }) => {
        const Icon = icons[tone];
        return <output className={`toast toast--${tone}`} key={id} aria-live={tone === "error" ? "assertive" : "polite"}>
          <Icon aria-hidden/>
          <span>{message}</span>
          <button type="button" onClick={() => dismiss(id)} aria-label="Xabarni yopish"><X/></button>
        </output>;
      })}
    </div>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast ToastProvider ichida ishlatilishi kerak");
  return context;
}
