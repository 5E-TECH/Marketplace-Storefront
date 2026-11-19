"use client";
/* eslint-disable @next/next/no-img-element -- rasm offer kartasidagi CDN manzilidan; host EQ-05 gacha noma’lum */

import { useRef, useState } from "react";
import { PlayIcon } from "./icons";
import { PRODUCT } from "@/lib/texts";

/**
 * «Video» shablonining birinchi slaydi (video-1…5): muqova va «Videoni ko‘rish». Video bosilmaguncha
 * yuklanmaydi, avtomatik ijro yo‘q. JS siz tugma oddiy havola — video brauzerda ochiladi.
 */
export function VideoCover({ src, poster, count }: { src: string; poster: string | null; count: string }) {
  const [state, setState] = useState<"cover" | "loading" | "playing" | "failed">("cover");
  const [attempt, setAttempt] = useState(0);
  const slide = useRef<HTMLDivElement>(null);
  const start = (event: React.MouseEvent) => { event.preventDefault(); setState("loading"); };
  const nextSlide = () => {
    const gallery = slide.current?.parentElement;
    gallery?.scrollBy({ left: gallery.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="slide slide--video" ref={slide}>
      {state !== "cover" ? (
        <video key={attempt} src={src} poster={poster ?? undefined} controls autoPlay playsInline preload="auto" aria-label={PRODUCT.videoLabel}
          onPlaying={() => setState("playing")} onError={() => setState("failed")} />
      ) : null}
      {state === "cover" || state === "loading" ? (
        <div className="cover">
          {poster ? <img src={poster} alt="" fetchPriority="high" /> : null}
          <a className="cover__play" href={src} onClick={start} aria-busy={state === "loading"}>
            <PlayIcon size={24} />{state === "loading" ? PRODUCT.videoLoading : PRODUCT.watchVideo}
          </a>
        </div>
      ) : null}
      {state === "failed" ? (
        <div className="video-failed" role="alert">
          <p><strong>{PRODUCT.videoFailed}</strong> {PRODUCT.videoFailedHint}</p>
          <div className="video-failed__actions">
            <button type="button" className="button-light" onClick={() => { setAttempt((n) => n + 1); setState("loading"); }}>{PRODUCT.retry}</button>
            <button type="button" className="button-light" onClick={nextSlide}>{PRODUCT.showPhotos}</button>
          </div>
        </div>
      ) : null}
      {state === "cover" ? <span className="slide__count">{count}</span> : null}
    </div>
  );
}
