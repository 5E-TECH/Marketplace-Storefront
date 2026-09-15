"use client";

import { Eye, EyeOff, KeyRound, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { authService } from "@/services/auth.service";
import { Button } from "./ui";
import styles from "./profile-content.module.css";

type Mode = "login" | "register" | "forgot";

function PasswordField({ name, label, autoComplete = "current-password", minimum = 4 }: { name: string; label: string; autoComplete?: string; minimum?: number }) {
  const [visible, setVisible] = useState(false);
  return <label><span>{label}</span><div className={styles.password}><input name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required minLength={minimum} placeholder="Parolingiz"/><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Parolni yashirish" : "Parolni ko‘rsatish"}>{visible ? <EyeOff/> : <Eye/>}</button></div></label>;
}

const authCopy = {
  login: { icon: LogIn, title: "Akkauntga kirish", text: "Telefon raqamingiz va parolingizni kiriting" },
  register: { icon: UserPlus, title: "Akkaunt ochish", text: "Buyurtmalaringizni bir joyda saqlang" },
  forgot: { icon: KeyRound, title: "Parolni tiklash", text: "Telefoningizga yuborilgan kod orqali yangi parol o‘rnating" },
} as const;

export function AuthContent({ mode, returnTo = "/profile" }: { mode: Mode; returnTo?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const copy = authCopy[mode];
  const Icon = copy.icon;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        await authService.login(String(form.get("phone") ?? ""), String(form.get("password") ?? ""));
        router.replace(returnTo);
      } else if (mode === "register") {
        const first = String(form.get("password") ?? "");
        if (first !== String(form.get("passwordConfirm") ?? "")) throw new Error("Parollar bir xil emas");
        await authService.register({ name: String(form.get("name") ?? ""), phone: String(form.get("phone") ?? ""), password: first });
        router.replace("/profile");
      } else if (!resetPhone) {
        setResetPhone(await authService.forgotPassword(String(form.get("phone") ?? "")));
        setMessage("Tasdiqlash kodi telefon raqamingizga yuborildi.");
      } else {
        await authService.resetPassword(resetPhone, String(form.get("code") ?? ""), String(form.get("newPassword") ?? ""));
        setMessage("Parol yangilandi. Endi yangi parol bilan kirishingiz mumkin.");
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "So‘rovni bajarib bo‘lmadi"); }
    finally { setPending(false); }
  };

  return <section className={styles.page}><div className={styles.authShell}><aside className={styles.loginIntro}><span><Icon/></span><h1>{copy.title}</h1><p>{copy.text}</p><ul><li>Kirish xarid qilish uchun majburiy emas</li><li>Mehmon savati kirgandan keyin birlashtiriladi</li><li>Buyurtmalar va profilga tez kirish</li></ul></aside><form className={styles.loginCard} onSubmit={submit}><div className={styles.formTitle}><span><Icon/></span><div><h2>{copy.title}</h2><p>{copy.text}</p></div></div>
    {mode === "register" && <label><span>Ism</span><input name="name" autoComplete="name" required minLength={2} placeholder="Ismingiz"/></label>}
    {(mode !== "forgot" || !resetPhone) && <label><span>Telefon raqami</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="+998901234567" pattern="\+998[0-9]{9}"/></label>}
    {mode === "login" && <PasswordField name="password" label="Parol"/>}
    {mode === "register" && <><PasswordField name="password" label="Parol" autoComplete="new-password" minimum={8}/><PasswordField name="passwordConfirm" label="Parolni takrorlang" autoComplete="new-password" minimum={8}/></>}
    {mode === "forgot" && resetPhone && <><label><span>Tasdiqlash kodi</span><input name="code" inputMode="numeric" autoComplete="one-time-code" required minLength={4} maxLength={8} pattern="[0-9]{4,8}" placeholder="123456"/></label><PasswordField name="newPassword" label="Yangi parol" autoComplete="new-password" minimum={8}/></>}
    {error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.success} role="status">{message}</p>}
    <Button className={styles.submit} type="submit" loading={pending}>{mode === "login" ? "Kirish" : mode === "register" ? "Ro‘yxatdan o‘tish" : resetPhone ? "Parolni yangilash" : "Kod yuborish"}</Button>
    <nav className={styles.authLinks} aria-label="Akkaunt amallari">{mode !== "login" && <Link href="/login">Kirish</Link>}{mode !== "register" && <Link href="/register">Akkaunt ochish</Link>}{mode !== "forgot" && <Link href="/forgot-password">Parolni unutdingizmi?</Link>}</nav>
  </form></div></section>;
}
