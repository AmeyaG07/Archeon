"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClientNotificationsCentre,
  type ClientNotification,
  type ClientNotificationCategory,
} from "@/components/portal/client/ClientNotificationsCentre";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function ClientNotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/notifications");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: ClientNotification[] = list.map((n: any) => {
          const cat = (n.category || "").toUpperCase();
          let category: ClientNotificationCategory = "Project";
          if (cat.includes("INVOICE")) category = "Invoice";
          else if (cat.includes("PAYMENT")) category = "Payment";
          else if (cat.includes("DISPUTE")) category = "Dispute";
          else if (cat.includes("DOC")) category = "Document";
          else if (cat.includes("ANNOUNCE")) category = "Announcement";

          return {
            id: n.id || "",
            title: n.title || "Notification",
            message: n.message || "",
            category,
            createdAt: n.createdAt || new Date().toISOString(),
            read: !!n.read,
            relatedReference: n.actionUrl,
          };
        });
        setNotifications(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadNotifications();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadNotifications, router]);

  const handleMarkAsRead = async (notificationId: string) => {
    await apiFetch(`/api/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await apiFetch("/api/notifications/mark-all-read", {
      method: "POST",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <ClientNotificationsCentre
      notifications={notifications}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadNotifications}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onOpenNotification={(notif) => {
        if (notif.relatedReference) {
          router.push(notif.relatedReference);
        }
      }}
    />
  );
}
