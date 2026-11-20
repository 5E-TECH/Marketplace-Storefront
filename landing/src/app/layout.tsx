import type { Metadata, Viewport } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

/** Faqat Onest 400/500/700 (sf-tizim:11, 57). Build paytida yuklab olinadi — sahifa Google’ga so‘rov yubormaydi. */
const onest = Onest({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap", variable: "--font-onest" });

/**
 * Provayderlar yo‘q (SF-01): savat, sevimlilar, toast va mijoz tokeni bu domenda ishlamaydi.
 * Layout backendni kutmaydi — har sahifa o‘z ma’lumotini o‘zi oladi.
 */
export const metadata: Metadata = {
  title: { default: "Elchi Market", template: "%s | Elchi Market" },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={onest.variable}>
      <body>{children}</body>
    </html>
  );
}
