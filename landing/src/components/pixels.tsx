"use client";

import { useEffect, useRef } from "react";
import { firePixelEvents, type Track } from "@/lib/pixel-events";

/**
 * Sotuvchi piksellari (SOT-3: Meta va TikTok tokenlari sahifa sozlamasida, `GET /landing/:code`).
 * Faqat ochiq sotuvchi sahifasida va «Rahmat» da yuklanadi: xato, 404 va to‘xtatilgan sahifalarda piksel yo‘q
 * (holat-matnlari.md:630, 672; SF-02 TC8). Lead — faqat «Rahmat» da, lid yozilgandan keyin, bir marta:
 * eventID = lid ID (BE-31 CAPI server hodisasi ham shu ID bilan — Meta ularni bitta hodisa deb hisoblaydi).
 * Qayta yuklanganda Lead yuborilmaydi (rahmat-5): yuborilgani `elchi_px_<lid>` cookie’sida.
 */

type Queue = ((...args: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...args: unknown[]) => void; push?: unknown; loaded?: boolean; version?: string };
type TikTok = unknown[] & { [method: string]: unknown };
declare global { interface Window { fbq?: Queue; _fbq?: Queue; ttq?: TikTok; TiktokAnalyticsObject?: string } }

function addScript(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** Meta pikselining rasmiy yuklovchisi (fbevents.js): navbat, keyin skript. */
function meta(): Queue {
  if (window.fbq) return window.fbq;
  const fbq: Queue = (...args: unknown[]) => { if (fbq.callMethod) fbq.callMethod(...args); else fbq.queue!.push(args); };
  fbq.queue = []; fbq.push = fbq; fbq.loaded = true; fbq.version = "2.0";
  window.fbq = fbq; window._fbq = fbq;
  addScript("https://connect.facebook.net/en_US/fbevents.js");
  return fbq;
}

/** TikTok pikselining rasmiy yuklovchisi (events.js) — `ttq.methods`, `setAndDefer`, `load`, xuddi rasmiy kod kabi. */
const TTQ_METHODS = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
type Deferred = unknown[] & Record<string, unknown>;
const defer = (target: Deferred, method: string) => { target[method] = (...args: unknown[]) => { target.push([method, ...args]); }; };

function tiktok(id: string): TikTok {
  window.TiktokAnalyticsObject = "ttq";
  const ttq = (window.ttq ??= [] as unknown as TikTok) as Deferred;
  if (!ttq.methods) {
    ttq.methods = TTQ_METHODS;
    ttq.setAndDefer = defer;
    for (const method of TTQ_METHODS) defer(ttq, method);
    ttq.instance = (name: string) => {
      const instance = (((ttq._i as Record<string, Deferred>) ?? {})[name] ?? []) as Deferred;
      for (const method of TTQ_METHODS) defer(instance, method);
      return instance;
    };
  }
  const loaded = ((ttq._i as Record<string, Deferred> | undefined) ??= {});
  ttq._i = loaded;
  if (!loaded[id]) {
    const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
    loaded[id] = Object.assign([] as unknown[], { _u: url }) as unknown as Deferred;
    ttq._t = { ...((ttq._t as Record<string, number>) ?? {}), [id]: Date.now() };
    ttq._o = { ...((ttq._o as Record<string, unknown>) ?? {}), [id]: {} };
    addScript(`${url}?sdkid=${encodeURIComponent(id)}&lib=ttq`);
  }
  return ttq as unknown as TikTok;
}

export function Pixels({ metaPixelId, tiktokPixelId, leadId }: { metaPixelId: string | null; tiktokPixelId: string | null; leadId?: string }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    firePixelEvents({
      meta: () => meta() as Track,
      tiktok: (id) => { const ttq = tiktok(id); return { page: ttq.page as () => void, track: ttq.track as Track }; },
      cookie: () => document.cookie,
      setCookie: (value) => { document.cookie = value; },
    }, { meta: metaPixelId, tiktok: tiktokPixelId }, leadId);
  }, [metaPixelId, tiktokPixelId, leadId]);
  return null;
}
