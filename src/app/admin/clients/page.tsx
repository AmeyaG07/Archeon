"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminClientManagement,
  type AdminClientRecord,
  type AdminClientStatus,
} from "@/components/portal/admin/AdminClientManagement";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminClientsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [clients, setClients] = useState<AdminClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleInviteClient = async (clientId: string) => {
    await apiFetch(`/api/invitations/client/${clientId}`, {
      method: "POST",
    }).catch(async () => {
      // Fallback: send invitation via generic endpoint
      await apiFetch("/api/invitations/send", {
        method: "POST",
        body: { targetId: clientId, type: "CLIENT" },
      });
    });
    await loadClients();
  };

  const handleUpdateStatus = async (clientId: string, status: AdminClientStatus) => {
    await apiFetch(`/api/clients/${clientId}`, {
      method: "PUT",
      body: { status: status.toUpperCase() },
    });
    await loadClients();
  };

  const handleUpdatePortalAccess = async (clientId: string, action: "resend" | "revoke") => {
    if (action === "resend") {
      await handleInviteClient(clientId);
    } else {
      await handleUpdateStatus(clientId, "Suspended");
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <AdminClientManagement
        clients={clients}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadClients}
        onInviteClient={handleInviteClient}
        onUpdateClientStatus={handleUpdateStatus}
        onUpdatePortalAccess={handleUpdatePortalAccess}
        onOpenProject={(projId) => router.push(`/admin/projects?id=${projId}`)}
      />
    </div>
  );
}
