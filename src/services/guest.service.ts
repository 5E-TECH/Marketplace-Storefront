import { browserApiRequest } from "@/lib/browser-api-client";
import { rotateGuestSessionId, setAccessToken } from "@/lib/access-token";

export const guestService = {
  async mergeAfterAuth(accessToken: string): Promise<unknown> {
    setAccessToken(accessToken);
    const result = await browserApiRequest<unknown>("/api/guest/merge", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
    rotateGuestSessionId();
    window.dispatchEvent(new CustomEvent("elchi:guest-merged"));
    return result;
  },
};
