"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { getSafeImageSrc } from "@/lib/product-storage";
import type { Banner } from "@/types/commerce";

const AUTOPLAY_MS = 5000;
const SWIPE_PX = 40;
// Konteyner eni 1240px; telefonda chekkadan 12px joy qoladi.
const SIZES = "(max-width: 1280px) calc(100vw - 24px), 1240px";

/**
 * Bosh sahifa tepasidagi bannerlar: o'zi almashadi, strelka, nuqtalar,
 * klaviatura va barmoq bilan surib ham o'tkaziladi. Sichqoncha ustida
 * turganda, tab yashirin bo'lganda yoki "harakatni kamaytirish" yoqilganda to'xtaydi.
 * Ro'yxat bo'sh bo'lsa blok umuman chizilmaydi.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStart = useRef<number | null>(null);
  const count = banners.length;
  const go = useCallback((index: number) => setActive((index + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => { if (!document.hidden) setActive((current) => (current + 1) % count); }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (!count) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); go(active - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); go(active + 1); }
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== "mouse") swipeStart.current = event.clientX; };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    if (swipeStart.current === null) return;
    const distance = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(distance) > SWIPE_PX) go(active + (distance < 0 ? 1 : -1));
  };

  return <section className="banner-carousel" aria-roledescription="carousel" aria-label="Aksiyalar va e’lonlar"
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onKeyDown={onKeyDown}>
    <div className="banner-track" style={{ transform: `translateX(-${active * 100}%)` }} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { swipeStart.current = null; }}>
      {banners.map((banner, index) => {
        const current = index === active;
        // Sarlavha rasm ustida matn bo'lib turibdi — alt uni takrorlasa ekran o'quvchi ikki marta o'qirdi.
        const visual = <>
          <Image src={getSafeImageSrc(banner.imageUrl)} alt="" fill sizes={SIZES} priority={index === 0} draggable={false}/>
          {banner.title && <span className="banner-title">{banner.title}</span>}
        </>;
        const props = { className: "banner-slide", role: "group", "aria-roledescription": "slide", "aria-label": `${index + 1} / ${count}`, "aria-hidden": !current || undefined };
        if (!banner.linkUrl) return <div {...props} key={banner.id}>{visual}</div>;
        const tabIndex = current ? undefined : -1;
        return banner.linkUrl.startsWith("/")
          ? <Link {...props} key={banner.id} href={banner.linkUrl} tabIndex={tabIndex}>{visual}</Link>
          : <a {...props} key={banner.id} href={banner.linkUrl} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex}>{visual}</a>;
      })}
    </div>
    {count > 1 && <>
      <button type="button" className="banner-arrow banner-arrow--prev" onClick={() => go(active - 1)} aria-label="Oldingi banner"><ChevronLeft aria-hidden/></button>
      <button type="button" className="banner-arrow banner-arrow--next" onClick={() => go(active + 1)} aria-label="Keyingi banner"><ChevronRight aria-hidden/></button>
      <div className="banner-dots">{banners.map((banner, index) => <button type="button" key={banner.id} onClick={() => go(index)} aria-label={`${index + 1}-banner`} aria-current={index === active || undefined}/>)}</div>
    </>}
  </section>;
}
