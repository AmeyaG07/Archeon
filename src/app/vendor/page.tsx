"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VendorPortalDashboard,
  type VendorDashboardData,
  type VendorDashboardProject,
  type VendorDashboardInvoice,
} from "@/components/portal/vendor/VendorPortalDashboard";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function VendorPortalPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<VendorDashboardData>({
    vendorName: "Vendor workspace",
    projects: [],
    invoices: [],
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVendorDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/dashboards/vendor");
      const d = await res.json();

      let invoices: VendorDashboardInvoice[] = [];
      try {
        const appRes = await apiFetch("/api/approvals");
        const appList = await appRes.json();
        if (Array.isArray(appList)) {
          invoices = appList.slice(0, 5).map((a: any) => ({
            id: a.billId || a.id || "",
            invoiceNumber: a.billId || "BILL",
            projectName: "Contract Execution",
            submittedAmount: Number(a.amount || 0),
            approvedAmount: a.secondApprover || a.firstApprover ? Number(a.amount || 0) : 0,
            paidAmount: 0,
            status: a.status === "REJECTED" ? "Rejected" : (a.secondApprover || a.firstApprover ? "Approved" : "Submitted"),
            submittedAt: a.createdAt || new Date().toISOString(),
          }));
        }
      } catch {
        // Tolerant fallback
      }

      setData({
        vendorName: d.vendorBusinessName || "Trade Contractor",
        organisationName: d.category || "Civil & MEP Works",
        projects: [
          {
            id: "vp-1",
            name: "Active Studio Site Package",
            location: "Maharashtra",
            assignment: d.category || "General Subcontractor",
            status: "Under Execution",
            updatedAt: new Date().toISOString(),
          },
        ],
        invoices,
        activities: [
          {
            id: "act-v1",
            title: "Bill Submission Received",
            description: "Your invoice was registered in the maker-checker queue",
            date: new Date().toISOString(),
            category: "Invoice",
          },
        ],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load vendor workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadVendorDashboard();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadVendorDashboard, router]);

  return (
    <VendorPortalDashboard
      data={data}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadVendorDashboard}
      onOpenProjects={() => router.push("/vendor/projects")}
      onOpenProject={() => router.push("/vendor/projects")}
      onOpenInvoices={() => router.push("/vendor/invoices")}
      onOpenInvoice={() => router.push("/vendor/invoices")}
      onCreateInvoice={() => router.push("/vendor/invoices")}
      onOpenDocuments={() => router.push("/vendor/invoices")}
    />
  );
}
