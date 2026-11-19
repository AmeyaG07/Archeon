"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClientInvoiceOverview,
  type ClientInvoice,
  type ClientInvoiceStatus,
} from "@/components/portal/client/ClientInvoiceOverview";
import { apiFetch, resolveApiBaseUrl, getAuthToken } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function ClientInvoicesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/invoices?size=50");
      const page = await res.json();
      const list = Array.isArray(page) ? page : page.content || [];

      const records: ClientInvoice[] = list.map((inv: any) => ({
        id: inv.id || "",
        invoiceNumber: inv.invoiceNumber || inv.id || "INV",
        projectName: inv.projectTitle || "Architecture & Turnkey Execution",
        description: inv.notes || "Professional Architectural & Design Services (SAC 998321)",
        issueDate: inv.invoiceDate || new Date().toISOString(),
        dueDate: inv.dueDate || "Due upon receipt",
        totalAmount: Number(inv.totalAmount || 0),
        paidAmount: Number(inv.paidAmount || 0),
        outstandingAmount: Number(inv.outstandingAmount || 0),
        status: (inv.status === "PAID"
          ? "Paid"
          : inv.status === "PARTIALLY_PAID"
          ? "Partially Paid"
          : inv.status === "CANCELLED"
          ? "Overdue"
          : "Issued") as ClientInvoiceStatus,
        currency: "INR" as const,
      }));

      setInvoices(records);
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

  const handleDownloadPdf = async (invoice: ClientInvoice) => {
    try {
      const baseUrl = resolveApiBaseUrl();
      const token = getAuthToken();
      const res = await fetch(`${baseUrl}/api/invoices/${invoice.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to download tax invoice PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading invoice: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <ClientInvoiceOverview
      invoices={invoices}
      loading={loading}
      error={error ?? undefined}
      onRetry={loadInvoices}
      onViewInvoice={handleDownloadPdf}
      onSubmitPaymentProof={() => alert("Payment proof submission: please transfer to HDFC Bank A/C 50200088912441 and share UTR via studio email.")}
      onRaiseDispute={() => alert("To dispute an invoice, please contact Ar. Mandar Bhalekar or the project manager.")}
    />
  );
}
