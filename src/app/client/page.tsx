"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClientPortalDashboard,
  type ClientDashboardData,
  type DashboardProject,
  type DashboardInvoice,
} from "@/components/portal/client/ClientPortalDashboard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function ClientPortalPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<ClientDashboardData>({
    clientName: "Client workspace",
    projects: [],
    invoices: [],
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClientDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/dashboards/client");
      const d = await res.json();

      let invoices: DashboardInvoice[] = [];
      try {
        const invRes = await apiFetch("/api/invoices");
        const invData = await invRes.json();
        const invList = Array.isArray(invData) ? invData : invData.content || [];
        invoices = invList.map((i: any) => ({
          id: i.id || "",
          invoiceNumber: i.invoiceNumber || "INV",
          projectName: i.projectTitle || "Architecture & Execution",
          outstandingAmount: Number(i.outstandingAmount || 0),
          dueDate: i.dueDate || "Due on receipt",
          status: i.status || "ISSUED",
        }));
      } catch {
        // Tolerant fallback
      }

      const projects: DashboardProject[] = Array.isArray(d.projects)
        ? d.projects.map((p: any) => ({
            id: p.projectId || "",
            name: p.projectTitle || "Studio Project",
            location: "Maharashtra",
            status: p.status || "Under Design",
            updatedAt: new Date().toISOString(),
          }))
        : [];

      setData({
        clientName: d.clientName || "Studio Client",
        projects,
        invoices,
        activities: [
          {
            id: "act-1",
            title: "Project Milestone Updated",
            description: "Phase progress and deliverables updated by Project Architect",
            date: new Date().toISOString(),
            category: "Project",
          },
        ],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load client workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadClientDashboard();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadClientDashboard, router]);

  return (
    <ClientPortalDashboard
      data={data}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadClientDashboard}
      onOpenProjects={() => router.push("/client/projects")}
      onOpenProject={() => router.push("/client/projects")}
      onOpenInvoices={() => router.push("/client/invoices")}
      onOpenInvoice={() => router.push("/client/invoices")}
      onOpenDocuments={() => router.push("/client/documents")}
    />
  );
}
