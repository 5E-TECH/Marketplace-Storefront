"use client";

import { ChevronRight, Heart, MapPin, Package, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";

const links = [
  { href: "/profile/orders", icon: Package, title: "Buyurtmalarim", text: "Buyurtmalar tarixi va holati" },
  { href: "/favorites", icon: Heart, title: "Sevimlilar", text: "Saqlangan mahsulotlar" },
  { href: "/cart", icon: ShoppingBag, title: "Savatcha", text: "Tanlangan mahsulotlar" },
  { href: "/profile", icon: MapPin, title: "Manzillar", text: "Yetkazib berish manzillari" },
];

export function ProfileContent() {
  return <section className="profile-page"><div className="profile-hero"><span><UserRound/></span><div><small>SHAXSIY KABINET</small><h1>Xush kelibsiz!</h1><p>Hozircha demo profil. Login API kelganda shu sahifa real foydalanuvchi ma’lumotlari bilan ishlaydi.</p></div></div><div className="profile-links">{links.map(({ href, icon: Icon, title, text }) => <Link href={href} key={title}><span><Icon/></span><div><b>{title}</b><small>{text}</small></div><ChevronRight/></Link>)}</div></section>;
}
