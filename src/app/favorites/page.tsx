import type { Metadata } from "next";
import { FavoritesContent } from "@/components/favorites-content";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Sevimlilar", description: "Siz saqlagan sevimli mahsulotlar." };

export default function FavoritesPage() {
  return <><Header/><main><Container><FavoritesContent/></Container></main><Footer/></>;
}
