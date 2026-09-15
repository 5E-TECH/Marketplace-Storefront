import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { FloatingCart } from "@/components/floating-cart";
import { CartProvider } from "@/providers/cart-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { categoryService } from "@/services/category.service";
import { absoluteUrl, defaultOpenGraphImages, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Elchi Market — O‘zbekistondagi onlayn marketplace", template: "%s | Elchi Market" },
  description: "Telefon, elektronika, uy-ro‘zg‘or va kundalik mahsulotlarni O‘zbekiston bo‘ylab onlayn xarid qiling.",
  keywords: ["marketplace", "onlayn do‘kon", "telefon narxi", "elektronika", "Toshkent", "O‘zbekiston"],
  robots: { index: true, follow: true },
  openGraph: { title: "Elchi Market", description: "Yaxshi mahsulot. Yaxshi narx.", url: "/", siteName: "Elchi Market", locale: "uz_UZ", type: "website", images: defaultOpenGraphImages },
  twitter: { card: "summary_large_image", title: "Elchi Market", description: "Yaxshi mahsulot. Yaxshi narx.", images: [absoluteUrl("/og-default.png")] },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const categories = await categoryService.list();
  return (
    <html lang="uz">
      <body><FavoritesProvider><CartProvider><Header categories={categories.data}/>{children}<FloatingCart/><Footer/></CartProvider></FavoritesProvider></body>
    </html>
  );
}
