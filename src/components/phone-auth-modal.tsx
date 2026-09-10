"use client";

import { LockKeyhole, Phone, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { authService, type AuthSession } from "@/services/auth.service";
import { Button } from "./ui";

export function PhoneAuthModal({ onVerified, onClose }: { onVerified: (session: AuthSession) => void; onClose: () => void }) {
  const [digits, setDigits] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const phone = `+998${digits}`;

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");
    try { onVerified(await authService.login(phone, password)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Tizimga kirib bo‘lmadi"); }
    finally { setPending(false); }
  };

  return <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <div className="auth-modal">
      <button className="auth-close" onClick={onClose} aria-label="Yopish"><X/></button>
      <div className="auth-logo"><LockKeyhole/> elchi<span>ID</span></div>
      <form onSubmit={login} data-testid="login-form">
        <span className="auth-icon"><Phone/></span>
        <h2 id="auth-title">Tizimga kirish</h2>
        <p>Mehmon savatingiz akkauntingizga avtomatik qo‘shiladi.</p>
        <label className="phone-field"><span>+998</span><input autoFocus inputMode="numeric" autoComplete="tel-national" value={digits} onChange={(event) => setDigits(event.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="90 123 45 67" aria-label="Telefon raqami"/></label>
        <label className="auth-password"><span>Parol</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-label="Parol"/></label>
        {error && <small className="auth-error" role="alert">{error}</small>}
        <Button disabled={pending || digits.length !== 9 || !password} type="submit">{pending ? "Savat birlashtirilmoqda..." : "Kirish"}</Button>
        <small className="auth-policy">Kirish tugagach, shu brauzerda mehmon sifatida tanlagan mahsulotlaringiz saqlanadi.</small>
      </form>
    </div>
  </div>;
}
