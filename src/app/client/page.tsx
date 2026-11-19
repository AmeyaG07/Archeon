"use client";

import { ClientPortalDashboard } from "@/components/portal/client/ClientPortalDashboard";

export default function ClientPortalPage() {
  return (
    <ClientPortalDashboard
      data={{
        clientName: "Client workspace",
        projects: [],
        invoices: [],
        activities: [],
        unreadNotifications: 0,
      }}
      onOpenProjects={() => {}}
      onOpenProject={() => {}}
      onOpenInvoices={() => {}}
      onOpenInvoice={() => {}}
      onOpenDocuments={() => {}}
      onOpenNotifications={() => {}}
    />
  );
}
