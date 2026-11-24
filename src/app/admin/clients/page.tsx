"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminClientManagement,
  type AdminClientRecord,
  type AdminClientStatus,
} from "@/components/portal/admin/AdminClientManagement";
import { AdminCreateClientModal } from "@/components/portal/admin/AdminCreateClientModal";
import { AdminEditClientModal } from "@/components/portal/admin/AdminEditClientModal";
import { AdminCreateBillModal } from "@/components/portal/admin/AdminCreateBillModal";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminClientsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [clients, setClients] = useState<AdminClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [selectedBillClient, setSelectedBillClient] = useState<AdminClientRecord | null>(null);
  const [editingClient, setEditingClient] = useState<AdminClientRecord | null>(null);

  const handleDeleteClient = async (clientId: string) => {
    try {
      const res = await apiFetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete client (HTTP ${res.status})`);
      }
      setActionFeedback({
        type: "success",
        message: "Client record successfully deleted from studio registry.",
      });
      await loadClients();
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete client.",
      });
    }
  };

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/clients");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: AdminClientRecord[] = list.map((c: any) => ({
          id: c.id || "",
          reference: c.clientReference || c.reference || "CLI",
          fullName: c.fullName || c.name || "Client",
          email: c.email || "",
          phone: c.phone || "",
          organisation: c.companyName || c.organisation,
          location: c.city ? `${c.city}, ${c.state || ""}` : c.address || "Maharashtra",
          status: (c.status === "ACTIVE"
            ? "Active"
            : c.status === "SUSPENDED"
            ? "Suspended"
            : "Inactive") as AdminClientStatus,
          portalAccess: (c.invitationStatus === "ACCEPTED" || c.hasPortalAccess
            ? "Active"
            : c.invitationStatus === "SENT"
            ? "Invitation Pending"
            : "Not Invited") as any,
          createdAt: c.createdAt || new Date().toISOString(),
          lastUpdated: c.updatedAt || new Date().toISOString(),
          notes: c.notes || c.clientPreferences || c.specifications || "",
          projects: [],
        }));
        setClients(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadClients();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadClients, router]);

  const [actionFeedback, setActionFeedback] = useState<{
    message: string;
    link?: string;
    recipientEmail?: string;
    recipientPhone?: string;
    recipientName?: string;
    type: "success" | "error";
  } | null>(null);

  const handleInviteClient = async (clientId: string) => {
    setActionFeedback(null);
    try {
      const res = await apiFetch(`/api/clients/${clientId}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      const inviteUrl = data.invitationUrl || (data.rawToken ? `/auth/accept-invitation?token=${data.rawToken}` : undefined);
      const targetClient = clients.find((c) => c.id === clientId);
      setActionFeedback({
        type: "success",
        message: `Dual invitation successfully dispatched for client (${data.email || targetClient?.email || "recipient"}).`,
        link: inviteUrl,
        recipientEmail: data.email || targetClient?.email,
        recipientPhone: targetClient?.phone,
        recipientName: targetClient?.fullName,
      });
      await loadClients();
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to issue client invitation.",
      });
    }
  };

  const handleUpdateStatus = async (clientId: string, status: AdminClientStatus) => {
    try {
      await apiFetch(`/api/clients/${clientId}/status`, {
        method: "PATCH",
        body: { status: status.toUpperCase() },
      });
      await loadClients();
    } catch (err: unknown) {
      setActionFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update client status.",
      });
    }
  };

  const handleUpdatePortalAccess = async (clientId: string, action: "resend" | "revoke") => {
    if (action === "resend") {
      await handleInviteClient(clientId);
    } else {
      await handleUpdateStatus(clientId, "Suspended");
    }
  };

  const handleCreatePortalAccount = async (clientId: string, username: string, password: string) => {
    try {
      const res = await apiFetch(`/api/clients/${clientId}/portal-account`, {
        method: "POST",
        body: { username, password },
      });
      const data = await res.json();
      await loadClients();
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
                      href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(actionFeedback.recipientPhone.replace(/[^0-9]/g, ""))}&text=${encodeURIComponent(`Namaste ${actionFeedback.recipientName || "Client"}, Welcome to MB's ArcheOn Design Studio! Your private project portal is ready. Please activate your secure account here: ${actionFeedback.link}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#25D366] hover:bg-[#20ba5a] text-black font-semibold text-xs rounded transition-colors inline-flex items-center gap-1.5"
                    >
                      📱 Send Real WhatsApp (1-Click)
                    </a>
                  )}
                  {actionFeedback.recipientEmail && (
                    <a
                      href={`mailto:${encodeURIComponent(actionFeedback.recipientEmail)}?subject=${encodeURIComponent("ArcheOn Design Studio — Private Portal Invitation")}&body=${encodeURIComponent(`Namaste ${actionFeedback.recipientName || "Client"},\n\nWelcome to MB's ArcheOn Design Studio!\nYour private client portal has been provisioned.\n\nPlease activate your account here:\n${actionFeedback.link}\n\n(This secure link is valid for 7 days)\n\nWarm regards,\nAr. Mandar Bhalekar\nMB's ArcheOn Design Studio`)}`}
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
      <AdminClientManagement
        clients={clients}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadClients}
        onInviteClient={handleInviteClient}
        onUpdateClientStatus={handleUpdateStatus}
        onUpdatePortalAccess={handleUpdatePortalAccess}
        onCreatePortalAccount={handleCreatePortalAccount}
        onOpenProject={(projId) => router.push(`/admin/projects?id=${projId}`)}
        onAddClient={() => setIsCreateModalOpen(true)}
        onAddBill={(client) => {
          setSelectedBillClient(client || null);
          setIsAddBillModalOpen(true);
        }}
        onEditClient={(client) => setEditingClient(client)}
        onDeleteClient={handleDeleteClient}
      />

      <AdminCreateBillModal
        isOpen={isAddBillModalOpen}
        onClose={() => {
          setIsAddBillModalOpen(false);
          setSelectedBillClient(null);
        }}
        onBillCreated={loadClients}
        defaultClientId={selectedBillClient?.id}
      />

      <AdminCreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClientCreated={loadClients}
      />

      <AdminEditClientModal
        client={editingClient}
        isOpen={Boolean(editingClient)}
        onClose={() => setEditingClient(null)}
        onClientUpdated={loadClients}
      />
    </div>
  );
}
