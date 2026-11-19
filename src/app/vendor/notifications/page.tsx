"use client";

import { VendorNotificationsCentre } from "@/components/portal/vendor/VendorNotificationsCentre";

export default function VendorNotificationsPage() {
  return (
    <VendorNotificationsCentre
      notifications={[]}
      onOpenNotification={() => {}}
      onMarkAsRead={() => {}}
      onMarkAllAsRead={() => {}}
    />
  );
}
