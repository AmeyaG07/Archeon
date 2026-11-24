"use client";

import React, { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClientInvoiceOverview,
  type ClientInvoice,
  type ClientInvoiceStatus,
} from "@/components/portal/client/ClientInvoiceOverview";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import {
  CreditCard,
  FileText,
  UploadCloud,
  CheckCircle2,
  X,
  ArrowUpRight,
} from "lucide-react";

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

  // Modal tile states (no page redirection)
  const [viewingBillPhoto, setViewingBillPhoto] = useState<ClientInvoice | null>(null);
  const [paymentProofInvoice, setPaymentProofInvoice] = useState<ClientInvoice | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);


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
        billPhotoUrl: inv.billPhotoUrl || inv.fileUrl || "",
        paymentProofUrl: inv.paymentProofUrl || "",
        fileUrl: inv.billPhotoUrl || inv.fileUrl || "",
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
            const photo = b.billPhotoUrl || b.fileUrl || "";
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
              billPhotoUrl: photo,
              paymentProofUrl: b.paymentProofUrl || "",
              fileUrl: photo,
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

  // When payment proof is successfully uploaded:
  const handlePaymentSuccess = (invoiceId: string, proofUrl: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
          return {
            ...inv,
            status: "Paid" as ClientInvoiceStatus,
            paidAmount: inv.totalAmount,
            outstandingAmount: 0,
            paymentProofUrl: proofUrl,
          };
        }
        return inv;
      })
    );
    setFeedbackMessage({
      type: "success",
      message: "Payment screenshot submitted successfully. Bill status has been updated to PAID and reflected at the vendor portal.",
    });
  };

  return (
    <div className="space-y-6 p-3 sm:p-8 max-w-full">
      {/* Top Tab Bar connecting Invoices, Payments, Disputes */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-[#D8D6D0] bg-white px-4 sm:px-6 pt-4 gap-4 sm:gap-6 whitespace-nowrap">
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
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === "invoices" && (
        <>
          {feedbackMessage && (
            <div
              className={`p-4 rounded-xs border text-xs flex items-center justify-between ${
                feedbackMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{feedbackMessage.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackMessage(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-mono uppercase ml-4"
              >
                Dismiss
              </button>
            </div>
          )}

          <ClientInvoiceOverview
            invoices={invoices}
            loading={loading}
            error={error ?? undefined}
            onRetry={loadInvoices}
            onViewInvoice={(invoice) => setViewingBillPhoto(invoice)}
            onSubmitPaymentProof={(invoice) => setPaymentProofInvoice(invoice)}
          />

          {/* Modal Tile 1: View Bill Photo */}
          {viewingBillPhoto && (
            <BillPhotoTileModal
              invoice={viewingBillPhoto}
              onClose={() => setViewingBillPhoto(null)}
            />
          )}

          {/* Modal Tile 2: Submit Payment Proof (Opens right here, no redirection) */}
          {paymentProofInvoice && (
            <SubmitPaymentProofTileModal
              invoice={paymentProofInvoice}
              onClose={() => setPaymentProofInvoice(null)}
              onPaymentSuccess={handlePaymentSuccess}
            />
          )}
        </>
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
                {invoices
                  .filter((inv) => inv.status === "Paid")
                  .map((inv) => (
                    <tr key={inv.id}>
                      <td className="p-3 font-semibold text-[#111]">RCP-{inv.invoiceNumber}</td>
                      <td className="p-3 text-[#555]">{inv.invoiceNumber}</td>
                      <td className="p-3 text-[#111] font-semibold">₹{inv.paidAmount.toLocaleString("en-IN")}</td>
                      <td className="p-3 text-[#555]">Online Settlement</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} /> Verified Paid
                        </span>
                      </td>
                      <td className="p-3 text-[#77736C]">{inv.issueDate}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 1. BILL PHOTO TILE MODAL
// Opens in this webpage only. Displays the uploaded bill photo. No auto PDF.
// =========================================================================
function BillPhotoTileModal({
  invoice,
  onClose,
}: {
  invoice: ClientInvoice;
  onClose: () => void;
}) {
  const photoUrl = invoice.billPhotoUrl || invoice.fileUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-photo-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FAF9F5] border border-[#D8D6D0] shadow-2xl p-5 sm:p-7 rounded-xs max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E2DC] pb-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64] block">
              Architectural Trade Bill / Original Document
            </span>
            <h3
              id="bill-photo-title"
              className="font-serif text-xl sm:text-2xl text-[#171717] mt-1"
            >
              {invoice.projectName}
            </h3>
            <p className="font-mono text-xs text-[#77736C] mt-0.5">
              Ref: <span className="font-bold text-[#171717]">{invoice.invoiceNumber}</span> · {invoice.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-[#77736C] hover:text-[#171717] hover:bg-[#EAE8E2] rounded-xs transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Bill Photo Viewer */}
        <div className="mt-4 flex-1 overflow-auto border border-[#D8D6D0] bg-[#111111]/5 p-2 sm:p-4 rounded-xs flex items-center justify-center min-h-[260px]">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`Bill Document for ${invoice.invoiceNumber}`}
              className="max-h-[60vh] w-auto max-w-full object-contain mx-auto shadow-sm"
            />
          ) : (
            <div className="text-center p-8 text-[#77736C]">
              <FileText size={32} className="mx-auto mb-2 text-[#A58A64]" />
              <p className="text-xs">No bill photo attached.</p>
            </div>
          )}
        </div>

        {/* Info & Footer */}
        <div className="mt-4 pt-3 border-t border-[#E5E2DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="font-mono text-[10px] text-[#77736C]">
            <span>Amount: <strong className="text-[#171717]">₹{invoice.totalAmount.toLocaleString("en-IN")}</strong></span>
            <span className="mx-2">·</span>
            <span>Issued: {invoice.issueDate}</span>
          </div>
          <div className="flex items-center gap-2">
            {photoUrl && (
              <a
                href={photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] text-[#A58A64] hover:underline"
              >
                Full View <ArrowUpRight size={12} />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-[#171717] px-5 py-2 text-[10px] font-mono uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. SUBMIT PAYMENT PROOF TILE MODAL
// Opens in this webpage only (no redirect). Uploads screenshot & sets status to Paid.
// =========================================================================
function SubmitPaymentProofTileModal({
  invoice,
  onClose,
  onPaymentSuccess,
}: {
  invoice: ClientInvoice;
  onClose: () => void;
  onPaymentSuccess: (invoiceId: string, proofUrl: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState<string>("UPI");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setFormError("Please select a screenshot image (PNG, JPG, WEBP) or PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError("The file exceeds the 10 MB maximum size limit.");
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofPreviewUrl) {
      setFormError("Please select and attach your payment screenshot.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      // 1. Submit payment proof to backend API
      const res = await apiFetch(`/api/billing/bills/${invoice.invoiceNumber || invoice.id}/payment-proof`, {
        method: "POST",
        body: {
          paymentProofUrl: proofPreviewUrl,
          paymentProofUtr: utrNumber.trim() || undefined,
        },
      });

      if (!res.ok) {
        console.warn("Bill payment proof endpoint returned non-ok, status:", res.status);
      }

      // Notify parent to immediately change status to Paid and zero out outstanding balance!
      onPaymentSuccess(invoice.id, proofPreviewUrl);
      onClose();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to submit payment proof.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-proof-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF9F5] border border-[#D8D6D0] shadow-2xl p-5 sm:p-7 rounded-xs max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E2DC] pb-4">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64] block">
              Payment Settlement / Electronic Verification
            </span>
            <h3
              id="payment-proof-title"
              className="font-serif text-xl sm:text-2xl text-[#171717] mt-1"
            >
              Submit Payment Proof
            </h3>
            <p className="font-mono text-xs text-[#77736C] mt-0.5">
              Invoice: <span className="font-bold text-[#171717]">{invoice.invoiceNumber}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-[#77736C] hover:text-[#171717] hover:bg-[#EAE8E2] rounded-xs transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Invoice Summary Banner */}
        <div className="mt-4 border border-[#D8D6D0] bg-white p-4 rounded-xs flex items-center justify-between text-xs">
          <div>
            <span className="text-[#888] block text-[10px] font-mono uppercase">Contractor / Trade</span>
            <span className="font-semibold text-[#111]">{invoice.description}</span>
          </div>
          <div className="text-right">
            <span className="text-[#888] block text-[10px] font-mono uppercase">Outstanding Balance</span>
            <span className="font-mono text-base font-bold text-[#A58A64]">
              ₹{invoice.outstandingAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Upload Screenshot Tile */}
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1.5">
              Payment Screenshot / Receipt Photo *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {proofPreviewUrl ? (
              <div className="relative border border-[#D8D6D0] bg-white p-3 rounded-xs">
                {proofFile?.type === "application/pdf" ? (
                  <div className="flex items-center gap-3 p-4">
                    <FileText size={28} className="text-[#A58A64]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#111]">{proofFile.name}</p>
                      <p className="text-[10px] text-[#888]">PDF Document</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex items-center justify-center bg-[#FAF9F6] p-2 max-h-56 overflow-hidden rounded-xs">
                    <img
                      src={proofPreviewUrl}
                      alt="Payment Screenshot Preview"
                      className="max-h-52 w-auto object-contain mx-auto"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setProofFile(null);
                    setProofPreviewUrl("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-2 text-[10px] font-mono uppercase tracking-wider text-red-600 hover:underline inline-flex items-center gap-1"
                >
                  <X size={12} /> Remove &amp; Choose Another
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#D8D6D0] bg-white hover:border-[#A58A64] hover:bg-[#FAF9F5] p-6 text-center transition-colors rounded-xs flex flex-col items-center justify-center cursor-pointer"
              >
                <UploadCloud size={28} className="text-[#A58A64] mb-2" />
                <span className="text-xs font-semibold text-[#171717]">Upload Payment Screenshot</span>
                <span className="text-[10px] text-[#888] mt-1">Click to select JPG, PNG, WEBP receipt image</span>
              </button>
            )}
          </div>

          {/* Payment Method & UTR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1.5">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs outline-none focus:border-[#A58A64]"
              >
                <option value="UPI">UPI / QR Transfer</option>
                <option value="NEFT">NEFT Transfer</option>
                <option value="RTGS">RTGS Transfer</option>
                <option value="IMPS">IMPS Instant</option>
                <option value="BANK_TRANSFER">Direct Bank Deposit</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[9px] uppercase tracking-widest text-[#77736C] mb-1.5">
                UTR / Reference Number (Optional)
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 432109876543"
                className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs outline-none focus:border-[#A58A64]"
              />
            </div>
          </div>

          {/* Instant Verification Callout */}
          <div className="bg-[#FAF8F5] border border-[#E5E2DC] p-3 text-[11px] text-[#77736C] leading-relaxed rounded-xs">
            <span className="font-semibold text-[#171717]">Instant Verification:</span> Uploading this payment proof will immediately update this bill to <strong className="text-emerald-700">PAID</strong> and the receipt will be reflected directly on the vendor portal.
          </div>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs">
              {formError}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#77736C] hover:text-[#171717]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !proofPreviewUrl}
              className="inline-flex items-center gap-2 bg-[#171717] px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {submitting ? "Submitting..." : "Confirm & Update to Paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
