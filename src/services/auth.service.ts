import type { components } from "@/generated/api-types";
import { validateLoginSuccessResponseDto } from "@/generated/api-validators";
import { apiRequest } from "@/lib/api";
import { clearAccessToken, getAccessToken, rotateGuestSessionId } from "@/lib/access-token";
import { guestService } from "@/services/guest.service";

type LoginSuccess = components["schemas"]["LoginSuccessResponseDto"];
export type AuthSession = { phone: string; verifiedAt: string };

const SESSION_KEY = "elchi_auth_v1";
const validPhone = (phone: string) => /^\+998\d{9}$/.test(phone);

const saveSession = (session: AuthSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("elchi:auth-changed", { detail: session }));
};

export const authService = {
  getSession(): AuthSession | null {
    if (typeof window === "undefined" || !getAccessToken()) return null;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as AuthSession | null;
      return session?.phone && validPhone(session.phone) ? session : null;
    } catch { return null; }
  },
  async login(phone: string, password: string): Promise<AuthSession> {
    if (!validPhone(phone)) throw new Error("Telefon raqamini to‘liq kiriting");
    if (!password) throw new Error("Parolni kiriting");
    const result = await apiRequest<LoginSuccess>("/auth/login", {
      method: "POST",
      body: { phone, password },
      validate: validateLoginSuccessResponseDto,
    });
    await guestService.mergeAfterAuth(result.accessToken);
    const session = { phone, verifiedAt: new Date().toISOString() };
    saveSession(session);
    return session;
  },
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    clearAccessToken();
    rotateGuestSessionId();
    window.dispatchEvent(new CustomEvent("elchi:auth-changed", { detail: null }));
    window.dispatchEvent(new CustomEvent("elchi:guest-merged"));
  },
};
