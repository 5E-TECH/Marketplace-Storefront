"use client";

import { useSyncExternalStore } from "react";
import { classifyPath } from "@/lib/routing";

const noop = () => () => {};

/** Sahifa shu domendagi sotuvchi sahifasidan ochilgan bo‘lsa — o‘sha sahifa manzili (forma qadamlari ham). */
function productPath(): string {
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin !== window.location.origin) return "";
    const route = classifyPath(referrer.pathname);
    return route.kind === "landing" ? `/${route.code}` : "";
  } catch {
    return "";
  }
}

/**
 * «Tovar sahifasiga qaytish» (huquqiy sahifalar sarlavhasi ostida). Huquqiy sahifa umumiy — qaysi tovardan
 * kelingani faqat brauzerda ma’lum (Referer). Bilinmasa havola chiqmaydi: bo‘sh joy qolmaydi.
 */
export function BackToProduct({ label }: { label: string }) {
  const href = useSyncExternalStore(noop, productPath, () => "");
  if (!href) return null;
  return <p className="legal__back"><a href={href}>{label}</a></p>;
}
