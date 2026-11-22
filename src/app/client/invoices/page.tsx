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
      // 1. If physical bill photo or document URL is attached, open it
      const fileUrl = (invoice as any).fileUrl;
      if (fileUrl && typeof fileUrl === "string" && (fileUrl.startsWith("http") || fileUrl.startsWith("/uploads") || fileUrl.startsWith("data:"))) {
        window.open(fileUrl, "_blank");
        return;
      }

      const baseUrl = resolveApiBaseUrl();
      const token = getAuthToken();

      // 2. Try fetching server PDF by ID
      let res = await fetch(`${baseUrl}/api/invoices/${invoice.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // 3. Fallback: try by invoiceNumber if different
      if (!res.ok && invoice.invoiceNumber && invoice.invoiceNumber !== invoice.id) {
        res = await fetch(`${baseUrl}/api/invoices/${invoice.invoiceNumber}/pdf`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }

      // If server returned non-ok, open printable voucher window directly
      printClientInvoiceVoucher(invoice);
    } catch {
      printClientInvoiceVoucher(invoice);
    }
  };

  const printClientInvoiceVoucher = (invoice: ClientInvoice) => {
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice.invoiceNumber} - Tax Invoice / Voucher</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 40px; color: #171717; max-width: 800px; margin: 0 auto; }
            .header { border-bottom: 2px solid #171717; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
            .title { font-size: 22px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
            .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; }
            .box { border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
            .box-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 8px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background: #f8f8f8; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; }
            td { padding: 12px 10px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            .total-row { font-weight: 700; font-size: 15px; border-top: 2px solid #171717; }
            .badge { display: inline-block; padding: 3px 8px; font-size: 10px; text-transform: uppercase; font-weight: 600; background: #eee; border-radius: 3px; }
            .print-btn { background: #171717; color: #fff; border: none; padding: 8px 16px; font-size: 12px; cursor: pointer; border-radius: 3px; margin-top: 20px; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">ArcheOn Design Studio</div>
              <div class="subtitle">Principal Architect: Ar. Mandar Bhalekar · GSTIN: 27AABCA1234F1Z9 · State: Maharashtra (27)</div>
            </div>
            <div style="text-align: right;">
              <div class="badge">${invoice.status}</div>
              <div style="font-size: 14px; font-weight: 700; margin-top: 6px;">${invoice.invoiceNumber}</div>
              <div class="subtitle">Date: ${invoice.issueDate}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="box">
              <div class="box-title">Project & Scope</div>
              <div style="font-weight: 600;">${invoice.projectName || "Architectural Services"}</div>
              <div style="color: #555; margin-top: 4px;">${invoice.description || "SAC 998321 - Professional Services"}</div>
            </div>
            <div class="box">
              <div class="box-title">Settlement Status</div>
              <div>Total Bill: ₹${invoice.totalAmount.toLocaleString("en-IN")}</div>
              <div style="color: #10B981; margin-top: 4px;">Recorded Paid: ₹${invoice.paidAmount.toLocaleString("en-IN")}</div>
              <div style="color: #D97724; font-weight: 600; margin-top: 4px;">Outstanding: ₹${invoice.outstandingAmount.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description / SAC</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.description || "Architectural Execution & Professional Services"}</td>
                <td class="text-right">1</td>
                <td class="text-right">₹${invoice.totalAmount.toLocaleString("en-IN")}</td>
                <td class="text-right">₹${invoice.totalAmount.toLocaleString("en-IN")}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3">Grand Total</td>
                <td class="text-right">₹${invoice.totalAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
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
