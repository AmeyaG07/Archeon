"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminDashboardOverview,
  type AdminDashboardData,
  type AdminProjectSummary,
  type AdminActivity,
} from "@/components/portal/admin/AdminDashboardOverview";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { PortalDashboardSkeleton } from "@/components/portal/shared/PortalSkeleton";
import { ShieldAlert, LogIn, ArrowRight } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch dashboard metrics & recent activities
      const dashRes = await apiFetch("/api/dashboards/admin");
      const dashData = await dashRes.json();

      // 2. Fetch active projects overview
      let projects: AdminProjectSummary[] = [];
      try {
        const projRes = await apiFetch("/api/operational-projects");
        const projList = await projRes.json();
        if (Array.isArray(projList)) {
          projects = projList.slice(0, 5).map((p: any) => ({
            id: p.id || "",
            reference: p.projectReference || p.id || "PROJ",
            name: p.title || p.name || "Untitled Project",
            clientName: p.clientName || "Studio Client",
            status: (p.status === "COMPLETED"
              ? "Completed"
              : p.status === "DESIGN"
              ? "Under Design"
              : p.status === "EXECUTION"
              ? "Under Execution"
              : p.status === "ON_HOLD"
              ? "On Hold"
              : "Planning") as any,
            progressPercentage: p.progressPercentage || 0,
            updatedAt: p.updatedAt || new Date().toISOString(),
          }));
        }
      } catch {
        // Tolerant fallback
      }

      // 3. Map recent activities
      const activities: AdminActivity[] = Array.isArray(dashData.recentActivities)
        ? dashData.recentActivities.map((act: any) => ({
            id: act.eventId || String(Math.random()),
            type: (act.entityName?.toLowerCase().includes("invoice")
              ? "invoice"
              : act.entityName?.toLowerCase().includes("project")
              ? "project"
              : act.entityName?.toLowerCase().includes("client")
              ? "client"
              : act.entityName?.toLowerCase().includes("vendor")
              ? "vendor"
              : act.entityName?.toLowerCase().includes("approval")
              ? "approval"
              : "system") as any,
            title: act.action || "System Event",
            description: act.summary || `${act.action} by ${act.actor || "user"}`,
            actorName: act.actor || "Studio Staff",
            occurredAt: act.timestamp || new Date().toISOString(),
          }))
        : [];

      setData({
        metrics: {
          activeProjects: Number(dashData.activeProjectsCount || 0),
          completedProjects: Number(dashData.completedProjectsCount || 0),
          totalClients: Number(dashData.totalClientsCount || 0),
          activeVendors: Number(dashData.totalVendorsCount || 0),
          newEnquiries: Number(dashData.newLeadsCount || 0),
          pendingApprovals: Number(dashData.pendingApprovalsCount || 0),
          outstandingReceivables: Number(dashData.totalReceivables || 0),
          overdueReceivables: Number(dashData.overdueReceivables || 0),
          pendingInvoices: Number(dashData.pendingCashSettlementsCount || 0),
        },
        projects,
        activities,
        lastUpdatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadDashboard();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, loadDashboard]);

  if (authLoading) {
    return <PortalDashboardSkeleton label="Validating Session..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#D8D6D0] p-8 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 border border-[#D8D6D0] flex items-center justify-center text-[#A58A64]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl text-[#111111]">Studio Session Required</h2>
          <p className="mt-3 text-xs text-[#77736C] leading-relaxed">
            The studio administrative portal requires an authenticated session. Financial records, approvals, and operational projects are protected by RBAC.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#111111] hover:bg-[#25221D] text-white text-xs font-mono uppercase tracking-widest transition-all"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In to Studio <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboardOverview
      data={data}
      loading={loading}
      error={error ?? undefined}
      onRefresh={loadDashboard}
      onOpenProjects={() => router.push("/admin/projects")}
      onOpenEnquiries={() => router.push("/admin/leads")}
      onOpenFinance={() => router.push("/admin/finance-reports")}
      onOpenProject={(id) => router.push(`/admin/projects?id=${id}`)}
    />
  );
}
