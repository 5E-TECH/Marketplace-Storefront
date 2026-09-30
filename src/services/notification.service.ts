import { apiRequest } from "@/lib/api";
import { authHeaders, hasAuthSession } from "@/lib/access-token";
import { validateNotificationsPageDto } from "@/generated/api-validators";
import type { NotificationDto, NotificationsPageDto } from "@/types/storefront-api";

export type BuyerNotification = NotificationDto;
/** O'qilgan holati o'zgarganda header hisoblagichi darhol yangilanadi. */
export const NOTIFICATIONS_CHANGED = "elchi:notifications-changed";

const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const changed = () => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED)); };

/** Bildirishnoma bosilganda ochiladigan sahifa. Qaytarish (C4.2): `return_*`, `data.returnId`. */
export const notificationHref = (notification: Pick<NotificationDto, "type" | "data">): string | undefined => {
  if (!notification.type.startsWith("return_")) return undefined;
  const id = object(notification.data).returnId;
  return (typeof id === "string" || typeof id === "number") && String(id).trim() ? `/profile/returns/${encodeURIComponent(String(id))}` : undefined;
};

export const notificationService = {
  async list(page = 1, limit = 20): Promise<NotificationsPageDto> {
    if (!hasAuthSession()) throw new Error("Bildirishnomalarni ko‘rish uchun akkauntingizga kiring");
    return apiRequest("/notifications", { method: "GET", headers: authHeaders(), params: { page, limit }, validate: validateNotificationsPageDto });
  },
  /** Header uchun faqat o'qilmaganlar soni (bitta yozuv bilan). */
  async unreadCount(): Promise<number> {
    if (!hasAuthSession()) return 0;
    return (await notificationService.list(1, 1)).unreadCount;
  },
  async markRead(id: string): Promise<void> {
    const value = id.trim();
    if (!value || value.length > 128) throw new Error("Bildirishnoma raqami noto‘g‘ri");
    await apiRequest(`/notifications/${encodeURIComponent(value)}/read`, { method: "PATCH", headers: authHeaders() });
    changed();
  },
  async markAllRead(): Promise<void> {
    await apiRequest("/notifications/read-all", { method: "PATCH", headers: authHeaders() });
    changed();
  },
};
