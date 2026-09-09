import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`}>{children}</div>;
}

export function Button({ children, variant = "primary", loading = false, className = "", disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary"; loading?: boolean }) {
  return <button className={`button button--${variant} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <LoaderCircle className="button-spinner" aria-hidden/>}{children}</button>;
}

export function SectionHeader({ title, link = "Barchasini ko‘rish" }: { title: string; link?: string }) {
  return <div className="section-header"><h2>{title}</h2><Link href="#products">{link} <span aria-hidden>→</span></Link></div>;
}

export function Price({ value, oldValue }: { value: number; oldValue?: number }) {
  return <span className="price"><strong>{formatPrice(value)} <small>so‘m</small></strong>{oldValue && <del>{formatPrice(oldValue)}</del>}</span>;
}

type StatePanelProps = {
  kind?: "empty" | "error";
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
};

export function StatePanel({ kind = "empty", title, description, action, icon, compact = false }: StatePanelProps) {
  return <section className={`state-panel state-panel--${kind}${compact ? " state-panel--compact" : ""}`} role={kind === "error" ? "alert" : "status"}>
    <span className="state-panel__icon">{icon ?? (kind === "error" ? <AlertCircle/> : <Inbox/>)}</span>
    <h2>{title}</h2>
    <p>{description}</p>
    {action && <div className="state-panel__action">{action}</div>}
  </section>;
}

export function LoadingGrid({ count = 4, label = "Yuklanmoqda" }: { count?: number; label?: string }) {
  return <div className="loading-grid" role="status" aria-live="polite" aria-label={label}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: count }, (_, index) => <i aria-hidden key={index}/>) }
  </div>;
}
