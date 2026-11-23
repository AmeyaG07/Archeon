"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  ClientInvoiceOverview,
  type ClientInvoice,
  type ClientInvoiceStatus,
} from "@/components/portal/client/ClientInvoiceOverview";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

export default function ClientInvoicesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono text-xs text-[#777]">Loading Invoices...</div>}>
      <ClientInvoicesContent />
    </Suspense>
  );
}

function ClientInvoicesContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch vendors map to resolve vendor names
      const vendorMap: Record<string, string> = {};
      try {
        const vRes = await apiFetch("/api/vendors");
        const vPage = await vRes.json();
        const vList = Array.isArray(vPage) ? vPage : vPage.content || [];
        vList.forEach((v: any) => {
          const name = v.businessName || v.contactPerson || v.vendorReference;
          if (v.id) vendorMap[String(v.id)] = name;
          if (v.vendorReference) vendorMap[v.vendorReference] = name;
        });
      } catch (err) {
        console.warn("Could not load vendors map:", err);
      }

      // 2. Fetch official invoices
      let records: ClientInvoice[] = [];
      try {
        const res = await apiFetch("/api/invoices?size=50");
        const page = await res.json();
        const list = Array.isArray(page) ? page : page.content || [];

        records = list.map((inv: any) => {
          const isPaid = inv.status === "PAID";
          return {
            id: inv.id || "",
            invoiceNumber: inv.invoiceNumber || inv.id || "INV",
            projectName: inv.projectTitle || "Architecture & Turnkey Execution",
            description: inv.notes || "Professional Architectural & Design Services (SAC 998321)",
            vendorId: "ARCHEON-STUDIO",
            vendorName: "ArcheOn Design Studio",
            issueDate: inv.invoiceDate || new Date().toLocaleDateString(),
            dueDate: inv.dueDate || "Due upon receipt",
            totalAmount: Number(inv.totalAmount || 0),
            paidAmount: Number(inv.paidAmount || 0),
            outstandingAmount: Number(inv.outstandingAmount || 0),
            status: (isPaid ? "Paid" : "Pending") as ClientInvoiceStatus,
            currency: "INR" as const,
          };
        });
      } catch (err) {
        console.warn("Could not load invoices list:", err);
      }

      // 3. Load trade contractor bills uploaded for this client's projects
      let billRecords: ClientInvoice[] = [];
      try {
        const bRes = await apiFetch("/api/billing/bills");
        const bList = await bRes.json();
        if (Array.isArray(bList)) {
          billRecords = bList.map((b: any) => {
            const isSettled =
              b.status === "PAID_CASH" ||
              b.status === "PAID_ONLINE" ||
              b.status === "PAID";
            const vDisplay =
              vendorMap[String(b.vendorId)] ||
              b.tradeCategory ||
              "Trade Contractor";

            return {
              id: b.id ? String(b.id) : b.billId || "BILL",
              invoiceNumber: b.invoiceNumber || b.billId || "BILL",
              projectName: b.tradeCategory
                ? `${b.tradeCategory} (Contractor Bill)`
                : "Trade Partner Bill",
              description: b.disputeReason
                ? `${b.disputeReason} · Contractor: ${vDisplay}`
                : `Contractor: ${vDisplay}`,
              vendorId: String(b.vendorId || ""),
              vendorName: vDisplay,
              issueDate: b.createdAt
                ? new Date(b.createdAt).toLocaleDateString()
                : new Date().toLocaleDateString(),
              dueDate: "Immediate",
              totalAmount: Number(b.amount || 0),
              paidAmount: isSettled ? Number(b.amount || 0) : Number(b.paidAmount || 0),
              outstandingAmount: isSettled ? 0 : Math.max(0, Number(b.amount || 0) - Number(b.paidAmount || 0)),
              status: (isSettled ? "Paid" : "Pending") as ClientInvoiceStatus,
              currency: "INR" as const,
              fileUrl: b.billPhotoUrl || b.paymentProofUrl || "",
              paymentProofUrl: b.paymentProofUrl || "",
            } as ClientInvoice;
          });
        }
      } catch (err) {
        console.warn("Could not load client bills:", err);
      }

      setInvoices([...records, ...billRecords]);
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

  const handleSubmitPaymentProof = async (
    invoice: ClientInvoice,
    proofUrl?: string
  ) => {
    try {
      // Settle bill via backend billing API
      await apiFetch(`/api/billing/bills/${invoice.id}/payment-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentProofUrl: proofUrl || "" }),
      });
    } catch (err) {
      console.warn("Fallback to invoices payment recording:", err);
      try {
        await apiFetch(`/api/invoices/${invoice.id}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: invoice.totalAmount,
            paymentMethod: "ONLINE",
            referenceNumber: `REC-${Date.now()}`,
            notes: "Client uploaded payment proof screenshot",
          }),
        });
      } catch (fallbackErr) {
        console.warn("Could not update via fallback:", fallbackErr);
      }
    }

    // Immediately update local state to reflect across the UI
    setInvoices((prev) =>
      prev.map((item) =>
        item.id === invoice.id
          ? {
              ...item,
              status: "Paid",
              paidAmount: item.totalAmount,
              outstandingAmount: 0,
              paymentProofUrl: proofUrl,
            }
          : item
      )
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <ClientInvoiceOverview
        invoices={invoices}
        loading={loading}
        error={error ?? undefined}
        onRetry={loadInvoices}
        onSubmitPaymentProof={handleSubmitPaymentProof}
      />
    </div>
  );
}
