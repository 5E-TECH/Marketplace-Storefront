import Image from "next/image";
import { HEAD } from "@/lib/texts";
import logo from "./logo.png";

/** karkas-1: logo va «Elchi Market». Menyu, savat, qidiruv va kirish yo‘q. */
export function SiteHeader() {
  return (
    <header className="site-header">
      <Image src={logo} alt="" width={28} height={28} priority />
      <span className="site-header__name">{HEAD}</span>
    </header>
  );
}
