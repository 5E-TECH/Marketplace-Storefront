"use client";

import { ChevronRight, Eye, EyeOff, Heart, LogIn, LogOut, MapPin, Package, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { authService, type AuthSession } from "@/services/auth.service";
import { Button } from "./ui";
import styles from "./profile-content.module.css";

const links = [
  { href: "/profile/orders", icon: Package, title: "Buyurtmalarim", text: "Buyurtmalar tarixi va holati" },
  { href: "/favorites", icon: Heart, title: "Sevimlilar", text: "Saqlangan mahsulotlar" },
  { href: "/cart", icon: ShoppingBag, title: "Savatcha", text: "Tanlangan mahsulotlar" },
  { href: "/checkout", icon: MapPin, title: "Yetkazish", text: "Manzil va yetkazish narxi" },
] as const;

function ProfileHero({ session, onLogout }: { session: AuthSession | null; onLogout: () => void }) {
  return <header className={styles.hero}><span className={styles.avatar}><UserRound/></span><div className={styles.heroCopy}><small>SHAXSIY KABINET</small><h1>{session ? "Xush kelibsiz!" : "Kabinetga kirish"}</h1><p>{session ? `${session.phone} raqami bilan tizimga kirilgansiz. Mehmon savatingiz akkauntingizga birlashtirildi.` : "Buyurtmalaringizni kuzating, sevimlilar va savatingizni bir joydan boshqaring."}</p></div>{session && <button className={styles.logout} type="button" onClick={onLogout}><LogOut/> Chiqish</button>}</header>;
}

function LoginCard({ pending, error, onSubmit }: { pending: boolean; error: string; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  return <div className={styles.loginLayout}><aside className={styles.loginIntro}><span><Package/></span><h2>Xaridlaringiz doim yoningizda</h2><p>Kirishdan keyin mehmon savati akkauntingiz bilan xavfsiz birlashtiriladi.</p><ul><li>Buyurtma holatini kuzatish</li><li>Savatni qurilmalar orasida saqlash</li><li>Sevimlilarga tez kirish</li></ul></aside><form className={styles.loginCard} onSubmit={onSubmit}><div className={styles.formTitle}><span><LogIn/></span><div><h2>Kirish</h2><p>Telefon raqamingiz va parolingizni kiriting</p></div></div><label><span>Telefon raqami</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+998901234567" pattern="\+998[0-9]{9}"/></label><label><span>Parol</span><div className={styles.password}><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required minLength={4} placeholder="Parolingiz"/><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Parolni yashirish" : "Parolni ko‘rsatish"}>{showPassword ? <EyeOff/> : <Eye/>}</button></div></label>{error && <p className={styles.error} role="alert">{error}</p>}<Button className={styles.submit} type="submit" loading={pending}>Kirish va savatni birlashtirish</Button><small className={styles.note}>Kirish orqali ma’lumotlaringizni qayta ishlashga rozilik bildirasiz.</small></form></div>;
}

function ProfileNavigation() {
  return <nav className={styles.links} aria-label="Kabinet bo‘limlari">{links.map(({ href, icon: Icon, title, text }) => <Link href={href} key={title}><span><Icon/></span><div><b>{title}</b><small>{text}</small></div><ChevronRight/></Link>)}</nav>;
}

export function ProfileContent() {
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setSession(authService.getSession()); }, []);
  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try { setSession(await authService.login(String(form.get("phone") ?? "").replace(/\s/g, ""), String(form.get("password") ?? ""))); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Kirish amalga oshmadi"); }
    finally { setPending(false); }
  };
  const logout = () => { authService.logout(); setSession(null); };
  if (session === undefined) return <section className={styles.page} role="status"><div className={styles.skeleton}/></section>;
  return <section className={styles.page}><ProfileHero session={session} onLogout={logout}/>{session ? <ProfileNavigation/> : <LoginCard pending={pending} error={error} onSubmit={login}/>}</section>;
}
