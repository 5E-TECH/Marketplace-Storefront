import type { AppProps } from "next/app";
import "../app/globals.css";

/** Faqat `500.tsx` uchun (Pages Router): sotuvchi sahifasi App Router’da. Provayder yo‘q. */
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
