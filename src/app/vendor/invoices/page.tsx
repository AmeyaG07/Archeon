"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Banknote,
  Camera,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  FileText,
  ImageIcon,
  ListFilter,
  Plus,
  RefreshCw,
  Send,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { DualImageUpload } from "@/components/ui/DualImageUpload";
import { OptionalField } from "@/components/ui/OptionalField";
import { useVendorLanguage } from "@/providers/VendorLanguageProvider";

interface BillItem {
  id: string | number;
  billId?: string;
  invoiceNumber?: string;
  billNumber?: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  tradeCategory?: string;
  status: string;
  billPhotoUrl?: string;
  paymentProofUrl?: string;
  createdAt: string;
}

interface AssignedProject {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  projectReference?: string;
}

export default function VendorInvoicesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-mono text-xs text-[#777]">Loading Vendor Invoices...</div>}>
      <VendorInvoicesContent />
    </Suspense>
  );
}

function VendorInvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "invoices";
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { t } = useVendorLanguage();

  const [bills, setBills] = useState<BillItem[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New Bill Form State
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billTradeCategory, setBillTradeCategory] = useState("Civil Contractor");
  const [billPhotoUrl, setBillPhotoUrl] = useState("");

  // Architect Update Form State
  const [updateProjectId, setUpdateProjectId] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [updatePhotoUrl, setUpdatePhotoUrl] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      // 1. Load bills from billing controller
      try {
        const res = await apiFetch("/api/billing/bills/me");
        const bRes = await res.json();
        setBills(Array.isArray(bRes) ? bRes : []);
      } catch {
        setBills([]);
      }

      // 2. Load assigned projects
      try {
        const res = await apiFetch("/api/operational-projects");
        const pRes = await res.json();
        if (Array.isArray(pRes)) {
          const pList: AssignedProject[] = pRes.map((p) => ({
            id: p.id,
            name: p.name || "Studio Project",
            clientId: p.clientId ? String(p.clientId) : undefined,
            clientName: p.clientName || "Studio Client",
            projectReference: p.projectReference,
          }));
          setAssignedProjects(pList);
          if (pList.length > 0 && !selectedProjectId) {
            setSelectedProjectId(pList[0].id);
            setUpdateProjectId(pList[0].id);
          }
        }
      } catch (pErr) {
        console.warn("Could not load projects list:", pErr);
      }
    } catch (err: unknown) {
      console.error("Failed to load vendor billing records:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadData();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadData, router]);

  // Submit New Bill
  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !billAmount) return;

    setSubmitting(true);
    try {
      const proj = assignedProjects.find((p) => p.id === selectedProjectId);
      await apiFetch("/api/billing/bills", {
        method: "POST",
        body: JSON.stringify({
          projectId: selectedProjectId,
          clientId: proj?.clientId || undefined,
          amount: parseFloat(billAmount),
          tradeCategory: billTradeCategory,
          billPhotoUrl: billPhotoUrl || undefined,
        }),
      });

      setShowBillModal(false);
      setBillAmount("");
      setBillPhotoUrl("");
      setFeedback({
        type: "success",
        message: "Bill submitted successfully. Invoice alert dispatched via WhatsApp.",
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to submit bill.",
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Request Cash Payment
  const handleRequestCash = async (billId: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/billing/bills/${billId}/request-cash`, { method: "POST" });
      setFeedback({
        type: "success",
        message: "Cash payment requested. Bill forwarded to client cash approval queue.",
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to request cash payment.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Send Architect Update (Notes / Photos)
  const handleSendArchitectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateProjectId || (!updateNote && !updatePhotoUrl)) return;

    setActionLoading(true);
    try {
      await apiFetch("/api/site-updates", {
        method: "POST",
        body: JSON.stringify({
          projectId: updateProjectId,
          authorRole: "VENDOR",
          authorName: user?.username || "Contractor",
          photoUrl: updatePhotoUrl || undefined,
          note: updateNote,
        }),
      });

      setShowUpdateModal(false);
      setUpdateNote("");
      setUpdatePhotoUrl("");
      setFeedback({
        type: "success",
        message: "Site note & photo update sent directly to the Architect.",
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to send update.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID_CASH":
        return <span className="px-2.5 py-1 rounded-sm bg-[#10B981]/15 text-[#10B981] font-mono text-[10px] font-semibold">{t("badgePaidCash")}</span>;
      case "PAID_ONLINE":
        return <span className="px-2.5 py-1 rounded-sm bg-[#06B6D4]/15 text-[#06B6D4] font-mono text-[10px] font-semibold">{t("badgePaidOnline")}</span>;
      case "CASH_REQUESTED":
        return <span className="px-2.5 py-1 rounded-sm bg-[#6366F1]/15 text-[#6366F1] font-mono text-[10px] font-semibold">{t("badgeCashRequested")}</span>;
      case "APPROVED":
        return <span className="px-2.5 py-1 rounded-sm bg-[#10B981]/15 text-[#10B981] font-mono text-[10px] font-semibold">{t("badgeApproved")}</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-sm bg-[#EF4444]/15 text-[#EF4444] font-mono text-[10px] font-semibold">{t("badgeRejected")}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-sm bg-[#F59E0B]/15 text-[#D97724] font-mono text-[10px] font-semibold">{t("badgePending")}</span>;
    }
  };

  return (
    <div className="p-3 sm:p-8 space-y-6 sm:space-y-8 max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto border-b border-[#D8D6D0] pb-6">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B68A4A]">
            {t("billingEyebrow")}
          </span>
          <h1 className="mt-1 font-serif text-3xl md:text-4xl text-[#111111]">
            {t("billingTitle")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowBillModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#25221D] text-white font-mono text-xs uppercase tracking-wider transition-all rounded-sm"
          >
            <Plus size={14} /> {t("submitNewBill")}
          </button>
        </div>
      </div>

      {/* Top Tab Bar connecting Invoices, Payments, Disputes */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-[#D8D6D0] bg-white px-4 sm:px-6 pt-4 gap-4 sm:gap-6 max-w-7xl mx-auto shadow-sm whitespace-nowrap">
        <button
          type="button"
          onClick={() => router.push("/vendor/invoices?tab=invoices")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "invoices"
              ? "border-[#B68A4A] text-[#111111] font-semibold"
              : "border-transparent text-[#77736C] hover:text-[#111111]"
          }`}
        >
          <FileText size={15} /> {t("tabTradeBills")}
        </button>

        <button
          type="button"
          onClick={() => router.push("/vendor/invoices?tab=payments")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "payments"
              ? "border-[#B68A4A] text-[#111111] font-semibold"
              : "border-transparent text-[#77736C] hover:text-[#111111]"
          }`}
        >
          <Banknote size={15} /> {t("tabPaymentHistory")}
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-sm font-mono text-xs flex items-center gap-2 ${
          feedback.type === "success"
            ? "bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981]"
            : "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]"
        }`}>
          <CheckCircle2 size={16} /> {feedback.message}
        </div>
      )}

      {/* Tab 1: Invoices */}
      {activeTab === "invoices" && (
        <>
          {/* Assigned Clients Summary */}
          <div className="max-w-7xl mx-auto rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
                <Users size={14} /> {t("assignedClientsHeader")}
              </div>
              <span className="font-mono text-xs text-[#777777]">
                {assignedProjects.length} {t("activeAssignmentsCount")}
              </span>
            </div>

            {assignedProjects.length === 0 ? (
              <div className="py-6 text-center font-mono text-xs text-[#777777]">
                {t("noClientProjectsAssigned")}
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedProjects.map((p) => (
                  <div key={p.id} className="p-4 rounded-sm border border-[#E5E2DC] bg-[#FAF9F5]">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#B68A4A]">
                      {t("clientPrefix")} {p.clientName}
                    </div>
                    <div className="font-semibold text-sm text-[#111111] mt-1">{p.name}</div>
                    <div className="font-mono text-[10px] text-[#777777] mt-1">{t("refPrefix")} {p.projectReference || String(p.id ?? "").slice(0, 8)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submitted Bills Table */}
          <div className="max-w-7xl mx-auto rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
                <FileText size={14} /> {t("submittedBillsHeader")}
              </div>
              <span className="font-mono text-xs text-[#777777]">{bills.length} {t("billsTotal")}</span>
            </div>

            {loading ? (
              <div className="py-12 text-center font-mono text-xs text-[#B68A4A]">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                {t("loadingSubmittedBills")}
              </div>
            ) : bills.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs text-[#777777]">
                {t("noBillsSubmittedYet")}
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#D8D6D0] text-[#777777] uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">{t("colReceipt")}</th>
                      <th className="py-3 px-4">{t("colBillClient")}</th>
                      <th className="py-3 px-4">{t("colTrade")}</th>
                      <th className="py-3 px-4 text-right">{t("colAmount")}</th>
                      <th className="py-3 px-4 text-center">{t("colStatus")}</th>
                      <th className="py-3 px-4">{t("colPaymentProof")}</th>
                      <th className="py-3 px-4 text-right">{t("colAction")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DC]">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-[#FAF9F5]">
                        <td className="py-3 px-4">
                          {bill.billPhotoUrl ? (
                            <button
                              onClick={() => setPreviewPhotoUrl(bill.billPhotoUrl || null)}
                              className="w-12 h-12 rounded-sm overflow-hidden border border-[#D8D6D0] shrink-0 block bg-black/5"
                            >
                              <img src={bill.billPhotoUrl} alt="Bill Receipt" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-12 h-12 rounded-sm bg-[#E5E3DE] flex items-center justify-center text-[#777777]">
                              <FileText size={16} />
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-[#111111]">{bill.invoiceNumber || bill.billNumber || bill.billId || String(bill.id ?? "").slice(0, 8)}</div>
                          <div className="text-[10px] text-[#777777]">{bill.clientName || "Client"}</div>
                        </td>

                        <td className="py-3 px-4 text-[#777777]">
                          {bill.tradeCategory || "General Contractor"}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-sm text-[#111111]">
                          ₹{Number(bill.amount || 0).toLocaleString("en-IN")}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(bill.status)}
                        </td>

                        <td className="py-3 px-4">
                          {bill.paymentProofUrl ? (
                            <button
                              onClick={() => setPreviewPhotoUrl(bill.paymentProofUrl || null)}
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-[#06B6D4] hover:underline"
                            >
                              <Eye size={12} /> {t("viewScreenshot")}
                            </button>
                          ) : (
                            <span className="text-[#99958D] text-[10px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {bill.status === "PENDING" && (
                            <button
                              onClick={() => handleRequestCash(String(bill.id))}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D97724] text-white hover:bg-[#B45309] font-mono text-[10px] uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50"
                            >
                              <Banknote size={12} /> {t("requestCash")}
                            </button>
                          )}
                          {bill.status === "CASH_REQUESTED" && (
                            <span className="text-[10px] text-[#6366F1] font-mono">
                              {t("inClientQueue")}
                            </span>
                          )}
                          {bill.status.includes("PAID") && (
                            <span className="text-[10px] text-[#10B981] font-mono font-semibold">
                              {t("settledLabel")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab 2: Payment History & Settlements */}
      {activeTab === "payments" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E2DC] pb-4">
              <div>
                <h2 className="font-serif text-2xl text-[#111111]">{t("paymentSettlementsTitle")}</h2>
                <p className="text-xs text-[#777777] mt-1">
                  {t("paymentSettlementsDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/vendor/cash-settlements")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#B68A4A] rounded-sm transition-colors"
              >
                <Banknote size={14} /> {t("openCashVouchers")} ↗
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#D8D6D0] text-[#777777] uppercase text-[10px] tracking-wider bg-[#FAF9F5]">
                    <th className="py-3 px-4">{t("colBillRef")}</th>
                    <th className="py-3 px-4">{t("colProjectClient")}</th>
                    <th className="py-3 px-4 text-right">{t("colSettledAmount")}</th>
                    <th className="py-3 px-4 text-center">{t("colSettlementMode")}</th>
                    <th className="py-3 px-4">{t("colSettledAt")}</th>
                    <th className="py-3 px-4 text-center">{t("colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC]">
                  {bills.filter(b => (b.status || "").includes("PAID")).length > 0 ? (
                    bills.filter(b => (b.status || "").includes("PAID")).map((bill) => (
                      <tr key={bill.id} className="hover:bg-[#FAF9F5]">
                        <td className="py-3 px-4 font-bold">{bill.invoiceNumber || bill.billNumber || bill.billId || String(bill.id ?? "").slice(0, 8)}</td>
                        <td className="py-3 px-4">{bill.clientName || "Studio Client"}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{Number(bill.amount || 0).toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-center">{bill.status === "PAID_CASH" ? t("cashHandover") : t("bankTransfer")}</td>
                        <td className="py-3 px-4 text-[#777777]">{new Date(bill.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {t("verifiedSettled")}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#777777]">
                        {t("noVerifiedSettlements")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Submit Bill Per Client */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowBillModal(false)}
              className="absolute top-4 right-4 p-1 text-[#777777] hover:text-[#111111]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
              <Upload size={14} /> Submit New Trade Bill
            </div>
            <h2 className="font-serif text-2xl text-[#111111] mt-1">Upload Bill for Client</h2>

            <form onSubmit={handleBillSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#777777] mb-1">
                  Assigned Client Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-sm border border-[#D8D6D0] px-3 py-2 text-xs font-mono text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                  required
                >
                  {assignedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.clientName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#777777] mb-1">
                  Bill Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  step="0.01"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full rounded-sm border border-[#D8D6D0] px-3 py-2 text-xs font-mono text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#777777] mb-1">
                  Trade Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tile Vendor, Electrical Vendor, Carpentry"
                  value={billTradeCategory}
                  onChange={(e) => setBillTradeCategory(e.target.value)}
                  className="w-full rounded-sm border border-[#D8D6D0] px-3 py-2 text-xs font-mono text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                  required
                />
              </div>

              <OptionalField label="Physical Bill Receipt Photo (Optional)">
                <DualImageUpload
                  label="Device or Drive Attachment"
                  value={billPhotoUrl}
                  onChange={setBillPhotoUrl}
                  placeholder="Paste Google Drive share link, Dropbox or cloud photo URL..."
                />
              </OptionalField>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 border border-[#D8D6D0] font-mono text-xs uppercase tracking-wider text-[#777777] hover:bg-[#FAF9F5] rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#111111] text-white hover:bg-[#B68A4A] font-mono text-xs uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill / Photo Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-sm bg-white p-2">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 text-white rounded-full hover:bg-black transition-colors"
            >
              <X size={18} />
            </button>
            <img src={previewPhotoUrl} alt="Preview" className="max-h-[85vh] w-auto object-contain rounded-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
