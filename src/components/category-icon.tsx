import Image from "next/image";
import {
  Apple, Baby, Book, Car, Cpu, Dumbbell, Flower2, Footprints, Gamepad2, Gem, Guitar, Hammer, HeartPulse, Home, Laptop,
  LayoutGrid, PawPrint, PenTool, Refrigerator, Shirt, ShoppingBasket, Smartphone, Sofa, Sparkles, Tv, Watch, Wrench,
  type LucideIcon,
} from "lucide-react";
import { getSafeImageSrc } from "@/lib/product-storage";

// Backend kategoriya ikonkasini bermaganda nomdagi kalit so'z bo'yicha tanlanadi.
// Birinchi mos kelgan kalit so'z g'olib bo'ladi, shuning uchun aniqroqlari yuqorida turadi.
const iconRules: [string[], LucideIcon][] = [
  [["smartfon", "telefon", "mobil"], Smartphone],
  [["noutbuk", "kompyuter", "komputer", "laptop"], Laptop],
  [["televizor", "tv", "monitor"], Tv],
  [["muzlatgich", "maishiy", "kir yuvish"], Refrigerator],
  [["elektronika", "texnika", "gadjet"], Cpu],
  [["soat", "aksessuar"], Watch],
  [["zargarlik", "oltin", "kumush", "bijuteriya"], Gem],
  [["poyabzal", "oyoq kiyim", "krossovka", "botinka"], Footprints],
  [["kiyim", "kiyim-kechak", "moda", "tekstil"], Shirt],
  [["kosmetika", "parfum", "atir", "go‘zallik", "parvarish"], Sparkles],
  [["salomatlik", "sog‘liq", "dori", "tibbiy"], HeartPulse],
  [["bola", "bolalar", "chaqaloq", "go‘dak"], Baby],
  [["o‘yinchoq", "o‘yin", "konsol"], Gamepad2],
  [["sport", "fitnes", "turizm"], Dumbbell],
  [["mebel", "interyer"], Sofa],
  [["uy", "ro‘zg‘or", "bog‘"], Home],
  [["oziq", "ovqat", "ichimlik", "mahsulot"], Apple],
  [["gul", "o‘simlik"], Flower2],
  [["hayvon", "uy hayvon"], PawPrint],
  [["kitob", "adabiyot"], Book],
  [["kanselyariya", "ofis", "maktab"], PenTool],
  [["musiqa", "cholg‘u", "asbob-uskuna"], Guitar],
  [["avto", "mashina", "moto", "transport"], Car],
  [["qurilish", "ta‘mir", "instrument"], Hammer],
  [["jihoz", "uskuna", "asbob"], Wrench],
  [["market", "supermarket", "savdo"], ShoppingBasket],
];

const normalize = (value: string) => value.toLocaleLowerCase("uz").replace(/[\u02bb\u02bc\u2018\u2019`']/g, "‘");

export const categoryIconFor = (name: string): LucideIcon => {
  const key = normalize(name);
  return iconRules.find(([words]) => words.some((word) => key.includes(normalize(word))))?.[1] ?? LayoutGrid;
};

export function CategoryIcon({ name, iconUrl, className }: { name: string; iconUrl?: string; className?: string }) {
  if (iconUrl) return <Image className={className} src={getSafeImageSrc(iconUrl)} alt="" width={64} height={64}/>;
  const Icon = categoryIconFor(name);
  return <span className={className} aria-hidden><Icon/></span>;
}
