"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClientInvoiceOverview,
  type ClientInvoice,
  type ClientInvoiceStatus,
} from "@/components/portal/client/ClientInvoiceOverview";
import {
  ClientDisputeTracking,
  type ClientDisputeRecord,
} from "@/components/portal/client/ClientDisputeTracking";
import { apiFetch, resolveApiBaseUrl, getAuthToken } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { CreditCard, FileText, MessageSquareWarning, ShieldCheck, UploadCloud, CheckCircle2 } from "lucide-react";

export default function ClientInvoicesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono text-xs text-[#777]">Loading Invoices...</div>}>
      <ClientInvoicesContent />
    </Suspense>
  );
}

function ClientInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "invoices";

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sample disputes data for ClientDisputeTracking
  const [disputes] = useState<ClientDisputeRecord[]>([
    {
      id: "disp-1",
      referenceNumber: "DSP-2026-081",
      invoiceNumber: "INV-2026-0042",
      projectName: "Bhalekar Residence Turnkey",
      reason: "Billing Quantity Discrepancy",
      explanation: "Granite flooring square footage in bathroom 2 billed at 240 sq.ft instead of measured 195 sq.ft. Requested credit adjustment of ₹18,000.",
      status: "Under Review",
      submittedAt: "18 Nov 2026",
      lastUpdatedAt: "19 Nov 2026",
      history: [
        {
          id: "dh-1",
          title: "Dispute Lodged",
          description: "Client submitted variance report with on-site measurements.",
          date: "18 Nov 2026, 14:30",
          actor: "Client",
        },
        {
          id: "dh-2",
          title: "Site Verification Initiated",
          description: "Project Architect scheduled joint site verification with site engineer.",
          date: "19 Nov 2026, 11:00",
          actor: "Finance Team",
        },
      ],
    },
  ]);

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

      // Fetch vendors map to display human-readable business names instead of raw UUIDs
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

      // 2. Also load trade partner bills uploaded for this client's projects
      let billRecords: ClientInvoice[] = [];
      try {
        const bRes = await apiFetch("/api/billing/bills");
        const bList = await bRes.json();
        if (Array.isArray(bList)) {
          billRecords = bList.map((b: any) => {
            const isSettled = b.status === "PAID_CASH" || b.status === "PAID_ONLINE";
            const isApproved = isSettled || b.status === "APPROVED";
            const vDisplay = vendorMap[String(b.vendorId)] || b.tradeCategory || "Trade Contractor";
            return {
              id: b.id ? String(b.id) : b.billId || "BILL",
              invoiceNumber: b.invoiceNumber || b.billId || "BILL",
              projectName: b.tradeCategory ? `${b.tradeCategory} (Contractor Bill)` : "Trade Partner Bill",
              description: b.disputeReason ? `${b.disputeReason} · Contractor: ${vDisplay}` : `Contractor: ${vDisplay}`,
              issueDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : new Date().toISOString(),
              dueDate: "Immediate",
              totalAmount: Number(b.amount || 0),
              paidAmount: Number(b.paidAmount || 0),
              outstandingAmount: Math.max(0, Number(b.amount || 0) - Number(b.paidAmount || 0)),
              status: (isSettled
                ? "Paid"
                : isApproved
                ? "Issued"
                : "Under Review") as ClientInvoiceStatus,
              currency: "INR" as const,
              fileUrl: b.billPhotoUrl || b.paymentProofUrl || "",
            } as ClientInvoice & { fileUrl?: string };
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

  const handleDownloadPdf = async (invoice: ClientInvoice) => {
    try {
      const baseUrl = resolveApiBaseUrl();
      const token = getAuthToken();
      const res = await fetch(`${baseUrl}/api/invoices/${invoice.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        if ((invoice as any).fileUrl) {
          window.open((invoice as any).fileUrl, "_blank");
          return;
        }
        throw new Error("Failed to download tax invoice PDF");
      }
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
      if ((invoice as any).fileUrl) {
        window.open((invoice as any).fileUrl, "_blank");
      } else {
        alert("Error downloading invoice: " + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* Top Tab Bar connecting Invoices, Payments, Disputes */}
      <div className="flex border-b border-[#D8D6D0] bg-white px-6 pt-4 gap-6">
        <button
          type="button"
          onClick={() => router.push("/client/invoices?tab=invoices")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "invoices"
              ? "border-[#A58A64] text-[#171717] font-semibold"
              : "border-transparent text-[#77736C] hover:text-[#171717]"
          }`}
        >
          <CreditCard size={15} /> Invoices &amp; Bills
        </button>

        <button
          type="button"
          onClick={() => router.push("/client/invoices?tab=payments")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "payments"
              ? "border-[#A58A64] text-[#171717] font-semibold"
              : "border-transparent text-[#77736C] hover:text-[#171717]"
          }`}
        >
          <CheckCircle2 size={15} /> Payment Records
        </button>

        <button
          type="button"
          onClick={() => router.push("/client/invoices?tab=disputes")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "disputes"
              ? "border-[#A58A64] text-[#171717] font-semibold"
              : "border-transparent text-[#77736C] hover:text-[#171717]"
          }`}
        >
          <MessageSquareWarning size={15} /> Disputes
        </button>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === "invoices" && (
        <ClientInvoiceOverview
          invoices={invoices}
          loading={loading}
          error={error ?? undefined}
          onRetry={loadInvoices}
          onViewInvoice={handleDownloadPdf}
          onSubmitPaymentProof={() => router.push("/client/invoices?tab=payments")}
          onRaiseDispute={() => router.push("/client/invoices?tab=disputes")}
        />
      )}

      {/* Tab 2: Payment Records */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="border border-[#D8D6D0] bg-white p-6">
            <h2 className="font-serif text-xl text-[#171717]">Studio Bank Account &amp; Settlement Details</h2>
            <p className="mt-1 text-xs text-[#77736C]">
              Direct bank transfers must be made to the studio&apos;s verified institutional account.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#E5E2DC] pt-4 font-mono text-xs">
              <div>
                <span className="text-[#888] block text-[10px] uppercase">Bank Name</span>
                <span className="font-semibold text-[#111]">HDFC Bank Ltd</span>
              </div>
              <div>
                <span className="text-[#888] block text-[10px] uppercase">Account Number</span>
                <span className="font-semibold text-[#111]">50200088912441</span>
              </div>
              <div>
                <span className="text-[#888] block text-[10px] uppercase">IFSC Code</span>
                <span className="font-semibold text-[#111]">HDFC0001824</span>
              </div>
            </div>
          </div>

          <div className="border border-[#D8D6D0] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
              <div>
                <h3 className="font-serif text-lg text-[#171717]">Payment Records &amp; Proof Submissions</h3>
                <p className="text-xs text-[#77736C]">Verified electronic receipts and RTGS/NEFT transaction submissions.</p>
              </div>
              <button
                type="button"
                onClick={() => alert("To submit a new payment proof, please upload your UTR receipt or contact Ar. Mandar Bhalekar.")}
                className="inline-flex items-center gap-2 bg-[#171717] px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-[#A58A64]"
              >
                <UploadCloud size={14} /> Submit Payment Proof
              </button>
            </div>

            <table className="mt-4 w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#E5E2DC] bg-[#FAF9F5] text-[10px] uppercase text-[#77736C]">
                  <th className="p-3">Receipt Ref</th>
                  <th className="p-3">Invoice Ref</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Submitted On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DC]">
                <tr>
                  <td className="p-3 font-semibold text-[#111]">PAY-2026-019</td>
                  <td className="p-3 text-[#555]">INV-2026-0041</td>
                  <td className="p-3 text-[#111] font-semibold">₹1,50,000</td>
                  <td className="p-3 text-[#555]">RTGS Transfer</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-800 border border-emerald-200">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  </td>
                  <td className="p-3 text-[#77736C]">15 Nov 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Disputes */}
      {activeTab === "disputes" && (
        <ClientDisputeTracking
          disputes={disputes}
          loading={false}
          onViewInvoice={(disp) => alert(`Viewing invoice ${disp.invoiceNumber} dispute record.`)}
        />
      )}
    </div>
  );
}
