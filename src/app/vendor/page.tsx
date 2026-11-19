"use client";

import { VendorPortalDashboard } from "@/components/portal/vendor/VendorPortalDashboard";

export default function VendorPortalPage() {
  return (
    <VendorPortalDashboard
      data={{
        vendorName: "Vendor workspace",
        projects: [],
        invoices: [],
        activities: [],
        unreadNotifications: 0,
      }}
      onOpenProjects={() => {}}
      onOpenProject={() => {}}
      onOpenInvoices={() => {}}
      onOpenInvoice={() => {}}
      onCreateInvoice={() => {}}
      onOpenDocuments={() => {}}
      onOpenNotifications={() => {}}
    />
  );
}
