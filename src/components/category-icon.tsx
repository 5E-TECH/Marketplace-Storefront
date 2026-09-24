import Image from "next/image";
import { getSafeImageSrc } from "@/lib/product-storage";

// Backend kategoriya rasmini (iconUrl) bermaganda nomdagi kalit so'z bo'yicha 3D ikonka tanlanadi.
// Ikonkalar: Microsoft Fluent Emoji 3D (MIT) — public/category-icons/LICENSE.
// Birinchi mos kelgan kalit so'z g'olib bo'ladi, shuning uchun aniqroqlari yuqorida turadi.
const iconRules: [string[], string][] = [
  [["smartfon", "telefon", "mobil"], "smartphone"],
  [["noutbuk", "kompyuter", "komputer", "laptop"], "laptop"],
  [["televizor", "tv", "monitor"], "tv"],
  [["muzlatgich", "maishiy", "kir yuvish"], "appliance"],
  [["elektronika", "texnika", "gadjet"], "electronics"],
  [["soat", "aksessuar"], "watch"],
  [["zargarlik", "oltin", "kumush", "bijuteriya"], "gem"],
  [["poyabzal", "oyoq kiyim", "krossovka", "botinka"], "shoe"],
  [["kiyim", "kiyim-kechak", "moda", "tekstil"], "shirt"],
  [["kosmetika", "parfum", "atir", "go‘zallik", "parvarish"], "cosmetics"],
  [["salomatlik", "sog‘liq", "dori", "tibbiy"], "health"],
  [["bola", "bolalar", "chaqaloq", "go‘dak"], "baby"],
  [["o‘yinchoq", "o‘yin", "konsol"], "toys"],
  [["sport", "fitnes", "turizm"], "sport"],
  [["mebel", "interyer"], "furniture"],
  [["uy", "ro‘zg‘or", "bog‘"], "home"],
  [["oziq", "ovqat", "ichimlik", "mahsulot"], "food"],
  [["gul", "o‘simlik"], "plant"],
  [["hayvon", "uy hayvon"], "pets"],
  [["kitob", "adabiyot"], "books"],
  [["kanselyariya", "ofis", "maktab"], "stationery"],
  [["musiqa", "cholg‘u", "asbob-uskuna"], "music"],
  [["avto", "mashina", "moto", "transport"], "auto"],
  [["qurilish", "ta‘mir", "instrument"], "construction"],
  [["jihoz", "uskuna", "asbob"], "tools"],
  [["market", "supermarket", "savdo"], "market"],
];

const normalize = (value: string) => value.toLocaleLowerCase("uz").replace(/[ʻʼ‘’`']/g, "‘");

export const categoryIconFor = (name: string): string => {
  const key = normalize(name);
  const icon = iconRules.find(([words]) => words.some((word) => key.includes(normalize(word))))?.[1] ?? "default";
  return `/category-icons/${icon}.webp`;
};

/** Kategoriya nomi yonida turadi — alt bo'sh, ekran o'quvchi nomni ikki marta o'qimasin. */
export function CategoryIcon({ name, iconUrl, className }: { name: string; iconUrl?: string; className?: string }) {
  const src = iconUrl ? getSafeImageSrc(iconUrl) : categoryIconFor(name);
  // O'zimizdagi ikonkalar allaqachon kichik WebP — optimizatordan o'tkazish faqat kechiktiradi.
  return <Image className={className} src={src} alt="" width={80} height={80} unoptimized={!iconUrl}/>;
}
