"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminVendorManagement,
  type AdminVendorRecord,
  type AdminVendorStatus,
} from "@/components/portal/admin/AdminVendorManagement";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminVendorsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [vendors, setVendors] = useState<AdminVendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/vendors");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: AdminVendorRecord[] = list.map((v: any) => ({
          id: v.id || "",
          reference: v.vendorReference || v.reference || "VEN",
          businessName: v.businessName || v.name || "Vendor",
          contactPerson: v.contactPerson || v.contactName || "Contact Person",
          email: v.email || "",
          phone: v.phone || "",
          vendorCategory: v.category || v.tradeDiscipline || "Civil Contractor",
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
          submittedInvoiceCount: 0,
          outstandingInvoiceCount: 0,
          createdAt: v.createdAt || new Date().toISOString(),
          lastUpdated: v.updatedAt || new Date().toISOString(),
        }));
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

  const [actionFeedback, setActionFeedback] = useState<{ message: string; link?: string; type: "success" | "error" } | null>(null);

  const handleInviteVendor = async (vendorId: string) => {
    setActionFeedback(null);
    try {
      const res = await apiFetch(`/api/vendors/${vendorId}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      const inviteUrl = data.invitationUrl || (data.rawToken ? `/auth/accept-invitation?token=${data.rawToken}` : undefined);
      setActionFeedback({
        type: "success",
        message: `Dual invitation successfully dispatched for vendor (${data.email || "recipient"}).`,
        link: inviteUrl,
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
          <div>
            <p className="font-semibold">{actionFeedback.message}</p>
            {actionFeedback.link && (
              <p className="mt-1 text-xs text-stone-400 break-all select-all">
                Activation Link: <span className="text-[#d97706]">{actionFeedback.link}</span>
              </p>
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
        onOpenProject={(projId) => router.push(`/admin/projects?id=${projId}`)}
        onOpenInvoices={() => router.push("/admin/approvals")}
      />
    </div>
  );
}
