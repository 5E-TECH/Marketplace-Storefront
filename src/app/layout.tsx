import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { FloatingCart } from "@/components/floating-cart";
import { CartProvider } from "@/providers/cart-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { categoryService } from "@/services/category.service";
import { baseOpenGraph, defaultOpenGraphImages, SITE_NAME, siteUrl } from "@/lib/seo";

const inter = Inter({ subsets: ["latin", "latin-ext", "cyrillic"], display: "swap", variable: "--font-inter" });

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
  const categories = await categoryService.list();
  return (
    <html lang="uz" className={inter.variable}>
      <body><ToastProvider><FavoritesProvider><CartProvider><Header categories={categories.data}/>{children}<FloatingCart/><Footer/></CartProvider></FavoritesProvider></ToastProvider></body>
    </html>
  );
}
