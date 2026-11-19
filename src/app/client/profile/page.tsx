"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClientProfileSettings,
  type ClientProfile,
  type ClientProfileUpdate,
} from "@/components/portal/client/ClientProfileSettings";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function ClientProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [profile, setProfile] = useState<ClientProfile>({
    fullName: user?.username || "Studio Client",
    email: "",
    phone: "",
    preferredContact: "Email",
    projectUpdateNotifications: true,
    invoiceNotifications: true,
    disputeNotifications: true,
    announcementNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/clients/me");
      const data = await res.json();
      setProfile({
        fullName: data.fullName || user?.username || "Studio Client",
        email: data.email || "",
        phone: data.phone || "",
        organisation: data.companyName || "",
        preferredContact: "Email",
        projectUpdateNotifications: true,
        invoiceNotifications: true,
        disputeNotifications: true,
        announcementNotifications: false,
      });
    } catch {
      // Fallback with session info
      setProfile((prev) => ({
        ...prev,
        fullName: user?.username || "Studio Client",
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

  const handleSave = async (data: ClientProfileUpdate) => {
    setSaving(true);
    setSuccessMessage(undefined);
    try {
      await apiFetch("/api/clients/me", {
        method: "PUT",
        body: {
          fullName: data.fullName,
          phone: data.phone,
          companyName: data.organisation,
        },
      });
      setSuccessMessage("Profile preferences saved successfully.");
      setProfile((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <ClientProfileSettings
        profile={profile}
        loading={loading}
        saving={saving}
        error={error ?? undefined}
        successMessage={successMessage}
        onSave={handleSave}
        onChangePassword={() => alert("Password reset link will be sent to your registered email.")}
        onRequestEmailChange={() => alert("For security, email change requests must be verified by studio principals.")}
      />
    </div>
  );
}
