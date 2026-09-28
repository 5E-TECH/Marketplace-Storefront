const ACCESS_TOKEN_KEY = "access_token";
/** Cookie sessiya belgisi: backend tokenni tanada bermaganda (`AUTH_TOKENS_IN_BODY=false`). Token emas. */
const COOKIE_SESSION_KEY = "cookie_session";
const LEGACY_ACCESS_TOKEN_KEY = "elchi_access_token";
const GUEST_SESSION_KEY = "guest_session_id";
const LEGACY_SESSION_KEY = "elchi_cart_session_id";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  return token && token.length <= 16_384 && !/\s/.test(token) ? token : null;
};

/** Xaridor tizimga kirganmi: Bearer token yoki HttpOnly cookie sessiya. */
export const hasAuthSession = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(getAccessToken()) || localStorage.getItem(COOKIE_SESSION_KEY) === "1";
};

export const markCookieSession = (): void => {
  // Eski (shu jumladan legacy) token qolsa `sessionHeaders` uni Authorization qilib yuboradi va cookie sessiya 401 bilan yiqiladi.
  clearAccessToken();
  localStorage.setItem(COOKIE_SESSION_KEY, "1");
};

export const authHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const setAccessToken = (token: string): void => {
  if (!token || token.length > 16_384 || /\s/.test(token)) throw new Error("Access token formati noto‘g‘ri");
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.removeItem(COOKIE_SESSION_KEY);
  sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
};

export const clearAccessToken = (): void => {
  localStorage.removeItem(COOKIE_SESSION_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
};

export const getGuestSessionId = (): string => {
  if (typeof window === "undefined") return "";
  const current = localStorage.getItem(GUEST_SESSION_KEY);
  if (current && current.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(current)) return current;
  const legacy = localStorage.getItem(LEGACY_SESSION_KEY);
  if (legacy && legacy.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(legacy)) {
    localStorage.setItem(GUEST_SESSION_KEY, legacy);
    localStorage.removeItem(LEGACY_SESSION_KEY);
    return legacy;
  }
  const created = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(GUEST_SESSION_KEY, created);
  localStorage.removeItem(LEGACY_SESSION_KEY);
  return created;
};

export const rotateGuestSessionId = (): string => {
  localStorage.removeItem(GUEST_SESSION_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
  return getGuestSessionId();
};

export const sessionHeaders = (): HeadersInit => ({ ...authHeaders(), "X-Session-Id": getGuestSessionId() });
