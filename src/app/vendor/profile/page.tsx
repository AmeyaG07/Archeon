"use client";

import { VendorProfileSettings } from "@/components/portal/vendor/VendorProfileSettings";

export default function VendorProfilePage() {
  return (
    <VendorProfileSettings
      profile={{
        businessName: "Vendor workspace",
        vendorCode: "Access-managed",
        contactPerson: "Vendor contact",
        email: "",
        phone: "",
        businessAddress: "",
      }}
      preferences={{
        projectUpdates: false,
        invoiceUpdates: false,
        paymentUpdates: false,
        disputeUpdates: false,
        studioAnnouncements: false,
        emailNotifications: false,
        whatsappNotifications: false,
      }}
      onSaveProfile={() => {}}
      onSavePreferences={() => {}}
      onChangePassword={() => {}}
      onRequestEmailChange={() => {}}
    />
  );
}
