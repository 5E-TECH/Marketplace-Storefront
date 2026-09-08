import type { Metadata } from "next";
import "./globals.css";
import { CartDrawer } from "@/components/cart-drawer";
import { CartProvider } from "@/providers/cart-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";

export const metadata: Metadata = {
  title: { default: "Elchi Market — Smart shopping", template: "%s | Elchi Market" },
  description: "Texnologiya, uy va kundalik hayot uchun tanlangan mahsulotlar.",
  keywords: ["marketplace", "gadgets", "electronics", "online shopping"],
  openGraph: { title: "Elchi Market", description: "Yaxshi mahsulot. Yaxshi narx.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body><FavoritesProvider><CartProvider>{children}<CartDrawer/></CartProvider></FavoritesProvider></body>
    </html>
  );
}
