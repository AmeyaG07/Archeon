"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminVendorManagement,
  type AdminVendorRecord,
  type AdminVendorStatus,
} from "@/components/portal/admin/AdminVendorManagement";
import { AdminCreateVendorModal } from "@/components/portal/admin/AdminCreateVendorModal";
import { AdminEditVendorModal } from "@/components/portal/admin/AdminEditVendorModal";
import { AdminVendorPaymentSettingsModal } from "@/components/portal/admin/AdminVendorPaymentSettingsModal";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminVendorsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [vendors, setVendors] = useState<AdminVendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<AdminVendorRecord | null>(null);
  const [paymentSettingsVendor, setPaymentSettingsVendor] = useState<AdminVendorRecord | null>(null);

  const handleDeleteVendor = async (vendorId: string) => {
    try {
      const res = await apiFetch(`/api/vendors/${vendorId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete vendor (HTTP ${res.status})`);
      }
      setActionFeedback({
        type: "success",
        message: "Vendor record successfully deleted from studio registry.",
      });
      await loadVendors();
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete vendor.",
      });
    }
  };

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/vendors");
      const list = await res.json();

      // Fetch vendors directory with billing totals & associated clients
      let billingDirectory: any[] = [];
      try {
        const bRes = await apiFetch("/api/billing/vendors-directory");
        billingDirectory = await bRes.json();
      } catch (bErr) {
        console.warn("Could not load billing directory:", bErr);
      }

      const billingMap = new Map<string, any>();
      if (Array.isArray(billingDirectory)) {
        billingDirectory.forEach((b) => {
          if (b.vendorId) billingMap.set(b.vendorId, b);
          if (b.vendorReference) billingMap.set(b.vendorReference, b);
        });
      }

      if (Array.isArray(list)) {
        const records: AdminVendorRecord[] = list.map((v: any) => {
          const bInfo = billingMap.get(v.id) || billingMap.get(v.vendorReference) || {};
          return {
            id: v.id || "",
            reference: v.vendorReference || v.reference || "VEN",
            businessName: v.businessName || v.name || "Vendor",
            contactPerson: v.contactPerson || v.contactName || "Contact Person",
            email: v.email || "",
            phone: v.phone || "",
            vendorCategory: v.category || v.tradeDiscipline || bInfo.tradeCategory || "Civil Contractor",
            location: v.city ? `${v.city}, ${v.state || ""}` : v.address || "Maharashtra",
            status: (v.status === "ACTIVE"
              ? "Active"
              : v.status === "SUSPENDED"
              ? "Suspended"
              : "Inactive") as AdminVendorStatus,
            portalAccess: (v.invitationStatus === "ACCEPTED" || v.hasPortalAccess
              ? "Active"
              : v.invitationStatus === "SENT"
              ? "Invitation Pending"
              : "Not Invited") as any,
            linkedProjects: [],
            submittedInvoiceCount: bInfo.activeBillsCount || 0,
            outstandingInvoiceCount: 0,
            totalBilledAmount: bInfo.totalBilledAmount || 0,
            totalSettledAmount: bInfo.totalSettledAmount || 0,
            associatedClients: bInfo.associatedClients || [],
            createdAt: v.createdAt || new Date().toISOString(),
            lastUpdated: v.updatedAt || new Date().toISOString(),
          };
        });
        setVendors(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadVendors();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadVendors, router]);

  const [actionFeedback, setActionFeedback] = useState<{
    message: string;
    link?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    recipientName?: string;
    type: "success" | "error";
  } | null>(null);

  const handleInviteVendor = async (vendorId: string) => {
    setActionFeedback(null);
    try {
      const res = await apiFetch(`/api/vendors/${vendorId}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      const inviteUrl = data.invitationUrl || (data.rawToken ? `/auth/accept-invitation?token=${data.rawToken}` : undefined);
      const targetVendor = vendors.find((v) => v.id === vendorId);
      setActionFeedback({
        type: "success",
        message: `Dual invitation successfully dispatched for vendor (${data.email || targetVendor?.email || "recipient"}).`,
        link: inviteUrl,
        recipientEmail: data.email || targetVendor?.email,
        recipientPhone: targetVendor?.phone,
        recipientName: targetVendor?.businessName,
      });
      await loadVendors();
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to issue vendor invitation.",
      });
    }
  };

  const handleUpdateStatus = async (vendorId: string, status: AdminVendorStatus) => {
    try {
      await apiFetch(`/api/vendors/${vendorId}/status`, {
        method: "PATCH",
        body: { status: status.toUpperCase() },
      });
      await loadVendors();
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update vendor status.",
      });
    }
  };

  const handleUpdatePortalAccess = async (vendorId: string, action: "resend" | "revoke") => {
    if (action === "resend") {
      await handleInviteVendor(vendorId);
    } else {
      await handleUpdateStatus(vendorId, "Suspended");
    }
  };

  const handleCreatePortalAccount = async (vendorId: string, username: string, password: string) => {
    try {
      const res = await apiFetch(`/api/vendors/${vendorId}/portal-account`, {
        method: "POST",
        body: { username, password },
      });
      const data = await res.json();
      await loadVendors();
      return data;
    } catch (err: unknown) {
      throw err;
    }
  };

  return (
    <div className="p-4 sm:p-8">
      {actionFeedback && (
        <div
          className={`mb-6 p-4 rounded text-sm font-mono flex items-center justify-between ${
            actionFeedback.type === "success"
              ? "bg-[#25221D] text-[#E0D8C3] border border-[#d97706]/40"
              : "bg-red-950/40 text-red-300 border border-red-800"
          }`}
        >
          <div className="flex-1 pr-4">
            <p className="font-semibold">{actionFeedback.message}</p>
            {actionFeedback.link && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-stone-300 break-all select-all">
                  Activation Link: <span className="text-[#d97706] font-mono">{actionFeedback.link}</span>
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(actionFeedback.link!);
                      alert("Activation link copied to clipboard!");
                    }}
                    className="px-3 py-1 bg-stone-700 hover:bg-stone-600 text-white text-xs rounded transition-colors inline-flex items-center gap-1.5"
                  >
                    📋 Copy Link
                  </button>
                  {actionFeedback.recipientPhone && (
                    <a
                      href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(actionFeedback.recipientPhone.replace(/[^0-9]/g, ""))}&text=${encodeURIComponent(`Namaste ${actionFeedback.recipientName || "Trade Partner"}, Welcome to MB's ArcheOn Design Studio! Your contractor portal is ready. Please activate your secure account here: ${actionFeedback.link}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#25D366] hover:bg-[#20ba5a] text-black font-semibold text-xs rounded transition-colors inline-flex items-center gap-1.5"
                    >
                      📱 Send Real WhatsApp (1-Click)
                    </a>
                  )}
                  {actionFeedback.recipientEmail && (
                    <a
                      href={`mailto:${encodeURIComponent(actionFeedback.recipientEmail)}?subject=${encodeURIComponent("ArcheOn Design Studio — Contractor Portal Invitation")}&body=${encodeURIComponent(`Namaste ${actionFeedback.recipientName || "Trade Partner"},\n\nWelcome to MB's ArcheOn Design Studio!\nYour trade contractor portal has been provisioned.\n\nPlease activate your account here:\n${actionFeedback.link}\n\n(This secure link is valid for 7 days)\n\nWarm regards,\nAr. Mandar Bhalekar\nMB's ArcheOn Design Studio`)}`}
                      className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white text-xs rounded transition-colors inline-flex items-center gap-1.5"
                    >
                      ✉️ Open Email App
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 italic pt-1">
                  💡 Note: Local environment runs in safe sandbox mode without external SMTP/Meta API credentials. Use the 1-click WhatsApp button or the direct link to activate the account.
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-stone-400 hover:text-white text-xs uppercase ml-4"
          >
            Dismiss
          </button>
        </div>
      )}
      <AdminVendorManagement
        vendors={vendors}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadVendors}
        onInviteVendor={handleInviteVendor}
        onUpdateVendorStatus={handleUpdateStatus}
        onUpdatePortalAccess={handleUpdatePortalAccess}
        onCreatePortalAccount={handleCreatePortalAccount}
        onOpenProject={(projId) => router.push(`/admin/projects?id=${projId}`)}
        onOpenInvoices={() => router.push("/admin/approvals")}
        onAddVendor={() => setIsCreateModalOpen(true)}
        onEditVendor={(vendor) => setEditingVendor(vendor)}
        onManagePaymentSettings={(vendor) => setPaymentSettingsVendor(vendor)}
        onDeleteVendor={handleDeleteVendor}
      />

      <AdminCreateVendorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onVendorCreated={loadVendors}
      />

      <AdminEditVendorModal
        vendor={editingVendor}
        isOpen={Boolean(editingVendor)}
        onClose={() => setEditingVendor(null)}
        onVendorUpdated={loadVendors}
      />

      <AdminVendorPaymentSettingsModal
        vendor={paymentSettingsVendor}
        isOpen={Boolean(paymentSettingsVendor)}
        onClose={() => setPaymentSettingsVendor(null)}
        onSettingsSaved={loadVendors}
      />
    </div>
  );
}
