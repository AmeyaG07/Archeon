"use client";

import React, { useState } from "react";
import {
  FileText,
  IndianRupee,
  CalendarDays,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
  X,
  UploadCloud,
  Eye,
  Filter,
} from "lucide-react";

export type ClientInvoiceStatus = "Paid" | "Pending" | "Issued" | "Partially Paid" | "Overdue" | "Under Review";

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  projectName: string;
  description: string;
  vendorId?: string;
  vendorName?: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: ClientInvoiceStatus;
  fileUrl?: string;
  paymentProofUrl?: string;
  currency?: "INR";
}

interface ClientInvoiceOverviewProps {
  invoices: ClientInvoice[];
  loading?: boolean;
  error?: string;
  onViewInvoice?: (invoice: ClientInvoice) => void;
  onSubmitPaymentProof?: (invoice: ClientInvoice, proofUrl?: string) => void | Promise<void>;
  onRaiseDispute?: (invoice: ClientInvoice) => void;
  onRetry?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function ClientInvoiceOverview({
  invoices,
  loading = false,
  error,
  onSubmitPaymentProof,
  onRetry,
}: ClientInvoiceOverviewProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>("ALL");
  const [previewBill, setPreviewBill] = useState<ClientInvoice | null>(null);
  const [paymentModalBill, setPaymentModalBill] = useState<ClientInvoice | null>(null);
  const [proofFilePreview, setProofFilePreview] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[#77736C]">
          Loading bills &amp; invoices...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <section role="alert" className="border border-[#E3C9C5] bg-[#FAF3F1] p-7">
        <AlertCircle className="text-[#9A5147]" size={22} />
        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">Bills information unavailable</h2>
        <p className="mt-3 text-sm leading-7 text-[#805B55]">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline"
          >
            Try Again
          </button>
        )}
      </section>
    );
  }

  // Collect distinct vendors
  const vendorsMap: Record<string, string> = {};
  invoices.forEach((inv) => {
    const vKey = inv.vendorName || inv.vendorId || "Studio Architecture";
    vendorsMap[vKey] = vKey;
  });
  const vendorList = Object.keys(vendorsMap).sort();

  // Filter invoices by selected vendor
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedVendor === "ALL") return true;
    const vName = inv.vendorName || inv.vendorId || "Studio Architecture";
    return vName === selectedVendor;
  });

  const totalOutstanding = filteredInvoices.reduce((acc, inv) => {
    const isPaid = inv.status === "Paid";
    return isPaid ? acc : acc + (inv.outstandingAmount > 0 ? inv.outstandingAmount : inv.totalAmount);
  }, 0);

  const totalPaid = filteredInvoices.reduce((acc, inv) => {
    const isPaid = inv.status === "Paid";
    return isPaid ? acc + inv.totalAmount : acc + inv.paidAmount;
  }, 0);

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofFilePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPaymentProof = async () => {
    if (!paymentModalBill) return;
    setIsSubmittingProof(true);
    try {
      const proofUrl = proofFilePreview || `https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80`;
      if (onSubmitPaymentProof) {
        await onSubmitPaymentProof(paymentModalBill, proofUrl);
      }
      setSubmitSuccessMsg(`Payment proof recorded for ${paymentModalBill.invoiceNumber}. Bill marked as Paid!`);
      setTimeout(() => setSubmitSuccessMsg(null), 4000);
      setPaymentModalBill(null);
      setProofFilePreview(null);
    } catch (err) {
      console.error("Failed to submit payment proof:", err);
      alert("Failed to submit payment proof. Please try again.");
    } finally {
      setIsSubmittingProof(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Success banner */}
      {submitSuccessMsg && (
        <div className="flex items-center gap-3 border border-emerald-300 bg-emerald-50 px-5 py-4 text-emerald-900 font-mono text-xs">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{submitSuccessMsg}</span>
        </div>
      )}

      {/* Header & Vendor Dropdown */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-[#D8D6D0] pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Portal / Financial Records
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#171717] md:text-4xl">
            My Bills &amp; Invoices
          </h1>
          <p className="mt-2 text-xs text-[#77736C]">
            Review bills issued by vendors and contractors. Filter by vendor to view paid or pending bills.
          </p>
        </div>

        {/* Vendor Filter Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-xs text-[#77736C]">
            <Filter size={14} className="text-[#A58A64]" />
            <span className="uppercase tracking-wider">List of Vendors:</span>
          </div>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="border border-[#D8D6D0] bg-white px-3 py-2 font-mono text-xs text-[#171717] shadow-sm focus:border-[#A58A64] focus:outline-none"
          >
            <option value="ALL">All Vendors ({invoices.length} Bills)</option>
            {vendorList.map((v) => {
              const count = invoices.filter((i) => (i.vendorName || i.vendorId || "Studio Architecture") === v).length;
              return (
                <option key={v} value={v}>
                  {v} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Financial Summary */}
      <section
        aria-label="Financial summary"
        className="grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-3"
      >
        <div className="bg-white p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
            Total Outstanding (Pending)
          </p>
          <p className="mt-2 font-serif text-2xl font-semibold text-[#B34033]">
            {formatCurrency(totalOutstanding)}
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#999]">
            {filteredInvoices.filter((i) => i.status !== "Paid").length} pending bills
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
            Total Settled (Paid)
          </p>
          <p className="mt-2 font-serif text-2xl font-semibold text-[#2D6A4F]">
            {formatCurrency(totalPaid)}
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#999]">
            {filteredInvoices.filter((i) => i.status === "Paid").length} paid bills
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
            Active Vendor Filter
          </p>
          <p className="mt-2 font-serif text-lg text-[#171717] truncate">
            {selectedVendor === "ALL" ? "All Vendors" : selectedVendor}
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#A58A64]">
            {filteredInvoices.length} bills displayed
          </p>
        </div>
      </section>

      {/* Bill Items List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="border border-[#D8D6D0] bg-white p-12 text-center">
            <FileText size={28} className="mx-auto text-[#A58A64]/60" />
            <h3 className="mt-3 font-serif text-xl text-[#171717]">No bills found</h3>
            <p className="mt-1 text-xs text-[#77736C]">
              No bills match the selected vendor: {selectedVendor}
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = inv.status === "Paid";
            const displayVendor = inv.vendorName || inv.vendorId || "Studio Contractor";

            return (
              <article
                key={inv.id}
                className="border border-[#D8D6D0] bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                  {/* Left Column: Details */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                        {inv.invoiceNumber}
                      </span>

                      {/* Status strictly Paid or Pending */}
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 rounded bg-[#EAF1E8] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#2D6A4F] border border-emerald-200">
                          <CheckCircle2 size={11} /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-[#FBF0EA] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#B34033] border border-red-200">
                          <Clock3 size={11} /> Pending
                        </span>
                      )}

                      <span className="font-mono text-[9px] text-[#888]">
                        Vendor: <strong className="text-[#333]">{displayVendor}</strong>
                      </span>
                    </div>

                    <h3 className="font-serif text-xl text-[#171717]">
                      {inv.projectName}
                    </h3>

                    <p className="text-xs text-[#77736C]">
                      {inv.description}
                    </p>

                    <div className="flex flex-wrap gap-4 pt-1 font-mono text-[10px] text-[#999]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={12} /> Issued: {inv.issueDate}
                      </span>
                      <span>Due: {inv.dueDate}</span>
                    </div>
                  </div>

                  {/* Right Column: Amount */}
                  <div className="flex flex-col items-start lg:items-end justify-between border-t border-[#E5E2DC] pt-4 lg:border-t-0 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#888] block">
                        Bill Amount
                      </span>
                      <span className="font-serif text-2xl font-bold text-[#171717]">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                    </div>

                    {/* Inline Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {/* View Bill Preview / Lightbox */}
                      <button
                        type="button"
                        onClick={() => setPreviewBill(inv)}
                        className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#33312D] hover:bg-[#F2F0EB]"
                      >
                        <Eye size={13} /> View Bill / Photo
                      </button>

                      {/* Submit Payment Proof */}
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentModalBill(inv);
                            setProofFilePreview(null);
                          }}
                          className="inline-flex items-center gap-1.5 bg-[#171717] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64]"
                        >
                          <UploadCloud size={13} /> Submit Payment Proof
                        </button>
                      )}

                      {isPaid && (inv.paymentProofUrl || inv.fileUrl) && (
                        <button
                          type="button"
                          onClick={() => setPreviewBill(inv)}
                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-emerald-700 hover:underline"
                        >
                          <CheckCircle2 size={12} /> Receipt Attached
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Bill Preview Modal (Lightbox) */}
      {previewBill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreviewBill(null)}
          data-lenis-prevent
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[#D8D6D0] bg-[#F2F0EB] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Bill Preview · {previewBill.invoiceNumber}
                </p>
                <h3 className="font-serif text-xl text-[#171717]">{previewBill.projectName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBill(null)}
                className="flex h-8 w-8 items-center justify-center border border-[#D8D6D0] bg-white text-[#777] hover:text-[#111]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 border border-[#D8D6D0] bg-white p-4 font-mono text-xs">
                <div>
                  <span className="text-[9px] uppercase text-[#888] block">Vendor / Contractor</span>
                  <span className="font-semibold text-[#111]">{previewBill.vendorName || previewBill.vendorId || "Studio Architecture"}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-[#888] block">Total Amount</span>
                  <span className="font-serif text-lg font-bold text-[#111]">{formatCurrency(previewBill.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-[#888] block">Status</span>
                  <span className={`inline-block px-2 py-0.5 text-[9px] uppercase ${previewBill.status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                    {previewBill.status === "Paid" ? "Paid" : "Pending"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-[#888] block">Issue Date</span>
                  <span>{previewBill.issueDate}</span>
                </div>
              </div>

              {/* Show photo preview if attached */}
              {previewBill.fileUrl || previewBill.paymentProofUrl ? (
                <div className="border border-[#D8D6D0] bg-black/5 p-4 text-center">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#777] mb-2">
                    Uploaded Bill Photograph / Receipt
                  </p>
                  <img
                    src={previewBill.fileUrl || previewBill.paymentProofUrl}
                    alt="Bill Document"
                    className="max-h-[50vh] mx-auto object-contain rounded border border-[#ddd] shadow"
                  />
                </div>
              ) : (
                <div className="border border-dashed border-[#D8D6D0] bg-white p-8 text-center font-mono text-xs text-[#777]">
                  <FileText size={32} className="mx-auto text-[#A58A64]/60 mb-2" />
                  <p className="font-semibold text-[#333]">Digital Bill Voucher Recorded</p>
                  <p className="mt-1 text-[10px] text-[#888]">
                    Amount: {formatCurrency(previewBill.totalAmount)} · SAC 998321 Architectural &amp; Turnkey Execution
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewBill(null)}
                className="bg-[#171717] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Proof Upload Modal */}
      {paymentModalBill && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPaymentModalBill(null)}
          data-lenis-prevent
        >
          <div
            className="relative w-full max-w-lg border border-[#D8D6D0] bg-[#F2F0EB] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Payment Submission
                </p>
                <h3 className="font-serif text-xl text-[#171717]">
                  Submit Payment Screenshot
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalBill(null)}
                className="flex h-8 w-8 items-center justify-center border border-[#D8D6D0] bg-white text-[#777] hover:text-[#111]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="border border-[#D8D6D0] bg-white p-4 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#888]">Bill Reference:</span>
                  <span className="font-bold text-[#111]">{paymentModalBill.invoiceNumber}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[#888]">Vendor:</span>
                  <span className="text-[#111]">{paymentModalBill.vendorName || paymentModalBill.vendorId || "Studio Contractor"}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[#888]">Amount:</span>
                  <span className="font-serif text-base font-bold text-[#111]">{formatCurrency(paymentModalBill.totalAmount)}</span>
                </div>
              </div>

              {/* Photo Upload Area */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#555] mb-2">
                  Upload Payment Screenshot / UTR Receipt
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleProofFileChange}
                  className="w-full border border-[#D8D6D0] bg-white p-2 font-mono text-xs text-[#333] file:mr-3 file:border-0 file:bg-[#171717] file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:text-white hover:file:bg-[#A58A64]"
                />
              </div>

              {/* Image Thumbnail Preview */}
              {proofFilePreview && (
                <div className="border border-[#D8D6D0] bg-white p-3 text-center">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#888] mb-1">
                    Receipt Preview:
                  </p>
                  <img
                    src={proofFilePreview}
                    alt="Proof Preview"
                    className="max-h-40 mx-auto object-contain rounded border"
                  />
                </div>
              )}

              <p className="font-mono text-[9px] leading-relaxed text-[#777]">
                Upon uploading, this bill will immediately be marked as <strong>Paid</strong> across the client, vendor, and admin portals.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPaymentModalBill(null)}
                className="border border-[#D8D6D0] bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#555] hover:bg-[#e8e6e1]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingProof}
                onClick={handleConfirmPaymentProof}
                className="bg-[#171717] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50"
              >
                {isSubmittingProof ? "Updating..." : "Update Status to Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
