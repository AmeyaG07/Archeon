"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AdminInvoiceManagement,
  type AdminInvoiceRecord,
  type AdminInvoiceSummary,
  type AdminInvoiceStatus,
} from "@/components/portal/admin/AdminInvoiceManagement";
import { apiFetch, resolveApiBaseUrl, getAuthToken } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminInvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<AdminInvoiceRecord[]>([]);
  const [summary, setSummary] = useState<AdminInvoiceSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/invoices?size=50");
      const page = await res.json();
      const list = Array.isArray(page) ? page : page.content || [];

      let totalSub = 0;
      let totalApp = 0;
      let totalPaid = 0;
      let totalOut = 0;
      let pendingReview = 0;

      const records: AdminInvoiceRecord[] = list.map((inv: any) => {
        const sub = Number(inv.subtotal || 0);
        const tax = Number(inv.taxAmount || 0);
        const tot = Number(inv.totalAmount || 0);
        const paid = Number(inv.paidAmount || 0);
        const out = Number(inv.outstandingAmount || 0);

        totalSub += sub;
        totalApp += tot;
        totalPaid += paid;
        totalOut += out;
        if (inv.status === "DRAFT" || inv.status === "ISSUED") pendingReview++;

        return {
          id: inv.id || "",
          reference: inv.invoiceNumber || inv.id || "INV",
          partyType: "Client" as const,
          partyId: inv.clientId || "",
          partyName: inv.clientName || "Studio Client",
          projectId: inv.projectId,
          projectReference: inv.projectId,
          projectName: inv.projectTitle || "Architecture Project",
          invoiceDate: inv.invoiceDate || new Date().toISOString(),
          dueDate: inv.dueDate,
          submittedAt: inv.createdAt || new Date().toISOString(),
          currency: "INR" as const,
          subtotal: sub,
          taxAmount: tax,
          totalAmount: tot,
          approvedAmount: tot,
          paidAmount: paid,
          outstandingAmount: out,
          status: (inv.status === "PAID"
            ? "Paid"
            : inv.status === "PARTIALLY_PAID"
            ? "Partially Paid"
            : inv.status === "CANCELLED"
            ? "Cancelled"
            : inv.status === "ISSUED"
            ? "Approved"
            : "Draft") as AdminInvoiceStatus,
          description: inv.notes,
          attachmentCount: 1,
          lastUpdated: inv.updatedAt || new Date().toISOString(),
        };
      });

      setInvoices(records);
      setSummary({
        totalInvoices: records.length,
        submittedAmount: totalSub,
        approvedAmount: totalApp,
        paidAmount: totalPaid,
        outstandingAmount: totalOut,
        pendingReviewCount: pendingReview,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadInvoices();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadInvoices, router]);

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const baseUrl = resolveApiBaseUrl();
      const token = getAuthToken();
      const res = await fetch(`${baseUrl}/api/invoices/${invoiceId}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to download PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading invoice PDF: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <AdminInvoiceManagement
        invoices={invoices}
        summary={summary}
        loading={loading}
        error={error ?? undefined}
        onRefresh={loadInvoices}
        onDownloadAttachment={handleDownloadPdf}
        onOpenInvoice={(id) => handleDownloadPdf(id)}
      />
    </div>
  );
}
