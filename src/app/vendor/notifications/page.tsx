"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VendorNotificationsCentre,
  type VendorNotificationRecord,
  type VendorNotificationCategory,
  type VendorNotificationPriority,
} from "@/components/portal/vendor/VendorNotificationsCentre";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function VendorNotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState<VendorNotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/notifications");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: VendorNotificationRecord[] = list.map((n: any) => {
          const cat = (n.category || "").toUpperCase();
          let category: VendorNotificationCategory = "Project";
          if (cat.includes("INVOICE")) category = "Invoice";
          else if (cat.includes("PAYMENT")) category = "Payment";
          else if (cat.includes("DISPUTE")) category = "Dispute";
          else if (cat.includes("ANNOUNCE")) category = "Announcement";

          const priority: VendorNotificationPriority = "Normal";

          return {
            id: n.id || "",
            title: n.title || "Notification",
            message: n.message || "",
            category,
            priority,
            createdAt: n.createdAt || new Date().toISOString(),
            isRead: !!n.read,
            actionLabel: "View Details",
            relatedReference: n.actionUrl,
            actionTarget: n.actionUrl,
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
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await apiFetch("/api/notifications/mark-all-read", {
      method: "POST",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="p-4 sm:p-8">
      <VendorNotificationsCentre
        notifications={notifications}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadNotifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onOpenNotification={(n) => {
          if (n.actionTarget) router.push(n.actionTarget);
        }}
      />
    </div>
  );
}
