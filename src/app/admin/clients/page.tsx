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
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminClientsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [clients, setClients] = useState<AdminClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const [actionFeedback, setActionFeedback] = useState<{ message: string; link?: string; type: "success" | "error" } | null>(null);

  const handleInviteClient = async (clientId: string) => {
    setActionFeedback(null);
    try {
      const res = await apiFetch(`/api/clients/${clientId}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      const inviteUrl = data.invitationUrl || (data.rawToken ? `/auth/accept-invitation?token=${data.rawToken}` : undefined);
      setActionFeedback({
        type: "success",
        message: `Dual invitation successfully dispatched for client (${data.email || "recipient"}).`,
        link: inviteUrl,
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
        onEditClient={(client) => setEditingClient(client)}
        onDeleteClient={handleDeleteClient}
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
