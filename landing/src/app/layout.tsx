import type { Metadata, Viewport } from "next";
import "./globals.css";

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
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
