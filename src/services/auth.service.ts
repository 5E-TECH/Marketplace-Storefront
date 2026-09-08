export type AuthSession = { phone: string; verifiedAt: string };

const SESSION_KEY = "elchi_auth_v1";
const OTP_CODE = "111111";

export const authService = {
  getSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as AuthSession | null;
      return session?.phone ? session : null;
    } catch { return null; }
  },
  async requestOtp(phone: string): Promise<{ demoCode: string }> {
    if (!/^\+998\d{9}$/.test(phone)) throw new Error("Telefon raqamini to‘liq kiriting");
    // Auth API kelganda POST /auth/request-otp shu yerga ulanadi.
    return { demoCode: OTP_CODE };
  },
  async verifyOtp(phone: string, code: string): Promise<AuthSession> {
    if (!/^\+998\d{9}$/.test(phone)) throw new Error("Telefon raqamini to‘liq kiriting");
    // Auth API kelganda POST /auth/verify-otp shu yerga ulanadi.
    if (code !== OTP_CODE) throw new Error("Tasdiqlash kodi noto‘g‘ri");
    const session = { phone, verifiedAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  logout(): void { localStorage.removeItem(SESSION_KEY); },
};
