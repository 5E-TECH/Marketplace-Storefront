import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`}>{children}</div>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; loading?: boolean };

export function Button({ children, variant = "primary", loading = false, className = "", disabled, ...props }: ButtonProps) {
  return <button className={`button button--${variant} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{loading && <LoaderCircle className="button-spinner" aria-hidden/>}{children}</button>;
}

/** `href` berilmasa havola ko‘rsatilmaydi: mavjud bo‘lmagan langarga olib boruvchi havola chiqmasligi kerak. */
export function SectionHeader({ title, href, linkLabel = "Barchasini ko‘rish" }: { title: string; href?: string; linkLabel?: string }) {
  return <div className="section-header"><h2>{title}</h2>{href && <Link href={href}>{linkLabel} <span aria-hidden>→</span></Link>}</div>;
}

export function Price({ value, oldValue }: { value: number; oldValue?: number }) {
  return <span className="price"><strong>{formatPrice(value)} <small>so‘m</small></strong>{oldValue && <del>{formatPrice(oldValue)}</del>}</span>;
}
