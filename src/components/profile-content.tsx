"use client";

import { ChevronRight, Heart, LogOut, MapPin, Package, Save, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { authService, type AuthSession } from "@/services/auth.service";
import { Button } from "./ui";
import styles from "./profile-content.module.css";
import { errorMessage } from "@/lib/errors";

const links = [
  { href: "/profile/orders", icon: Package, title: "Buyurtmalarim", text: "Buyurtmalar tarixi va holati" },
  { href: "/favorites", icon: Heart, title: "Sevimlilar", text: "Saqlangan mahsulotlar" },
  { href: "/cart", icon: ShoppingBag, title: "Savatcha", text: "Tanlangan mahsulotlar" },
  { href: "/checkout", icon: MapPin, title: "Yetkazish", text: "Manzil va yetkazish narxi" },
] as const;

function ProfileHero({ session, pending, onLogout }: { session: AuthSession; pending: boolean; onLogout: () => void }) {
  return <header className={styles.hero}><span className={styles.avatar}><UserRound/></span><div className={styles.heroCopy}><small>SHAXSIY KABINET</small><h1>{session.name ? `Salom, ${session.name}!` : "Xush kelibsiz!"}</h1><p>{session.phone} raqami bilan tizimga kirilgansiz. Mehmon savatingiz akkauntingizga birlashtirilgan.</p></div><button className={styles.logout} type="button" disabled={pending} onClick={onLogout}><LogOut/> Chiqish</button></header>;
}

function ProfileNavigation() {
  return <nav className={styles.links} aria-label="Kabinet bo‘limlari">{links.map(({ href, icon: Icon, title, text }) => <Link href={href} key={title}><span><Icon/></span><div><b>{title}</b><small>{text}</small></div><ChevronRight/></Link>)}</nav>;
}

export function ProfileContent() {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const current = authService.getSession();
    setSession(current);
    if (current) authService.refreshProfile().then(setSession).catch(() => { /* Cached profile remains available during a temporary outage. */ });
    const expired = () => { authService.clearSession(); setSession(null); setError("Sessiya tugadi. Qayta kiring."); };
    window.addEventListener("elchi:auth-expired", expired);
    return () => window.removeEventListener("elchi:auth-expired", expired);
  }, []);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true); setError(""); setMessage("");
    try {
      setSession(await authService.updateProfile({ name: String(form.get("name") ?? ""), phone: String(form.get("phone") ?? "") }));
      setMessage("Profil ma’lumotlari saqlandi.");
    } catch (caught) { setError(errorMessage(caught, "Profilni saqlab bo‘lmadi")); }
    finally { setPending(false); }
  };
  const logout = async () => {
    if (pending) return;
    setPending(true); setError("");
    try { await authService.logout(); setSession(null); }
    catch { setSession(null); }
    finally { setPending(false); }
  };
  if (session === undefined) return <section className={styles.page} role="status"><div className={styles.skeleton}/></section>;
  if (!session) return <section className={styles.page}><header className={styles.hero}><span className={styles.avatar}><UserRound/></span><div className={styles.heroCopy}><small>SHAXSIY KABINET</small><h1>Akkauntingizga kiring</h1><p>Buyurtmalaringizni ko‘rish va profilni boshqarish uchun kiring. Akkauntsiz ham katalog, savat va checkout ishlaydi.</p></div></header><div className={styles.guestActions}>{error && <p className={styles.error} role="alert">{error}</p>}<Link className="button button--primary" href="/login">Kirish</Link><Link className="button button--secondary" href="/register">Akkaunt ochish</Link></div></section>;
  return <section className={styles.page}><ProfileHero session={session} pending={pending} onLogout={() => void logout()}/><ProfileNavigation/><form className={styles.profileForm} onSubmit={save}><div className={styles.formTitle}><span><UserRound/></span><div><h2>Profil ma’lumotlari</h2><p>Ism va telefon raqamingizni yangilang</p></div></div><div className={styles.profileFields}><label><span>Ism</span><input name="name" autoComplete="name" required minLength={2} defaultValue={session.name ?? ""} placeholder="Ismingiz"/></label><label><span>Telefon raqami</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required pattern="\+998[0-9]{9}" defaultValue={session.phone}/></label></div>{error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.success} role="status">{message}</p>}<Button type="submit" loading={pending}><Save/> Saqlash</Button></form></section>;
}
