import Image from "next/image";
import { getSafeImageSrc } from "@/lib/product-storage";

export function CategoryIcon({ name, iconUrl, className }: { name: string; iconUrl?: string; className?: string }) {
  if (iconUrl) return <Image className={className} src={getSafeImageSrc(iconUrl)} alt="" width={64} height={64}/>;
  return <span className={className} aria-hidden>{name.trim().charAt(0).toLocaleUpperCase("uz") || "K"}</span>;
}
