import { apiRequest } from "@/lib/api";
import { clearAccessToken, rotateGuestSessionId } from "@/lib/access-token";
import { guestService } from "@/services/guest.service";

export type AuthSession = { phone: string; verifiedAt: string; authenticated?: boolean };

const SESSION_KEY = "elchi_auth_v1";
export const authService = {
  getSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as AuthSession | null;
      return session?.phone ? session : null;
    } catch { return null; }
  },
  async login(phone: string, password: string): Promise<AuthSession> {
    if (!/^\+998\d{9}$/.test(phone)) throw new Error("Telefon raqamini +998XXXXXXXXX formatida kiriting");
    if (password.length < 4) throw new Error("Parolni to‘liq kiriting");
    const response = await apiRequest<unknown>("/auth/login", { method: "POST", body: { phone, password } });
    const data = response && typeof response === "object" ? response as Record<string, unknown> : {};
    const accessToken = typeof data.accessToken === "string" ? data.accessToken : "";
    if (!accessToken) throw new Error("Login javobida access token kelmadi");
    await guestService.mergeAfterAuth(accessToken);
    const session = { phone, verifiedAt: new Date().toISOString(), authenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    clearAccessToken();
    rotateGuestSessionId();
    window.dispatchEvent(new CustomEvent("elchi:guest-merged"));
  },
};
