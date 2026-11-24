"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ProjectDetail {
  id: string;
  projectReference: string;
  name: string;
  projectType: string;
  status: string;
  clientName?: string;
  siteAddress?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  lastVisitDate?: string;
}

interface SiteUpdate {
  id: string;
  projectId: string;
  authorRole: "ARCHITECT" | "VENDOR";
  authorName: string;
  photoUrl?: string;
  note?: string;
  createdAt: string;
}

interface VendorPaymentMethod {
  id: string;
  vendorId: string;
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  qrCodeUrl?: string;
}

interface BillItem {
  id: string | number;
  billId?: string;
  invoiceNumber?: string;
  billNumber?: string;
  amount: number;
  paidAmount?: number;
  tradeCategory?: string;
  status: string; // PENDING, CASH_REQUESTED, PAID_CASH, PAID_ONLINE, APPROVED
  billPhotoUrl?: string;
  paymentProofUrl?: string;
  createdAt?: string;
  vendorId?: string;
  vendorName?: string;
}

interface VendorExpenseItem {
  vendorId: string;
  vendorName: string;
  vendorBusinessName?: string;
  tradeCategory?: string;
  settledBillsAmount?: number;
  settledBillsCount?: number;
  pendingBillsAmount?: number;
  pendingBillsCount?: number;
  totalSpending?: number;
  settledAmount?: number;
  pendingAmount?: number;
  totalBilled?: number;
  settledCount?: number;
  pendingCount?: number;
  bills?: BillItem[];
}

interface ProjectExpenseSummary {
  projectId: string;
  projectName: string;
  clientName?: string;
  totalBilled: number;
  totalSettled: number;
  totalPending: number;
  vendors: VendorExpenseItem[];
}

interface CashApprovalItem {
  id: string;
  billNumber: string;
  vendorName: string;
  projectName: string;
  amount: number;
  tradeCategory: string;
  status: string;
  billPhotoUrl?: string;
  requestedAt?: string;
}

