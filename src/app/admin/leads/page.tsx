"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminLeadManagement,
  type AdminLeadRecord,
  type LeadAssignee,
  type LeadStatus,
} from "@/components/portal/admin/AdminLeadManagement";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminLeadsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [leads, setLeads] = useState<AdminLeadRecord[]>([]);
  const [assignees] = useState<LeadAssignee[]>([
    { id: "mandar", name: "Ar. Mandar Bhalekar", active: true },
    { id: "studio_lead", name: "Studio Principal", active: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/leads");
      const list = await res.json();
      if (Array.isArray(list)) {
        const records: AdminLeadRecord[] = list.map((l: any) => ({
          id: l.id || "",
          reference: l.id ? `ENQ-${String(l.id).slice(0, 6).toUpperCase()}` : "ENQ",
          fullName: l.clientName || "Prospective Client",
          email: l.email || "",
          phone: l.phone || "",
          serviceInterest: l.serviceDiscipline || "ARCHITECTURE",
          projectLocation: l.location || "Maharashtra",
          projectDescription: l.projectBrief || "",
          source: "Website",
          status: (l.status === "CONTACTED"
            ? "Contacted"
            : l.status === "QUALIFIED"
            ? "Qualified"
            : l.status === "CONVERTED"
            ? "Converted"
            : l.status === "LOST"
            ? "Lost"
            : "New") as LeadStatus,
          priority: "Normal",
          assignedTo: "Ar. Mandar Bhalekar",
          createdAt: l.createdAt || new Date().toISOString(),
        }));
        setLeads(records);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadLeads();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadLeads, router]);

  const handleUpdateStatus = async (leadId: string, status: LeadStatus) => {
    await apiFetch(`/api/leads/${leadId}/status`, {
      method: "PATCH",
      body: { status: status.toUpperCase() },
    });
    await loadLeads();
  };

  return (
    <div className="p-4 sm:p-8">
      <AdminLeadManagement
        leads={leads}
        assignees={assignees}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadLeads}
        onUpdateStatus={handleUpdateStatus}
        onAssignLead={async () => {}}
        onUpdateFollowUp={async () => {}}
        onConvertLead={async () => {}}
      />
    </div>
  );
}
