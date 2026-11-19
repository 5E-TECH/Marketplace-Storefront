"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};
const opened = () => `${window.location.host}${window.location.pathname}`;

/**
 * «Siz ochgan havola» (404-1, toxtatilgan-3): brauzer ochgan manzil. Sahifa statik (SF-03) — server so‘rov
 * sarlavhasini o‘qimaydi, manzilni brauzer ko‘rsatadi. JS siz blok chiqmaydi (bo‘sh joy qolmaydi).
 */
export function OpenedLink({ title }: { title?: string }) {
  const value = useSyncExternalStore(noop, opened, () => "");
  if (!value) return null;
  return (
    <>
      {title ? <p className="block__title">{title}</p> : null}
      <p className="mono">{value}</p>
    </>
  );
}
