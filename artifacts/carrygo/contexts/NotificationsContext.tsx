import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: string | null;
  read: boolean;
  createdAt: number;
};

export type UnreadCounts = {
  notifications: number;
  chats: number;
  requests: number;
};

type Ctx = {
  notifications: AppNotification[];
  counts: UnreadCounts;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsCtx = createContext<Ctx | null>(null);

type ApiNotification = {
  id: string; type: string; title: string; body: string;
  data?: string | null; read: boolean; createdAt: string;
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [counts, setCounts] = useState<UnreadCounts>({ notifications: 0, chats: 0, requests: 0 });

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setCounts({ notifications: 0, chats: 0, requests: 0 });
      return;
    }
    try {
      const [list, c] = await Promise.all([
        apiFetch<ApiNotification[]>("GET", "/api/notifications"),
        apiFetch<UnreadCounts>("GET", "/api/notifications/unread-count"),
      ]);
      setNotifications(
        list.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
          read: n.read,
          createdAt: Date.parse(n.createdAt),
        })),
      );
      setCounts(c);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const id = setInterval(() => refresh().catch(() => {}), 10000);
    return () => clearInterval(id);
  }, [refresh, user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await apiFetch("POST", "/api/notifications/read-all");
    setNotifications((cur) => cur.map((n) => ({ ...n, read: true })));
    setCounts((c) => ({ ...c, notifications: 0 }));
  }, [user]);

  const value = useMemo(() => ({ notifications, counts, refresh, markAllRead }), [notifications, counts, refresh, markAllRead]);

  return <NotificationsCtx.Provider value={value}>{children}</NotificationsCtx.Provider>;
}

export function useNotifications(): Ctx {
  const ctx = useContext(NotificationsCtx);
  if (!ctx) throw new Error("useNotifications must be inside NotificationsProvider");
  return ctx;
}
