const ACCESS_TOKEN_KEY = "access_token";
const LEGACY_ACCESS_TOKEN_KEY = "elchi_access_token";
const GUEST_SESSION_KEY = "guest_session_id";
const LEGACY_SESSION_KEY = "elchi_cart_session_id";

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ?? localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  return token && token.length <= 16_384 && !/\s/.test(token) ? token : null;
};

export const authHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const setAccessToken = (token: string): void => {
  if (!token || token.length > 16_384 || /\s/.test(token)) throw new Error("Access token formati noto‘g‘ri");
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
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
