import Image from "next/image";
import Link from "next/link";
import { BackIcon } from "./icons";
import { HEAD } from "@/lib/texts";
import logo from "./logo.png";

/** karkas-1: logo va «Elchi Market». Menyu, savat, qidiruv va kirish yo‘q. S3-buyurtma da chapda «Ortga». */
export function SiteHeader({ back }: { back?: { href: string; label: string } } = {}) {
  return (
    <header className="site-header">
      {back ? <Link className="site-header__back" href={back.href} aria-label={back.label}><BackIcon /></Link> : null}
      <Image src={logo} alt="" width={28} height={28} priority />
      <span className="site-header__name">{HEAD}</span>
    </header>
  );
}
