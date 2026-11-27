"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VendorPortalDashboard,
  type VendorDashboardData,
  type VendorDashboardProject,
  type VendorDashboardInvoice,
} from "@/components/portal/vendor/VendorPortalDashboard";
import { BillPhotoModal, type BillPhotoTarget } from "@/components/portal/admin/BillPhotoModal";
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
  const [previewBill, setPreviewBill] = useState<BillPhotoTarget | null>(null);

  const loadVendorDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/dashboards/vendor");
      const d = await res.json();

      let invoices: VendorDashboardInvoice[] = [];
      try {
        const billsRes = await apiFetch("/api/billing/bills/me");
        const billList = await billsRes.json();
        if (Array.isArray(billList) && billList.length > 0) {
          invoices = billList.slice(0, 5).map((b: any) => ({
            id: String(b.id || b.billId || ""),
            billId: b.billId || "",
            invoiceNumber: b.invoiceNumber || b.billId || "BILL",
            projectName: b.projectName || b.tradeCategory || "Contract Execution",
            submittedAmount: Number(b.amount || 0),
            approvedAmount: b.status === "APPROVED" || b.status === "PAID" ? Number(b.amount || 0) : 0,
            paidAmount: b.status === "PAID" ? Number(b.amount || 0) : 0,
            status: b.status === "REJECTED"
              ? "Rejected"
              : b.status === "PAID"
              ? "Paid"
              : b.status === "APPROVED"
              ? "Approved"
              : b.status === "UNDER_REVIEW"
              ? "Under Review"
              : "Submitted",
            submittedAt: b.createdAt || new Date().toISOString(),
            billPhotoUrl: b.billPhotoUrl || undefined,
          }));
        } else {
          const appRes = await apiFetch("/api/approvals");
          const appList = await appRes.json();
          if (Array.isArray(appList)) {
            invoices = appList.slice(0, 5).map((a: any) => ({
              id: a.billId || a.id || "",
              billId: a.billId || "",
              invoiceNumber: a.billId || "BILL",
              projectName: "Contract Execution",
              submittedAmount: Number(a.amount || 0),
              approvedAmount: a.secondApprover || a.firstApprover ? Number(a.amount || 0) : 0,
              paidAmount: 0,
              status: a.status === "REJECTED" ? "Rejected" : (a.secondApprover || a.firstApprover ? "Approved" : "Submitted"),
              submittedAt: a.createdAt || new Date().toISOString(),
            }));
          }
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
    <>
      <VendorPortalDashboard
        data={data}
        loading={loading}
        error={error ?? undefined}
        onRetry={loadVendorDashboard}
        onOpenProjects={() => router.push("/vendor/projects")}
        onOpenProject={() => router.push("/vendor/projects")}
        onOpenInvoices={() => router.push("/vendor/invoices")}
        onOpenInvoice={(inv) =>
          setPreviewBill({
            id: inv.id,
            billId: inv.billId || inv.invoiceNumber,
            invoiceNumber: inv.invoiceNumber,
            projectName: inv.projectName,
            amount: inv.submittedAmount,
            status: inv.status,
            createdAt: inv.submittedAt,
            billPhotoUrl: inv.billPhotoUrl,
          })
        }
        onCreateInvoice={() => router.push("/vendor/invoices")}
        onOpenDocuments={() => router.push("/vendor/invoices")}
      />
      <BillPhotoModal
        bill={previewBill}
        onClose={() => setPreviewBill(null)}
        onPhotoUploaded={(updatedBill, newPhotoUrl) => {
          setPreviewBill((prev) => (prev ? { ...prev, billPhotoUrl: newPhotoUrl } : prev));
          setData((prev) => ({
            ...prev,
            invoices: prev.invoices.map((inv) =>
              inv.id === updatedBill.id ? { ...inv, billPhotoUrl: newPhotoUrl } : inv
            ),
          }));
        }}
      />
    </>
  );
}
