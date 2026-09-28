import { apiRequest } from "@/lib/api";
import { clearAccessToken, markCookieSession, rotateGuestSessionId, setAccessToken } from "@/lib/access-token";

export const guestService = {
  /** `accessToken: null` — sessiya HttpOnly cookie'da, so'rov cookie bilan ketadi. */
  async mergeAfterAuth(accessToken: string | null): Promise<unknown> {
    // Cookie sessiyada eski token so'rovga Authorization bo'lib qo'shilmasin (aks holda merge 401 va darhol logout).
    if (!accessToken) clearAccessToken();
    const result = await apiRequest<unknown>("/guest/merge", { method: "POST", headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} });
    if (accessToken) setAccessToken(accessToken);
    else markCookieSession();
    rotateGuestSessionId();
    window.dispatchEvent(new CustomEvent("elchi:guest-merged"));
    return result;
  },
};