export default function ClientProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ProjectExpenseSummary | null>(null);
  const [allProjectBills, setAllProjectBills] = useState<BillItem[]>([]);
  const [cashQueue, setCashQueue] = useState<CashApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected vendor payment modal
  const [selectedVendorPayment, setSelectedVendorPayment] = useState<{
    vendorName: string;
    details: VendorPaymentMethod | null;
  } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Bill preview modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Copied UPI state
  const [copiedUpi, setCopiedUpi] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // 1. Project details
      try {
        const res = await apiFetch(`/api/operational-projects/${projectId}`);
        const proj = await res.json();
        setProject(proj);
      } catch (err) {
        console.error("Failed to load project details:", err);
      }

      // 2. Site updates (Architect notes & progress photos)
      try {
        const res = await apiFetch(`/api/site-updates/projects/${projectId}`);
        const uList = await res.json();
        setUpdates(Array.isArray(uList) ? uList : []);
      } catch {
        setUpdates([]);
      }

      // 3. Project Expenses & Vendor Breakdown
      try {
        const res = await apiFetch(`/api/billing/project/${projectId}/expenses`);
        const exp = await res.json();
        setExpenseSummary(exp);
      } catch {
        setExpenseSummary(null);
      }

      // 4. Cash approval queue
      try {
        const res = await apiFetch(`/api/billing/cash-queue`);
        const qRes = await res.json();
        setCashQueue(Array.isArray(qRes) ? qRes : []);
      } catch {
        setCashQueue([]);
      }

      // 5. All Project Bills (sorted latest first)
      try {
        const res = await apiFetch(`/api/billing/bills?projectId=${projectId}`);
        const bList = await res.json();
        if (Array.isArray(bList)) {
          const sorted = [...bList].sort((a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setAllProjectBills(sorted);
        } else {
          setAllProjectBills([]);
        }
      } catch (bErr) {
        console.warn("Could not load project bills:", bErr);
        setAllProjectBills([]);
      }
    } catch (err: unknown) {
      console.error("Failed to load client project workspace:", err);
      setErrorMsg("Failed to load project details.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // View vendor payment details
  const handleViewPaymentDetails = async (vendorId: string, vendorName: string) => {
    setPaymentLoading(true);
    setSelectedVendorPayment({ vendorName, details: null });
    try {
      const res = await apiFetch(`/api/vendor-payment-methods/vendor/${vendorId}`);
      const pm = await res.json();
      setSelectedVendorPayment({ vendorName, details: pm });
    } catch (err) {
      console.warn("No payment details found for vendor:", err);
      setSelectedVendorPayment({ vendorName, details: null });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Cash Approve
  const handleApproveCash = async (billId: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/billing/bills/${billId}/cash-approve`, { method: "POST" });
      setMessage("Cash payment approved. Bill marked as PAID_CASH.");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to approve cash payment:", err);
      setErrorMsg("Failed to approve cash payment.");
    } finally {
      setActionLoading(false);
      setTimeout(() => {
        setMessage(null);
        setErrorMsg(null);
      }, 4000);
    }
  };

  // Cash Reject
  const handleRejectCash = async (billId: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/billing/bills/${billId}/cash-reject`, { method: "POST" });
      setMessage("Cash request rejected. Bill reverted to PENDING status.");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to reject cash payment:", err);
      setErrorMsg("Failed to reject cash payment.");
    } finally {
      setActionLoading(false);
      setTimeout(() => {
        setMessage(null);
        setErrorMsg(null);
      }, 4000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Vendor name lookup map from expense summary
  const vendorNameMap = React.useMemo(() => {
    const map = new Map<string, string>();
    if (expenseSummary?.vendors) {
      expenseSummary.vendors.forEach((v) => {
        const name = v.vendorBusinessName || v.vendorName;
        if (v.vendorId) map.set(v.vendorId.toLowerCase(), name);
        if (v.tradeCategory) map.set(v.tradeCategory.toLowerCase(), name);
      });
    }
    return map;
  }, [expenseSummary]);

  // Derived or combined bills, ensuring latest first
  const displayedBills: BillItem[] = React.useMemo(() => {
    let list: BillItem[] = [];
    if (allProjectBills && allProjectBills.length > 0) {
      list = [...allProjectBills];
    } else if (expenseSummary?.vendors) {
      expenseSummary.vendors.forEach((v) => {
        (v.bills || []).forEach((b) => {
          list.push({
            ...b,
            vendorName: v.vendorBusinessName || v.vendorName,
            tradeCategory: b.tradeCategory || v.tradeCategory,
          });
        });
      });
    }
    return list.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [allProjectBills, expenseSummary]);

  if (loading && !project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-[#B68A4A]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading Project Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8D6D0] pb-6">
        <button
          onClick={() => router.push("/client/projects")}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#777777] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft size={14} /> Back to My Projects
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider px-3 py-1 rounded-sm bg-[#B68A4A]/10 text-[#B68A4A] border border-[#B68A4A]/30 font-semibold">
            {project?.status || "UNDER EXECUTION"}
          </span>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-4 rounded-sm bg-[#10B981]/10 border border-[#10B981]/30 font-mono text-xs text-[#10B981]">
          <CheckCircle2 size={14} /> {message}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-sm bg-[#EF4444]/10 border border-[#EF4444]/30 font-mono text-xs text-[#EF4444]">
          <XCircle size={14} /> {errorMsg}
        </div>
      )}

      {/* Hero Overview */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#B68A4A]">
              ArcheOn Client Workspace // {project?.projectType || "Residential Architecture"}
            </div>
            <h1 className="mt-1 font-serif text-3xl md:text-4xl text-[#111111]">{project?.name}</h1>
            {project?.siteAddress && (
              <p className="mt-2 font-mono text-xs text-[#777777]">Site Location: {project.siteAddress}</p>
            )}
          </div>

          {/* Last Architect Visit Highlight Card */}
          <div className="rounded-sm border border-[#B68A4A]/30 bg-[#FAF9F5] p-5 lg:min-w-[280px]">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[#B68A4A]">
              <CalendarDays size={14} /> Last Architect Site Visit
            </div>
            <div className="mt-2 font-mono text-xl font-bold text-[#111111]">
              {project?.lastVisitDate
                ? new Date(project.lastVisitDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Scheduled Soon"}
            </div>
            <p className="mt-1 text-[11px] text-[#777777]">
              Supervised on-site by Ar. Mandar Bhalekar
            </p>
          </div>
        </div>

        {/* Expenses Summary Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#D8D6D0] pt-6">
          <div className="rounded-sm bg-[#FAF9F5] p-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777]">Total Billed by Vendors</span>
            <div className="mt-1 font-mono text-2xl font-bold text-[#111111]">
              ₹{expenseSummary?.totalBilled?.toLocaleString("en-IN") || "0"}
            </div>
          </div>
          <div className="rounded-sm bg-[#10B981]/5 border border-[#10B981]/20 p-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#10B981]">Total Settled</span>
            <div className="mt-1 font-mono text-2xl font-bold text-[#10B981]">
              ₹{expenseSummary?.totalSettled?.toLocaleString("en-IN") || "0"}
            </div>
          </div>
          <div className="rounded-sm bg-[#D97724]/5 border border-[#D97724]/20 p-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#D97724]">Pending Settlement</span>
            <div className="mt-1 font-mono text-2xl font-bold text-[#D97724]">
              ₹{expenseSummary?.totalPending?.toLocaleString("en-IN") || "0"}
            </div>
          </div>
        </div>
      </div>

      {/* All Project Bills & Invoices (Sorted Latest First) */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D8D6D0] pb-4 gap-2">
          <div className="flex items-center gap-2">
            <FileText className="text-[#B68A4A]" size={18} />
            <div>
              <h2 className="font-serif text-xl text-[#111111]">Project Bills & Invoices</h2>
              <p className="font-mono text-[10px] text-[#777777]">
                Chronological record of submitted trade partner bills (Latest first)
              </p>
            </div>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-sm bg-[#B68A4A]/10 text-[#B68A4A] border border-[#B68A4A]/30 font-semibold self-start sm:self-auto">
            {displayedBills.length} Bills Listed
          </span>
        </div>

        {displayedBills.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-[#777777]">
            No bills or invoices submitted for this project yet.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[#E5E3DE]">
            {displayedBills.map((b) => {
              const billNum = b.invoiceNumber || b.billNumber || b.billId || "BILL";
              const vName = b.vendorName || vendorNameMap.get((b.vendorId || "").toLowerCase()) || "Trade Partner";
              const isPaid = b.status === "PAID_ONLINE" || b.status === "PAID_CASH" || b.status === "PAID";
              const isCashReq = b.status === "CASH_REQUESTED";
              const isApproved = b.status === "APPROVED";

              return (
                <div key={b.id || billNum} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {b.billPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(b.billPhotoUrl || null)}
                        className="group relative w-14 h-14 rounded-sm overflow-hidden border border-[#D8D6D0] bg-black/5 shrink-0"
                        title="View bill photo"
                      >
                        <img src={b.billPhotoUrl} alt="Bill" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                          <Eye size={14} />
                        </div>
                      </button>
                    ) : (
                      <div className="w-14 h-14 rounded-sm bg-[#E5E3DE] flex items-center justify-center text-[#777777] shrink-0">
                        <FileText size={18} />
                      </div>
                    )}

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-[#111111]">{vName}</span>
                        {b.tradeCategory && (
                          <span className="font-mono text-[10px] text-[#777777] px-2 py-0.5 rounded-sm bg-[#E5E3DE]">
                            {b.tradeCategory}
                          </span>
                        )}
                        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-sm font-semibold uppercase ${
                          isPaid
                            ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                            : isCashReq
                            ? "bg-[#D97724]/15 text-[#D97724] border border-[#D97724]/30"
                            : isApproved
                            ? "bg-[#0284C7]/15 text-[#0284C7] border border-[#0284C7]/30"
                            : "bg-[#777777]/10 text-[#777777] border border-[#777777]/20"
                        }`}>
                          {b.status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="mt-1 font-mono text-xs text-[#777777]">
                        Invoice #{billNum} • Issued on {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Today"}
                      </p>
                      <div className="mt-1 font-mono text-lg font-bold text-[#111111]">
                        ₹{Number(b.amount || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {b.billPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(b.billPhotoUrl || null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#B68A4A] text-[#B68A4A] hover:bg-[#B68A4A] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors rounded-sm"
                      >
                        <Eye size={14} /> View Receipt Photo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Progress Photos Gallery & Architect Notes */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
          <div className="flex items-center gap-2">
            <Camera className="text-[#B68A4A]" size={18} />
            <h2 className="font-serif text-xl text-[#111111]">Project Progress Gallery & Architect Notes</h2>
          </div>
          <span className="font-mono text-xs text-[#777777]">
            {(Array.isArray(updates) ? updates : []).filter((u) => u.authorRole === "ARCHITECT").length} Site Updates
          </span>
        </div>

        {(Array.isArray(updates) ? updates : []).filter((u) => u.authorRole === "ARCHITECT").length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-[#777777]">
            No progress updates posted yet. Photos and notes will appear here once the architect visits the site.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Array.isArray(updates) ? updates : [])
              .filter((u) => u.authorRole === "ARCHITECT")
              .map((u) => (
                <div key={u.id} className="group rounded-sm border border-[#D8D6D0] overflow-hidden bg-[#FAF9F5] shadow-xs">
                  {u.photoUrl ? (
                    <button
                      onClick={() => setPreviewPhotoUrl(u.photoUrl || null)}
                      className="block relative w-full h-48 overflow-hidden bg-black/10"
                    >
                      <img src={u.photoUrl} alt="Progress" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-mono text-xs">
                        <Eye size={16} className="mr-1.5" /> View Photo
                      </div>
                    </button>
                  ) : (
                    <div className="h-32 w-full flex items-center justify-center bg-[#E5E3DE] text-[#777777]">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#777777]">
                      <span>{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="text-[#B68A4A]">{u.authorName}</span>
                    </div>
                    <p className="mt-2 text-xs text-[#333333] leading-relaxed whitespace-pre-line">
                      {u.note || "Site progress update."}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Assigned Vendor List & Expense Breakdown */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
          <div className="flex items-center gap-2">
            <Users className="text-[#B68A4A]" size={18} />
            <h2 className="font-serif text-xl text-[#111111]">Assigned Vendors & Expense Breakdown</h2>
          </div>
          <span className="font-mono text-xs text-[#777777]">
            {expenseSummary?.vendors?.length || 0} Vendors Assigned
          </span>
        </div>

        {!expenseSummary?.vendors || expenseSummary.vendors.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-[#777777]">
            No vendors with billing activity recorded on this project yet.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {expenseSummary.vendors.map((vendor) => {
              const vName = vendor.vendorBusinessName || vendor.vendorName || "Contractor";
              const sAmt = Number(vendor.settledBillsAmount ?? vendor.settledAmount ?? 0);
              const sCnt = Number(vendor.settledBillsCount ?? vendor.settledCount ?? 0);
              const pAmt = Number(vendor.pendingBillsAmount ?? vendor.pendingAmount ?? 0);
              const pCnt = Number(vendor.pendingBillsCount ?? vendor.pendingCount ?? 0);
              const tot = Number(vendor.totalSpending ?? vendor.totalBilled ?? (sAmt + pAmt));

              return (
              <div key={vendor.vendorId} className="rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E5E3DE] pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-base text-[#111111]">{vName}</h3>
                      <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded-sm bg-[#B68A4A]/10 text-[#B68A4A] border border-[#B68A4A]/20">
                        {vendor.tradeCategory || "Contractor"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[#777777]">
                      Total Spending: <span className="font-bold text-[#111111]">₹{tot.toLocaleString("en-IN")}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleViewPaymentDetails(vendor.vendorId, vName)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-[#B68A4A] text-[#B68A4A] hover:bg-[#B68A4A] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors rounded-sm"
                    >
                      <CreditCard size={14} /> View Bank & QR Details
                    </button>
                  </div>
                </div>

                {/* Breakdown Metrics */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-sm border border-[#E5E3DE]">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#10B981]">Settled Bills</span>
                    <div className="font-mono text-base font-bold text-[#10B981] mt-1">
                      ₹{sAmt.toLocaleString("en-IN")}
                    </div>
                    <span className="text-[10px] text-[#777777]">{sCnt} bills settled</span>
                  </div>

                  <div className="bg-white p-3 rounded-sm border border-[#E5E3DE]">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#D97724]">Pending Bills</span>
                    <div className="font-mono text-base font-bold text-[#D97724] mt-1">
                      ₹{pAmt.toLocaleString("en-IN")}
                    </div>
                    <span className="text-[10px] text-[#777777]">{pCnt} bills pending</span>
                  </div>

                  <div className="bg-white p-3 rounded-sm border border-[#E5E3DE] sm:col-span-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[#777777]">Total Attributed Spending</span>
                    <div className="font-mono text-base font-bold text-[#111111] mt-1">
                      ₹{tot.toLocaleString("en-IN")}
                    </div>
                    <span className="text-[10px] text-[#777777]">Across all project milestones</span>
                  </div>
                </div>

                {/* Submitted Bills with Photos */}
                {vendor.bills && vendor.bills.length > 0 && (
                  <div className="mt-4 border-t border-[#E5E3DE] pt-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777]">Submitted Bills & Receipts:</span>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {vendor.bills.map((b) => (
                        <div key={b.id} className="flex items-center gap-3 p-2 bg-white rounded-sm border border-[#E5E3DE]">
                          {b.billPhotoUrl ? (
                            <button
                              onClick={() => setPreviewPhotoUrl(b.billPhotoUrl || null)}
                              className="w-10 h-10 rounded-sm overflow-hidden border border-[#D8D6D0] shrink-0"
                            >
                              <img src={b.billPhotoUrl} alt="Bill" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-sm bg-[#E5E3DE] flex items-center justify-center text-[#777777] shrink-0">
                              <FileText size={14} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1 font-mono text-[11px]">
                            <div className="font-bold text-[#111111]">₹{Number(b.amount || 0).toLocaleString("en-IN")}</div>
                            <span className={`inline-block px-1.5 py-0.2 rounded-xs text-[9px] uppercase ${
                              b.status.includes("PAID") ? "bg-[#10B981]/15 text-[#10B981]" : "bg-[#D97724]/15 text-[#D97724]"
                            }`}>
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cash Payment Approval Queue (Requirement: Moved to the end of the page) */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="text-[#D97724]" size={18} />
            <h2 className="font-serif text-xl text-[#111111]">Cash Payment Approval Queue</h2>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 rounded-sm bg-[#D97724]/10 text-[#D97724] border border-[#D97724]/30 font-semibold">
            {cashQueue.length} Pending Approval
          </span>
        </div>

        {cashQueue.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-[#777777]">
            No cash payment requests pending your review. All settled or processed via online transfer.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[#E5E3DE]">
            {cashQueue.map((item) => (
              <div key={item.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {item.billPhotoUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoUrl(item.billPhotoUrl || null)}
                      className="group relative w-16 h-16 rounded-sm overflow-hidden border border-[#D8D6D0] bg-black/5 shrink-0"
                    >
                      <img src={item.billPhotoUrl} alt="Bill" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                        <Eye size={14} />
                      </div>
                    </button>
                  ) : (
                    <div className="w-16 h-16 rounded-sm bg-[#E5E3DE] flex items-center justify-center text-[#777777] shrink-0">
                      <FileText size={18} />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#111111]">{item.vendorName}</span>
                      <span className="font-mono text-[10px] text-[#777777] px-2 py-0.5 rounded-sm bg-[#E5E3DE]">
                        {item.tradeCategory || "Contractor"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[#777777]">
                      Bill #{item.billNumber} • Requested on {item.requestedAt ? new Date(item.requestedAt).toLocaleDateString("en-IN") : "Today"}
                    </p>
                    <div className="mt-1 font-mono text-lg font-bold text-[#111111]">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleRejectCash(item.id)}
                    disabled={actionLoading}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-50 rounded-sm"
                  >
                    <X size={14} /> Reject
                  </button>
                  <button
                    onClick={() => handleApproveCash(item.id)}
                    disabled={actionLoading}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-[#10B981] text-white hover:bg-[#059669] font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-50 rounded-sm"
                  >
                    <Check size={14} /> Approve Cash
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vendor Payment Method Modal (Bank + QR + UPI) */}
      {selectedVendorPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setSelectedVendorPayment(null)}
              className="absolute top-4 right-4 p-1 text-[#777777] hover:text-[#111111] transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
              <CreditCard size={14} /> Direct Vendor Payment Information
            </div>
            <h3 className="font-serif text-2xl text-[#111111] mt-1">
              {selectedVendorPayment.vendorName}
            </h3>

            {paymentLoading ? (
              <div className="py-12 text-center font-mono text-xs text-[#B68A4A]">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                Loading Payment Details...
              </div>
            ) : selectedVendorPayment.details ? (
              <div className="mt-6 space-y-6">
                {/* Bank Account Details */}
                <div className="rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777] block mb-2 font-semibold">
                    Bank Account Details (NEFT / RTGS / IMPS)
                  </span>
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#777777]">Account Holder:</span>
                      <span className="font-semibold text-[#111111]">
                        {selectedVendorPayment.details.accountHolderName || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777777]">Bank Name:</span>
                      <span className="font-semibold text-[#111111]">
                        {selectedVendorPayment.details.bankName || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777777]">Account Number:</span>
                      <span className="font-semibold text-[#111111]">
                        {selectedVendorPayment.details.accountNumber || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777777]">IFSC Code:</span>
                      <span className="font-semibold text-[#111111]">
                        {selectedVendorPayment.details.ifscCode || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* QR Code & UPI Details */}
                <div className="rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] p-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777] block mb-3 font-semibold">
                    UPI & QR Code Payment (Instant)
                  </span>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {selectedVendorPayment.details.qrCodeUrl ? (
                      <div className="p-2 bg-white rounded-sm border border-[#D8D6D0] shadow-xs">
                        <img
                          src={selectedVendorPayment.details.qrCodeUrl}
                          alt="Vendor UPI QR Code"
                          className="w-36 h-36 object-contain"
                        />
                        <span className="block text-center font-mono text-[8px] text-[#777777] mt-1">
                          Scan with any UPI app
                        </span>
                      </div>
                    ) : (
                      <div className="w-36 h-36 bg-[#E5E3DE] rounded-sm flex flex-col items-center justify-center text-[#777777] p-2 text-center">
                        <QrCode size={28} className="mb-1" />
                        <span className="text-[10px]">No QR code uploaded</span>
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-3 font-mono text-xs">
                      <div>
                        <span className="text-[#777777] text-[10px] uppercase">Vendor UPI ID:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            readOnly
                            value={selectedVendorPayment.details.upiId || "Not configured"}
                            className="w-full rounded-sm border border-[#D8D6D0] bg-white px-3 py-1.5 font-mono text-xs font-semibold text-[#111111]"
                          />
                          {selectedVendorPayment.details.upiId && (
                            <button
                              onClick={() => copyToClipboard(selectedVendorPayment.details?.upiId || "")}
                              className="p-2 border border-[#D8D6D0] rounded-sm hover:bg-[#E5E3DE] transition-colors"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? <Check size={14} className="text-[#10B981]" /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[10px] text-[#777777] leading-relaxed">
                        After transferring funds online, send the screenshot receipt on WhatsApp or notify the architect to reconcile the invoice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center font-mono text-xs text-[#777777]">
                This vendor has not configured their bank details or QR code yet. Please contact the studio for wire instructions.
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedVendorPayment(null)}
                className="px-6 py-2 bg-[#111111] text-white hover:bg-[#B68A4A] font-mono text-xs uppercase tracking-wider transition-colors rounded-sm"
              >
                Close
              </button>
            </div>
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
