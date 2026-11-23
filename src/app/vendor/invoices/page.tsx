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

interface BillItem {
  id: string;
  billNumber?: string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string;
  amount: number;
  tradeCategory?: string;
  status: "PENDING" | "CASH_REQUESTED" | "PAID_CASH" | "PAID_ONLINE" | "APPROVED" | "REJECTED";
  billPhotoUrl?: string;
  paymentProofUrl?: string;
  createdAt: string;
}

interface AssignedProject {
  id: string;
  name: string;
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

  // Client Filter & Direct Architect Billing State
  const [selectedClientFilter, setSelectedClientFilter] = useState("ALL");
  const [showArchitectBillModal, setShowArchitectBillModal] = useState(false);
  const [architectBillAmount, setArchitectBillAmount] = useState("");
  const [architectBillSpecifics, setArchitectBillSpecifics] = useState("");
  const [architectBillPhotoUrl, setArchitectBillPhotoUrl] = useState("");
  const [isSubmittingArchitectBill, setIsSubmittingArchitectBill] = useState(false);

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
          clientId: proj?.clientName || "Direct Client",
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

  // Submit Direct Bill to Architect
  const handleArchitectBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!architectBillAmount || !architectBillSpecifics) return;

    setIsSubmittingArchitectBill(true);
    try {
      await apiFetch("/api/billing/bills", {
        method: "POST",
        body: JSON.stringify({
          projectId: "STUDIO-DIRECT",
          clientId: "ArcheOn Studio / Ar. Mandar Bhalekar",
          amount: parseFloat(architectBillAmount),
          tradeCategory: "Studio Direct Billing",
          description: architectBillSpecifics,
          billPhotoUrl: architectBillPhotoUrl || undefined,
        }),
      });

      setShowArchitectBillModal(false);
      setArchitectBillAmount("");
      setArchitectBillSpecifics("");
      setArchitectBillPhotoUrl("");
      setFeedback({
        type: "success",
        message: "Direct bill submitted to the Architect / Studio successfully.",
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to bill architect.",
      });
    } finally {
      setIsSubmittingArchitectBill(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID_CASH":
        return <span className="px-2.5 py-1 rounded-sm bg-[#10B981]/15 text-[#10B981] font-mono text-[10px] font-semibold">PAID (CASH)</span>;
      case "PAID_ONLINE":
        return <span className="px-2.5 py-1 rounded-sm bg-[#06B6D4]/15 text-[#06B6D4] font-mono text-[10px] font-semibold">PAID (ONLINE)</span>;
      case "CASH_REQUESTED":
        return <span className="px-2.5 py-1 rounded-sm bg-[#6366F1]/15 text-[#6366F1] font-mono text-[10px] font-semibold">CASH REQUESTED</span>;
      case "APPROVED":
        return <span className="px-2.5 py-1 rounded-sm bg-[#10B981]/15 text-[#10B981] font-mono text-[10px] font-semibold">APPROVED</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-sm bg-[#EF4444]/15 text-[#EF4444] font-mono text-[10px] font-semibold">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-sm bg-[#F59E0B]/15 text-[#D97724] font-mono text-[10px] font-semibold">PENDING</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto border-b border-[#D8D6D0] pb-6">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B68A4A]">
            Contractor Workspace // Billing Management
          </span>
          <h1 className="mt-1 font-serif text-3xl md:text-4xl text-[#111111]">
            Trade Billing & Invoices
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowArchitectBillModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FAF9F5] border border-[#B68A4A] text-[#8A6D3B] hover:bg-[#B68A4A] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors rounded-sm"
          >
            <DollarSign size={14} /> Bill to Architect (Studio Direct)
          </button>

          <button
            onClick={() => setShowUpdateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#B68A4A] text-[#B68A4A] hover:bg-[#B68A4A] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors rounded-sm"
          >
            <Camera size={14} /> Send Architect Update
          </button>

          <button
            onClick={() => setShowBillModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#25221D] text-white font-mono text-xs uppercase tracking-wider transition-all rounded-sm"
          >
            <Plus size={14} /> Submit New Bill
          </button>
        </div>
      </div>

      {/* Top Tab Bar connecting Invoices, Payments, Disputes */}
      <div className="flex border-b border-[#D8D6D0] bg-white px-6 pt-4 gap-6 max-w-7xl mx-auto shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/vendor/invoices?tab=invoices")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "invoices"
              ? "border-[#B68A4A] text-[#111111] font-semibold"
              : "border-transparent text-[#77736C] hover:text-[#111111]"
          }`}
        >
          <FileText size={15} /> Trade Bills &amp; Invoices
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
          <Banknote size={15} /> Payment History &amp; Settlements
        </button>

        <button
          type="button"
          onClick={() => router.push("/vendor/invoices?tab=disputes")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "disputes"
              ? "border-[#B68A4A] text-[#111111] font-semibold"
              : "border-transparent text-[#77736C] hover:text-[#111111]"
          }`}
        >
          <Clock size={15} /> Dispute Tracking
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
                <Users size={14} /> Assigned Clients & Site Projects
              </div>
              <span className="font-mono text-xs text-[#777777]">
                {assignedProjects.length} Active Assignments
              </span>
            </div>

            {assignedProjects.length === 0 ? (
              <div className="py-6 text-center font-mono text-xs text-[#777777]">
                No client projects assigned to your contractor account yet.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignedProjects.map((p) => (
                  <div key={p.id} className="p-4 rounded-sm border border-[#E5E2DC] bg-[#FAF9F5]">
                    <div className="font-mono text-[9px] uppercase tracking-wider text-[#B68A4A]">
                      Client: {p.clientName}
                    </div>
                    <div className="font-semibold text-sm text-[#111111] mt-1">{p.name}</div>
                    <div className="font-mono text-[10px] text-[#777777] mt-1">Ref: {p.projectReference || p.id.slice(0, 8)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submitted Bills Table */}
          <div className="max-w-7xl mx-auto rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5E2DC] pb-4 gap-3">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
                <FileText size={14} /> Submitted Bills &amp; Settlement Statuses
              </div>

              {/* Client Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase text-[#777]">Filter by Client:</span>
                <select
                  value={selectedClientFilter}
                  onChange={(e) => setSelectedClientFilter(e.target.value)}
                  className="border border-[#D8D6D0] bg-white px-2.5 py-1.5 font-mono text-xs text-[#111] focus:border-[#B68A4A] focus:outline-none"
                >
                  <option value="ALL">All Clients ({bills.length} Bills)</option>
                  {Array.from(
                    new Set([
                      ...assignedProjects.map((p) => p.clientName).filter(Boolean),
                      ...bills.map((b) => b.clientName).filter(Boolean),
                    ])
                  )
                    .sort()
                    .map((client) => {
                      const count = bills.filter((b) => (b.clientName || "Studio Client") === client).length;
                      return (
                        <option key={String(client)} value={String(client)}>
                          {String(client)} ({count})
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center font-mono text-xs text-[#B68A4A]">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                Loading submitted bills...
              </div>
            ) : bills.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs text-[#777777]">
                No bills submitted yet. Click &quot;Submit New Bill&quot; to upload your first trade bill.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[#D8D6D0] text-[#777777] uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Receipt</th>
                      <th className="py-3 px-4">Bill # / Client</th>
                      <th className="py-3 px-4">Trade</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Payment Proof</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DC]">
                    {bills
                      .filter(
                        (b) =>
                          selectedClientFilter === "ALL" ||
                          (b.clientName || "Studio Client") === selectedClientFilter
                      )
                      .map((bill) => (
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
                          <div className="font-bold text-[#111111]">{bill.billNumber || String(bill.id).slice(0, 8)}</div>
                          <div className="text-[10px] text-[#777777]">{bill.clientName || "Client"}</div>
                        </td>

                        <td className="py-3 px-4 text-[#777777]">
                          {bill.tradeCategory || "General Contractor"}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-sm text-[#111111]">
                          ₹{bill.amount.toLocaleString("en-IN")}
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
                              <Eye size={12} /> View Screenshot
                            </button>
                          ) : (
                            <span className="text-[#99958D] text-[10px]">—</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {bill.status === "PENDING" && (
                            <button
                              onClick={() => handleRequestCash(bill.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D97724] text-white hover:bg-[#B45309] font-mono text-[10px] uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50"
                            >
                              <Banknote size={12} /> Request Cash
                            </button>
                          )}
                          {bill.status === "CASH_REQUESTED" && (
                            <span className="text-[10px] text-[#6366F1] font-mono">
                              In Client Queue
                            </span>
                          )}
                          {bill.status.includes("PAID") && (
                            <span className="text-[10px] text-[#10B981] font-mono font-semibold">
                              Settled
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
            <div className="border-b border-[#E5E2DC] pb-4">
              <h2 className="font-serif text-2xl text-[#111111]">Payment Settlements &amp; Remittances</h2>
              <p className="text-xs text-[#777777] mt-1">
                Track confirmed bank payments and physical cash settlement vouchers.
              </p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#D8D6D0] text-[#777777] uppercase text-[10px] tracking-wider bg-[#FAF9F5]">
                    <th className="py-3 px-4">Bill Reference</th>
                    <th className="py-3 px-4">Project / Client</th>
                    <th className="py-3 px-4 text-right">Settled Amount</th>
                    <th className="py-3 px-4 text-center">Settlement Mode</th>
                    <th className="py-3 px-4">Settled At</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DC]">
                  {bills.filter(b => b.status.includes("PAID")).length > 0 ? (
                    bills.filter(b => b.status.includes("PAID")).map((bill) => (
                      <tr key={bill.id} className="hover:bg-[#FAF9F5]">
                        <td className="py-3 px-4 font-bold">{bill.billNumber || bill.id.slice(0, 8)}</td>
                        <td className="py-3 px-4">{bill.clientName || "Studio Client"}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">₹{bill.amount.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-4 text-center">{bill.status === "PAID_CASH" ? "Cash Handover" : "Bank Transfer (NEFT/RTGS)"}</td>
                        <td className="py-3 px-4 text-[#777777]">{new Date(bill.createdAt).toLocaleDateString("en-IN")}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Verified Settled
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#777777]">
                        No verified settlements yet. Bills will appear here once marked paid by Client or Studio.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dispute Tracking */}
      {activeTab === "disputes" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E2DC] pb-4">
              <div>
                <h2 className="font-serif text-2xl text-[#111111]">Contractor Dispute Management</h2>
                <p className="text-xs text-[#777777] mt-1">
                  Track discrepancies regarding site measurements, material deduction, or withholding claims.
                </p>
              </div>
              <button
                type="button"
                onClick={() => alert("To lodge a measurement or rate discrepancy, please send an architect update or contact Studio Operations.")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D97724] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#B45309] rounded-sm transition-colors"
              >
                <Clock size={14} /> Raise Measurement Dispute
              </button>
            </div>

            <div className="mt-6 p-4 rounded border border-[#B68A4A]/30 bg-[#FAF9F5] text-xs font-mono space-y-2">
              <div className="font-semibold text-[#B68A4A] uppercase tracking-wider">Dispute Protocol (Section 4.4):</div>
              <p className="text-[#555] leading-relaxed">
                When a dispute is raised by client or trade contractor, the associated invoice enters an immutable freeze status. No cash collection or automated reminders are permitted until resolved by Ar. Mandar Bhalekar or the nominated site supervisor.
              </p>
            </div>

            <div className="mt-4 p-8 text-center text-xs font-mono text-[#777777] border border-dashed border-[#D8D6D0]">
              No active disputes raised against your trade bills. All contractor accounts in good standing.
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

              <DualImageUpload
                label="Physical Bill Receipt Photo (Device or Drive)"
                value={billPhotoUrl}
                onChange={setBillPhotoUrl}
                placeholder="Paste Google Drive share link, Dropbox or cloud photo URL..."
              />

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

      {/* Modal: Send Architect Update (Notes / Photos) */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowUpdateModal(false)}
              className="absolute top-4 right-4 p-1 text-[#777777] hover:text-[#111111]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
              <Send size={14} /> Architect Updates Interface
            </div>
            <h2 className="font-serif text-2xl text-[#111111] mt-1">Send Site Note or Photo to Architect</h2>

            <form onSubmit={handleSendArchitectUpdate} className="mt-6 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#777777] mb-1">
                  Target Project
                </label>
                <select
                  value={updateProjectId}
                  onChange={(e) => setUpdateProjectId(e.target.value)}
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

              <DualImageUpload
                label="Site Photo Attachment (Device or Drive)"
                value={updatePhotoUrl}
                onChange={setUpdatePhotoUrl}
                placeholder="Paste Google Drive share link, Dropbox or cloud photo URL..."
              />

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#777777] mb-1">
                  Descriptive Site Note / Query
                </label>
                <textarea
                  placeholder="Report site progress, material delivery status, or technical questions for the architect..."
                  rows={3}
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  className="w-full rounded-sm border border-[#D8D6D0] px-3 py-2 text-xs text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-[#D8D6D0] font-mono text-xs uppercase tracking-wider text-[#777777] hover:bg-[#FAF9F5] rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 bg-[#B68A4A] text-white hover:bg-[#A3783A] font-mono text-xs uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Sending..." : "Send Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bill Directly to Architect */}
      {showArchitectBillModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setShowArchitectBillModal(false)}
          data-lenis-prevent
        >
          <div
            className="relative w-full max-w-lg border border-[#D8D6D0] bg-[#F2F0EB] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Principal Architect Direct Account
                </p>
                <h3 className="font-serif text-xl text-[#171717]">
                  Bill to Architect (Studio Direct)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowArchitectBillModal(false)}
                className="flex h-8 w-8 items-center justify-center border border-[#D8D6D0] bg-white text-[#777] hover:text-[#111]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleArchitectBillSubmit} className="mt-4 space-y-4 font-mono text-xs">
              <div className="rounded bg-[#FAF9F5] border border-[#EAE8E3] p-3 text-[11px] text-[#555]">
                Billed directly to: <strong>Ar. Mandar Bhalekar · ArcheOn Design Studio</strong> for architectural consultancy, retained packages, or studio-borne execution costs.
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                  Bill Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 75000"
                  value={architectBillAmount}
                  onChange={(e) => setArchitectBillAmount(e.target.value)}
                  className="w-full border border-[#D8D6D0] bg-white p-2.5 text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                  Bill Specifics &amp; Work Scope Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify bill specifics: e.g. Studio scale model prototyping, architectural mockups, sample procurement, milestone..."
                  value={architectBillSpecifics}
                  onChange={(e) => setArchitectBillSpecifics(e.target.value)}
                  className="w-full border border-[#D8D6D0] bg-white p-2.5 text-[#111] focus:border-[#A58A64] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                  Upload Bill / Invoice Document Photograph
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setArchitectBillPhotoUrl(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full border border-[#D8D6D0] bg-white p-2 text-[#333] file:mr-3 file:border-0 file:bg-[#171717] file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:text-white hover:file:bg-[#A58A64]"
                />
              </div>

              {architectBillPhotoUrl && (
                <div className="border border-[#D8D6D0] bg-white p-2 text-center">
                  <img src={architectBillPhotoUrl} alt="Bill Preview" className="max-h-32 mx-auto object-contain" />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-[#D8D6D0]">
                <button
                  type="button"
                  onClick={() => setShowArchitectBillModal(false)}
                  className="border border-[#D8D6D0] bg-white px-4 py-2 uppercase tracking-wider text-[#555] hover:bg-[#e8e6e1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingArchitectBill}
                  className="bg-[#171717] px-5 py-2 uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50"
                >
                  {isSubmittingArchitectBill ? "Submitting..." : "Submit to Architect"}
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
