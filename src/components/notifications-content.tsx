"use client";

import { Bell, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { hasAuthSession } from "@/lib/access-token";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { notificationHref, notificationService, type BuyerNotification } from "@/services/notification.service";
import { Button, LoadingGrid, StatePanel } from "./ui";

const PAGE_SIZE = 20;

/** Xaridor bildirishnomalari: qaytarish holati o'zgarganda keladi; bosilsa tegishli sahifa ochiladi. */
export function NotificationsContent() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: BuyerNotification[]; total: number; unreadCount: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async (target: number) => {
    setLoading(true); setError("");
    try { setResult(await notificationService.list(target, PAGE_SIZE)); }
    catch (caught) { setError(errorMessage(caught, "Bildirishnomalarni yuklab bo‘lmadi")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const session = hasAuthSession(); setSignedIn(session); if (session) void load(page); }, [load, page]);

  const markLocal = (predicate: (item: BuyerNotification) => boolean) => setResult((current) => current && {
    ...current,
    items: current.items.map((item) => predicate(item) ? { ...item, isRead: true } : item),
    unreadCount: Math.max(0, current.unreadCount - current.items.filter((item) => predicate(item) && !item.isRead).length),
  });
  const open = async (notification: BuyerNotification) => {
    if (!notification.isRead) {
      markLocal((item) => item.id === notification.id);
      // O'qilgan belgisi yetib bormasa ham sahifa ochilaveradi — keyingi yuklashda tuzaladi.
      await notificationService.markRead(notification.id).catch(() => undefined);
    }
    const href = notificationHref(notification);
    if (href) router.push(href);
  };
  const markAll = async () => {
    try { await notificationService.markAllRead(); markLocal(() => true); }
    catch (caught) { setError(errorMessage(caught, "Bildirishnomalarni o‘qilgan qilib bo‘lmadi")); }
  };

  if (signedIn === false) return <StatePanel headingLevel={1} icon={<Bell/>} title="Akkauntingizga kiring" description="Bildirishnomalar akkauntingizga keladi. Ularni ko‘rish uchun tizimga kiring." action={<Link className="button button--primary" href="/login?next=%2Fprofile%2Fnotifications">Kirish</Link>}/>;
  if (!result && !error) return <LoadingGrid count={3} label="Bildirishnomalar yuklanmoqda"/>;
  if (!result) return <StatePanel headingLevel={1} kind="error" title="Bildirishnomalarni yuklab bo‘lmadi" description={error} action={<Button loading={loading} onClick={() => void load(page)}><RefreshCw/> Qayta urinish</Button>}/>;
  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  return <section className="notifications-page">
    <div className="page-heading"><div><h1>Bildirishnomalar</h1></div><button type="button" onClick={() => void markAll()} disabled={!result.unreadCount}>Barchasini o‘qilgan qilish</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!result.items.length
      ? <StatePanel icon={<Bell/>} title="Bildirishnomalar yo‘q" description="Qaytarish so‘rovingiz holati o‘zgarganda shu yerda xabar olasiz."/>
      : <ul className="notifications-list">{result.items.map((notification) => <li key={notification.id}>
        <button type="button" className={notification.isRead ? "" : "is-unread"} onClick={() => void open(notification)}>
          <b>{notification.title}</b>
          {notification.body && <span>{notification.body}</span>}
          <small>{formatDateTime(notification.createdAt)}</small>
        </button>
      </li>)}</ul>}
    {pages > 1 && <nav className="returns-pagination" aria-label="Sahifalar">
      <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Oldingi</Button>
      <span>{page} / {pages}</span>
      <Button variant="secondary" disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>Keyingi</Button>
    </nav>}
  </section>;
}
