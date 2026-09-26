import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { preload } from "react-dom";
import "./fonts.css";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { FloatingCart } from "@/components/floating-cart";
import { CartProvider } from "@/providers/cart-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { categoryService } from "@/services/category.service";
import { baseOpenGraph, defaultOpenGraphImages, SITE_NAME, siteUrl } from "@/lib/seo";

export const viewport: Viewport = { themeColor: "#e30613", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: SITE_NAME,
  title: { default: "Elchi Market — O‘zbekistondagi onlayn marketplace", template: "%s | Elchi Market" },
  description: "Elchi Market — O‘zbekistondagi do‘konlarning mahsulotlari bitta joyda. Elektronika, kiyim, uy-ro‘zg‘or va oziq-ovqatni toping, buyurtma bering, uyingizgacha yetkazib beramiz.",
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  openGraph: { ...baseOpenGraph, title: SITE_NAME, description: "O‘zbekistondagi do‘konlarning mahsulotlari bitta joyda.", url: "/", images: defaultOpenGraphImages },
  // Sarlavha va tavsif har sahifaning og: teglaridan olinadi.
  twitter: { card: "summary_large_image" },
  ...(process.env.GOOGLE_SITE_VERIFICATION || process.env.YANDEX_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION, yandex: process.env.YANDEX_VERIFICATION } } : {}),
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Asosiy (lotin) subset birinchi bo'yashdan oldin yuklansin; qolganlari kerak bo'lsa unicode-range bo'yicha.
  preload("/fonts/inter-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  const categories = await categoryService.list();
  // Build paytida backend javob bermasa, bo'sh kategoriyalar statik sahifalarga (katalog, savat...) muhrlanib
  // qolmasin: bunday sahifa so'rov vaqtida quriladi. Oddiy ishlashda (backend javob bersa) hech narsa o'zgarmaydi.
  if (categories.error && process.env.NEXT_PHASE === "phase-production-build") await connection();
  return (
    <html lang="uz">
      <body><ToastProvider><FavoritesProvider><CartProvider><Header categories={categories.data}/>{children}<FloatingCart/><Footer/></CartProvider></FavoritesProvider></ToastProvider></body>
    </html>
  );
}
