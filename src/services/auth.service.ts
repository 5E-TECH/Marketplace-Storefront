import { apiRequest } from "@/lib/api";
import { authHeaders, clearAccessToken, getAccessToken, rotateGuestSessionId } from "@/lib/access-token";
import { guestService } from "@/services/guest.service";

export type AuthSession = { userId?: string; name?: string; phone: string; verifiedAt: string; authenticated: true };
export type RegisterInput = { name: string; phone: string; password: string };
export type ProfileInput = { name: string; phone: string };

const SESSION_KEY = "elchi_auth_v1";
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const notify = (name: string): void => {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") window.dispatchEvent(new CustomEvent(name));
};
const phoneNumber = (value: string): string => {
  const phone = value.replace(/\s/g, "");
  if (!/^\+998\d{9}$/.test(phone)) throw new Error("Telefon raqamini +998XXXXXXXXX formatida kiriting");
  return phone;
};
const validPassword = (value: string, minimum = 4): string => {
  if (value.length < minimum) throw new Error(`Parol kamida ${minimum} ta belgidan iborat bo‘lsin`);
  return value;
};
const saveSession = (session: AuthSession): AuthSession => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notify("elchi:auth-changed");
  return session;
};
const sessionFrom = (value: unknown, fallbackPhone: string, fallbackName?: string): AuthSession => {
  const root = object(value);
  const user = object(root.user ?? root);
  return {
    userId: typeof user.id === "string" || typeof user.id === "number" ? String(user.id) : undefined,
    name: typeof user.name === "string" && user.name.trim() ? user.name.trim() : fallbackName,
    phone: typeof user.phone === "string" && /^\+998\d{9}$/.test(user.phone) ? user.phone : fallbackPhone,
    verifiedAt: new Date().toISOString(),
    authenticated: true,
  };
};
const accessTokenFrom = (value: unknown): string => {
  const token = object(value).accessToken;
  if (typeof token !== "string" || !token) throw new Error("Backend access token qaytarmadi");
  return token;
};

export const authService = {
  getSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as AuthSession | null;
      return session?.authenticated && session.phone ? session : null;
    } catch { return null; }
  },
  async login(phoneValue: string, passwordValue: string): Promise<AuthSession> {
    const phone = phoneNumber(phoneValue);
    const response = await apiRequest<unknown>("/auth/login", { method: "POST", body: { phone, password: validPassword(passwordValue) } });
    await guestService.mergeAfterAuth(accessTokenFrom(response));
    return saveSession(sessionFrom(response, phone));
  },
  async register(input: RegisterInput): Promise<AuthSession> {
    const name = input.name.trim();
    if (name.length < 2) throw new Error("Ismingizni to‘liq kiriting");
    const phone = phoneNumber(input.phone);
    const response = await apiRequest<unknown>("/auth/register", { method: "POST", body: { name, phone, password: validPassword(input.password, 8), role: "BUYER" } });
    await guestService.mergeAfterAuth(accessTokenFrom(response));
    return saveSession(sessionFrom(response, phone, name));
  },
  async forgotPassword(phoneValue: string): Promise<string> {
    const phone = phoneNumber(phoneValue);
    await apiRequest("/auth/forgot-password", { method: "POST", body: { phone } });
    return phone;
  },
  async resetPassword(phoneValue: string, codeValue: string, passwordValue: string): Promise<void> {
    const phone = phoneNumber(phoneValue);
    const code = codeValue.trim();
    if (!/^\d{4,8}$/.test(code)) throw new Error("Tasdiqlash kodini to‘liq kiriting");
    await apiRequest("/auth/reset-password", { method: "POST", body: { phone, code, newPassword: validPassword(passwordValue, 8) } });
  },
  async refreshProfile(): Promise<AuthSession> {
    const current = this.getSession();
    if (!current) throw new Error("Avval akkauntga kiring");
    const response = await apiRequest<unknown>("/auth/me", { method: "GET", headers: authHeaders() });
    return saveSession(sessionFrom(response, current.phone, current.name));
  },
  async updateProfile(input: ProfileInput): Promise<AuthSession> {
    const current = this.getSession();
    if (!current) throw new Error("Avval akkauntga kiring");
    const name = input.name.trim();
    if (name.length < 2) throw new Error("Ismingizni to‘liq kiriting");
    const phone = phoneNumber(input.phone);
    const response = await apiRequest<unknown>("/auth/profile", { method: "PATCH", headers: authHeaders(), body: { name, phone } });
    return saveSession(sessionFrom(response, phone, name));
  },
  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
    clearAccessToken();
    rotateGuestSessionId();
    notify("elchi:auth-changed");
    notify("elchi:guest-merged");
  },
  async logout(): Promise<void> {
    try {
      if (getAccessToken()) await apiRequest("/auth/logout", { method: "POST", headers: authHeaders() });
    } finally {
      this.clearSession();
    }
  },
};
