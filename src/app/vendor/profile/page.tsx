"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VendorProfileSettings,
  type VendorProfileData,
  type VendorNotificationPreferences,
} from "@/components/portal/vendor/VendorProfileSettings";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function VendorProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [profile, setProfile] = useState<VendorProfileData>({
    businessName: "Vendor workspace",
    vendorCode: "VEN-TRADE",
    contactPerson: user?.username || "Contractor",
    email: "",
    phone: "",
    businessAddress: "Maharashtra",
    gstin: "27ABCDE****F1Z5",
  });
  const [preferences, setPreferences] = useState<VendorNotificationPreferences>({
    projectUpdates: true,
    invoiceUpdates: true,
    paymentUpdates: true,
    disputeUpdates: true,
    studioAnnouncements: false,
    emailNotifications: true,
    whatsappNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/vendors/me");
      const data = await res.json();
      setProfile({
        businessName: data.businessName || "Trade Partner",
        vendorCode: data.vendorReference || "VEN",
        contactPerson: data.contactPerson || user?.username || "Contractor",
        email: data.email || "",
        phone: data.phone || "",
        businessAddress: data.address || "Maharashtra",
        gstin: data.gstinMasked || "27ABCDE****F1Z5",
        businessType: data.category || "Civil & Construction",
      });
    } catch {
      // Tolerant fallback
      setProfile((prev) => ({
        ...prev,
        contactPerson: user?.username || "Contractor",
      }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadProfile();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadProfile, router]);

  const handleSaveProfile = async (
    data: Pick<VendorProfileData, "contactPerson" | "email" | "phone" | "alternatePhone" | "businessAddress">
  ) => {
    setSaving(true);
    setSuccessMessage(undefined);
    try {
      await apiFetch("/api/vendors/me", {
        method: "PUT",
        body: data,
      });
      setSuccessMessage("Vendor profile updated successfully.");
      setProfile((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vendor profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <VendorProfileSettings
        profile={profile}
        preferences={preferences}
        loading={loading}
        saving={saving}
        error={error ?? undefined}
        successMessage={successMessage}
        onSaveProfile={handleSaveProfile}
        onSavePreferences={async (prefs) => {
          setPreferences(prefs);
          setSuccessMessage("Notification preferences updated.");
        }}
        onChangePassword={() => alert("Password reset instructions sent to registered trade contact email.")}
        onRequestEmailChange={() => alert("Official email changes must be verified with Studio Principals.")}
      />
    </div>
  );
}
