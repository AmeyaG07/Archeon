"use client";

import { ClientNotificationsCentre } from "@/components/portal/client/ClientNotificationsCentre";

export default function ClientNotificationsPage() {
  return (
    <ClientNotificationsCentre
      notifications={[]}
      onMarkAsRead={() => {}}
      onMarkAllAsRead={() => {}}
      onOpenNotification={() => {}}
    />
  );
}
