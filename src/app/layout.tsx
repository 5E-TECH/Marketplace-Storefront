import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { CartProvider } from "@/providers/cart-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { categoryService } from "@/services/category.service";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"),
  title: { default: "Elchi Market — Smart shopping", template: "%s | Elchi Market" },
  description: "Texnologiya, uy va kundalik hayot uchun tanlangan mahsulotlar.",
  keywords: ["marketplace", "gadgets", "electronics", "online shopping"],
  openGraph: { title: "Elchi Market", description: "Yaxshi mahsulot. Yaxshi narx.", type: "website" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await categoryService.list();
  return (
    <html lang="uz">
      <body><FavoritesProvider><CartProvider><Header categories={categories.data}/>{children}<Footer/></CartProvider></FavoritesProvider></body>
    </html>
  );
}
