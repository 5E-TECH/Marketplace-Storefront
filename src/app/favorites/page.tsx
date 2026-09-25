import type { Metadata } from "next";
import { FavoritesContent } from "@/components/favorites-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Sevimlilar", description: "Siz saqlagan sevimli mahsulotlar.", robots: privateRobots };

export default function FavoritesPage() {
  return <main><Container><FavoritesContent/></Container></main>;
}
