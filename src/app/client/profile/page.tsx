"use client";

import { ClientProfileSettings } from "@/components/portal/client/ClientProfileSettings";

export default function ClientProfilePage() {
  return (
    <ClientProfileSettings
      profile={{
        fullName: "Client workspace",
        email: "",
        phone: "",
        preferredContact: "Email",
        projectUpdateNotifications: false,
        invoiceNotifications: false,
        disputeNotifications: false,
        announcementNotifications: false,
      }}
      onSave={() => {}}
      onChangePassword={() => {}}
      onRequestEmailChange={() => {}}
    />
  );
}
