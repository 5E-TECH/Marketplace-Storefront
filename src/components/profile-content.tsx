"use client";

import { ChevronRight, Heart, LogOut, MapPin, Package, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authService, type AuthSession } from "@/services/auth.service";
import { PhoneAuthModal } from "./phone-auth-modal";

const links = [
  { href: "/profile/orders", icon: Package, title: "Buyurtmalarim", text: "Buyurtmalar tarixi va holati" },
  { href: "/track-order", icon: Package, title: "Buyurtmani kuzatish", text: "Buyurtma raqami orqali holatini tekshiring" },
  { href: "/favorites", icon: Heart, title: "Sevimlilar", text: "Saqlangan mahsulotlar" },
  { href: "/cart", icon: ShoppingBag, title: "Savatcha", text: "Tanlangan mahsulotlar" },
  { href: "/profile", icon: MapPin, title: "Manzillar", text: "Yetkazib berish manzillari" },
];

export function ProfileContent() {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    const sync = () => setSession(authService.getSession());
    queueMicrotask(sync);
    window.addEventListener("elchi:auth-changed", sync);
    window.addEventListener("elchi:auth-expired", sync);
    return () => { window.removeEventListener("elchi:auth-changed", sync); window.removeEventListener("elchi:auth-expired", sync); };
  }, []);
  if (session === undefined) return <section className="page-empty" role="status">Profil yuklanmoqda...</section>;
  return <section className="profile-page">
    {authOpen && <PhoneAuthModal
      onClose={() => setAuthOpen(false)}
      onVerified={(value) => { setSession(value); setAuthOpen(false); }}
    />}
    <div className="profile-hero"><span><UserRound/></span><div><small>SHAXSIY KABINET</small><h1>{session ? "Xush kelibsiz!" : "Akkauntingizga kiring"}</h1><p>{session ? `${session.phone} · mehmon savati akkauntingizga birlashtirilgan.` : "Kirishdan oldin tanlagan mahsulotlaringiz yo‘qolmaydi — ular akkauntingiz savatiga qo‘shiladi."}</p></div>{session ? <button className="button button--secondary profile-auth-action" onClick={() => { authService.logout(); setSession(null); }}><LogOut/> Chiqish</button> : <button className="button button--primary profile-auth-action" onClick={() => setAuthOpen(true)}>Kirish</button>}</div>
    <div className="profile-links">{links.map(({ href, icon: Icon, title, text }) => <Link href={href} key={title}><span><Icon/></span><div><b>{title}</b><small>{text}</small></div><ChevronRight/></Link>)}</div>
  </section>;
}
