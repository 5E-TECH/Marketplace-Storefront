import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { formatPrice } from "@/lib/format";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container ${className}`}>{children}</div>;
}

export function Button({ children, variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}

export function SectionHeader({ title, link = "Barchasini ko‘rish" }: { title: string; link?: string }) {
  return <div className="section-header"><h2>{title}</h2><Link href="#products">{link} <span aria-hidden>→</span></Link></div>;
}

export function Price({ value, oldValue }: { value: number; oldValue?: number }) {
  return <span className="price"><strong>{formatPrice(value)} <small>so‘m</small></strong>{oldValue && <del>{formatPrice(oldValue)}</del>}</span>;
}
