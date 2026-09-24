"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/providers/favorites-provider";
import type { Product } from "@/types/commerce";

type Props = {
  product: Product;
  /** `floating` — rasm ustidagi doira, `boxed` — mahsulot sahifasidagi kvadrat, `inline` — matnli tugma. */
  variant?: "floating" | "boxed" | "inline";
  label?: string;
};

const classes = { floating: "favorite", boxed: "detail-heart", inline: "favorite-inline" } as const;

/** Yurak tugmasi uch joyda bir xil ishlaydi: holat, bloklash va aria matni shu yerda. */
export function FavoriteButton({ product, variant = "floating", label = "Sevimlilarga" }: Props) {
  const favorites = useFavorites();
  const active = favorites.has(product.id);
  return <button
    type="button"
    className={`${classes[variant]}${active ? " active" : ""}`}
    disabled={!favorites.hydrated || favorites.isPending(product.id)}
    aria-pressed={active}
    aria-label={active ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"}
    onClick={(event) => { event.preventDefault(); event.stopPropagation(); void favorites.toggle(product); }}
  ><Heart size={variant === "floating" ? 19 : undefined} fill={active ? "currentColor" : "none"}/>{variant === "inline" && <span>{label}</span>}</button>;
}
