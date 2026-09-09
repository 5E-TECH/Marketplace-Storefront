import type { Metadata } from "next";
import { FavoritesContent } from "@/components/favorites-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Sevimlilar", description: "Siz saqlagan sevimli mahsulotlar." };

export default function FavoritesPage() {
  return <main><Container><FavoritesContent/></Container></main>;
}
