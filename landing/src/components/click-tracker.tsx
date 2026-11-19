"use client";

import { useEffect, useRef } from "react";
import { TRACKING_FIELDS } from "@/lib/contract";
import { buildClick } from "@/lib/tracking";
import type { Variant } from "@/lib/variant";

/** Lid formasi (SF-02) `clickId` ni shu kalitdan oladi (`CreateLeadDto.clickId`). */
export const clickStorageKey = (code: string) => `elchi_click:${code}`;

/** Havola parametrlari (sub1–sub5, utm, fbclid): S3 buyurtma qadamida manzilda yo‘q, forma shu yerdan oladi. */
export const trackingStorageKey = (code: string) => `elchi_track:${code}`;

/**
 * Har sahifa ochilishida bitta klik: kod, ko‘rsatilgan variant, havola parametrlari.
 * Klik yozilmasa sahifa baribir ishlaydi — xato mijozga ko‘rsatilmaydi.
 */
export function ClickTracker({ code, variant }: { code: string; variant: Variant }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const click = buildClick(code, variant, window.location.search, document.cookie);
    const tracking = Object.fromEntries(TRACKING_FIELDS.filter((field) => click[field]).map((field) => [field, click[field]]));
    try { if (Object.keys(tracking).length) sessionStorage.setItem(trackingStorageKey(code), JSON.stringify(tracking)); } catch { /* xususiy rejim */ }
    const body = JSON.stringify(click);
    fetch("/api/clicks", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true })
      .then((response) => (response.ok ? response.json() : null))
      .then((created: { clickId?: string } | null) => {
        if (!created?.clickId) return;
        try { sessionStorage.setItem(clickStorageKey(code), created.clickId); } catch { /* xususiy rejim */ }
      })
      .catch(() => undefined);
  }, [code, variant]);
  return null;
}
