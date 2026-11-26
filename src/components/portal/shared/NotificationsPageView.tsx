"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Check, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  category?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
}

export function NotificationsPageView({ portalLabel }: { portalLabel: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/notifications");
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
      setItems(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        void loadNotifications();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadNotifications, router]);

  const handleMarkRead = async (id: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n)));
    } catch {
      // Ignore transient errors
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await apiFetch("/api/notifications/mark-all-read", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
    } catch {
      // Ignore transient errors
    } finally {
      setActionLoading(false);
    }
  };

  const unreadCount = items.filter((n) => !(n.read ?? n.isRead)).length;

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D8D6D0] pb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
              {portalLabel} / Alerts
            </p>
            <h1 className="mt-2 font-serif text-3xl text-[#171717] md:text-4xl">
              Notifications
            </h1>
            <p className="mt-1 text-xs text-[#77736C]">
              {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadNotifications()}
              disabled={loading || actionLoading}
              className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[#55514A] hover:border-[#171717] disabled:opacity-40"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 bg-[#171717] px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-40"
              >
                <CheckCheck size={12} />
                Mark All Read
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="border border-red-200 bg-red-50 p-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="border border-[#D8D6D0] bg-white p-10 text-center font-mono text-xs text-[#77736C]">
            Loading notifications...
          </div>
        ) : items.length === 0 ? (
          <div className="border border-[#D8D6D0] bg-white p-12 text-center">
            <Bell size={24} className="mx-auto text-[#A58A64]" />
            <h2 className="mt-3 font-serif text-xl text-[#171717]">
              No Notifications Yet
            </h2>
            <p className="mt-1 text-xs text-[#77736C]">
              Project updates, billing alerts, and studio messages will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
            {items.map((item) => {
              const isRead = Boolean(item.read ?? item.isRead);
              return (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-start justify-between gap-4 p-5 ${
                    isRead ? "bg-white" : "bg-[#FAF8F4]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!isRead && <span className="h-2 w-2 rounded-full bg-[#A58A64]" />}
                      <p className="font-serif text-base text-[#171717]">
                        {item.title || "Studio Notification"}
                      </p>
                      {item.category && (
                        <span className="bg-[#F4EFE2] px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#94743F]">
                          {item.category}
                        </span>
                      )}
                    </div>
                    {item.message && (
                      <p className="mt-1.5 text-xs text-[#55514A] leading-relaxed">
                        {item.message}
                      </p>
                    )}
                    {item.createdAt && (
                      <p className="mt-1.5 font-mono text-[10px] text-[#99958D]">
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>

                  {!isRead && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void handleMarkRead(item.id)}
                      className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-white px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#55514A] hover:border-[#171717] disabled:opacity-40"
                    >
                      <Check size={11} />
                      Mark Read
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
