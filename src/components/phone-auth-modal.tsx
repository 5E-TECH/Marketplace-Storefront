"use client";

import { ArrowLeft, CheckCircle2, LockKeyhole, Phone, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { authService, type AuthSession } from "@/services/auth.service";
import { Button } from "./ui";

export function PhoneAuthModal({ onVerified, onClose }: { onVerified: (session: AuthSession) => void; onClose: () => void }) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [digits, setDigits] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(60);
  const codeInput = useRef<HTMLInputElement>(null);
  const phone = `+998${digits}`;
  useEffect(() => {
    if (step !== "otp" || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearInterval(timer);
  }, [seconds, step]);
  useEffect(() => { if (step === "otp") codeInput.current?.focus(); }, [step]);
  const requestCode = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try { await authService.requestOtp(phone); setStep("otp"); setSeconds(60); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Kod yuborilmadi"); }
    finally { setPending(false); }
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try { onVerified(await authService.verifyOtp(phone, code)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Kod tasdiqlanmadi"); }
    finally { setPending(false); }
  };
  return <div className="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="auth-modal"><button className="auth-close" onClick={onClose} aria-label="Yopish"><X/></button><div className="auth-logo"><LockKeyhole/> elchi<span>ID</span></div>{step === "phone" ? <form onSubmit={requestCode}><span className="auth-icon"><Phone/></span><h2 id="auth-title">Xaridni davom ettirish</h2><p>Buyurtmalar va yetkazish holatini saqlash uchun telefon raqamingizni tasdiqlang.</p><label className="phone-field"><span>+998</span><input autoFocus inputMode="numeric" autoComplete="tel-national" value={digits} onChange={(event) => setDigits(event.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="90 123 45 67"/></label>{error && <small className="auth-error">{error}</small>}<Button disabled={pending || digits.length !== 9} type="submit">{pending ? "Yuborilmoqda..." : "Kodni olish"}</Button><small className="auth-policy">Davom etib, shaxsiy ma’lumotlarni qayta ishlash va foydalanish shartlariga rozilik bildirasiz.</small></form> : <form onSubmit={verify}><button type="button" className="auth-back" onClick={() => { setStep("phone"); setCode(""); setError(""); }}><ArrowLeft/> Raqamni o‘zgartirish</button><span className="auth-icon auth-icon--success"><CheckCircle2/></span><h2 id="auth-title">SMS kodni kiriting</h2><p><b>{phone}</b> uchun demo kodni kiriting. SMS yuborilmaydi.</p><input ref={codeInput} className="otp-input" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="• • • • • •"/>{error && <small className="auth-error">{error}</small>}<div className="demo-code">Demo tasdiqlash kodi: <b>111111</b></div><Button disabled={pending || code.length !== 6} type="submit">{pending ? "Tekshirilmoqda..." : "Tasdiqlash"}</Button><button className="resend-code" type="button" disabled={pending || seconds > 0} onClick={requestCode}>{seconds > 0 ? `Kodni qayta yuborish (${seconds}s)` : "Kodni qayta yuborish"}</button></form>}</div></div>;
}
