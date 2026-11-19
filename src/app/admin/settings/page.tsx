"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AdminSystemSettings,
  type AdminSystemSettingsData,
  type SystemSettingsHistoryEntry,
  type SystemSettingsChangeRequest,
} from "@/components/portal/admin/AdminSystemSettings";
import { useAuth } from "@/providers/AuthProvider";

const DEFAULT_SETTINGS: AdminSystemSettingsData = {
  version: "1.0.0-PROD",
  updatedAt: new Date().toISOString(),
  updatedBy: "Ar. Mandar Bhalekar",
  financial: {
    highValueThreshold: 100000,
    currency: "INR",
    makerCheckerEnabled: true,
    requireSeparateApprovers: true,
    preventPaymentSplitting: true,
  },
  notifications: {
    whatsappEnabled: true,
    quietHoursEnabled: true,
    quietHoursStart: "20:00",
    quietHoursEnd: "09:00",
    reminderIntervalCalendarDays: 3,
    requireWhatsAppOptIn: true,
    suppressPaidInvoices: true,
    suppressDisputedInvoices: true,
    suppressOptOutContacts: true,
  },
  portalAccess: {
    clientSelfRegistration: false,
    vendorSelfRegistration: false,
    invitationOnlyAccess: true,
    invitationExpiryHours: 72,
    requireEmailVerification: true,
  },
  security: {
    sessionTimeoutMinutes: 60,
    maxFailedLoginAttempts: 5,
    accountLockoutMinutes: 30,
    requireStrongPasswords: true,
    auditLoggingEnabled: true,
  },
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [settings] = useState<AdminSystemSettingsData>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<SystemSettingsHistoryEntry[]>([
    {
      id: "hist-1",
      section: "financial",
      description: "High-value dual-approval threshold set to ₹1,00,000",
      changedBy: "Ar. Mandar Bhalekar",
      changedAt: new Date().toISOString(),
      status: "Applied",
      reason: "Governance policy configuration",
    },
  ]);

  if (authLoading) return null;
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleSubmitChange = async (request: SystemSettingsChangeRequest) => {
    setHistory((prev) => [
      {
        id: `hist-${Date.now()}`,
        section: request.section,
        description: `Configuration change in ${request.section}`,
        changedBy: "Studio Principal",
        changedAt: new Date().toISOString(),
        status: "Applied",
        reason: request.reason,
      },
      ...prev,
    ]);
  };

  return (
    <div className="p-4 sm:p-8">
      <AdminSystemSettings
        settings={settings}
        history={history}
        canManageFinancialSettings={true}
        canManageNotificationSettings={true}
        canManagePortalSettings={true}
        canManageSecuritySettings={true}
        onSubmitChange={handleSubmitChange}
      />
    </div>
  );
}
