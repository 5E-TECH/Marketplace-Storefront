/* eslint-disable @next/next/no-img-element -- rasm offer kartasidagi CDN manzilidan; host EQ-05 gacha noma’lum */
import type { LandingPage } from "@/lib/contract";
import { PRODUCT } from "@/lib/texts";
import { PlayIcon } from "./icons";
import { VideoCover } from "./video-cover";

/**
 * Galereya (standart-1, video-1): faqat CSS `scroll-snap`, JS siz ham suriladi. Hisoblagich «1 / 4».
 * «Standart»: rasmlar, video oxirida, birinchi slaydda «Video» chipi. «Video»: video birinchi, muqova bilan.
 * Video yo‘q bo‘lsa — faqat rasmlar, chipsiz (video-6 [taklif]); hech narsa yo‘q bo‘lsa — kulrang katak.
 */
export function Gallery({ page }: { page: LandingPage }) {
  const { images, videoUrl, name } = page.product;
  const videoFirst = page.template === "VIDEO" && Boolean(videoUrl);
  const total = images.length + (videoUrl ? 1 : 0);
  const count = (index: number) => `${index + 1} / ${total}`;
  const label = videoFirst ? PRODUCT.videoGalleryLabel : PRODUCT.galleryLabel;

  if (total === 0) return <div className="gallery" role="group" aria-label={label}><div className="slide" /></div>;

  const photos = images.map((url, index) => {
    const position = videoFirst ? index + 1 : index;
    const first = position === 0;
    return (
      <div className="slide" key={url + index}>
        <img src={url} alt={first ? name : ""} {...(first ? { fetchPriority: "high" as const } : { loading: "lazy" as const })} />
        {first && videoUrl && !videoFirst ? <a className="chip" href="#video" aria-label={PRODUCT.watchVideo}><PlayIcon size={18} />{PRODUCT.videoChip}</a> : null}
        <span className="slide__count">{count(position)}</span>
      </div>
    );
  });

  return (
    <div className="gallery" role="group" aria-label={label} tabIndex={0}>
      {videoFirst && videoUrl ? <VideoCover src={videoUrl} poster={images[0] ?? null} count={count(0)} /> : null}
      {photos}
      {!videoFirst && videoUrl ? (
        <div className="slide slide--video">
          <video id="video" src={videoUrl} poster={images[0]} controls preload="none" playsInline aria-label={PRODUCT.videoLabel} />
          <span className="slide__count">{count(total - 1)}</span>
        </div>
      ) : null}
    </div>
  );
}
