"use client";

import React, { useState, useCallback } from "react";
import {
  MapPin,
  CalendarDays,
  FolderOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Camera,
  ImageIcon,
  Eye,
  Users,
  CreditCard,
  DollarSign,
  Check,
  X,
  RefreshCw,
  QrCode,
  Copy,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export type ClientProjectStatus =
  | "Planning"
  | "Under Design"
  | "Under Execution"
  | "On Hold"
  | "Completed";

export interface ClientProject {
  id: string;
  projectReference?: string;
  projectName: string;
  projectType: string;
  location: string;
  status: ClientProjectStatus;
  startDate?: string;
  expectedCompletion?: string;
  lastVisitDate?: string;
  projectManager?: string;
  description?: string;
  progressPercentage?: number;
}

interface SiteUpdateItem {
  id: string;
  authorRole: string;
  authorName: string;
  photoUrl?: string;
  note?: string;
  createdAt: string;
}

interface BillItem {
  id: string | number;
  billId?: string;
  invoiceNumber?: string;
  billNumber?: string;
  amount: number;
  tradeCategory?: string;
  status: string;
  billPhotoUrl?: string;
  createdAt?: string;
  vendorId?: string;
  vendorName?: string;
}

interface VendorBreakdown {
  vendorId: string;
  vendorName?: string;
  vendorBusinessName?: string;
  tradeCategory?: string;
  settledBillsAmount?: number;
  settledAmount?: number;
  settledBillsCount?: number;
  settledCount?: number;
  pendingBillsAmount?: number;
  pendingAmount?: number;
  pendingBillsCount?: number;
  pendingCount?: number;
  totalSpending?: number;
  totalBilled?: number;
}

interface ExpenseSummary {
  totalBilled: number;
  totalSettled: number;
  totalPending: number;
  vendors: VendorBreakdown[];
}

interface CashQueueItem {
  id: string;
  billNumber: string;
  vendorName: string;
  projectName?: string;
  amount: number;
  tradeCategory?: string;
  billPhotoUrl?: string;
  requestedAt?: string;
}

interface VendorPaymentMethod {
  accountHolderName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  qrCodeUrl?: string;
}

interface LoadedProjectWorkspace {
  loading: boolean;
  lastVisitDate?: string;
  updates: SiteUpdateItem[];
  expenseSummary: ExpenseSummary | null;
  bills: BillItem[];
  cashQueue: CashQueueItem[];
}

interface ClientProjectOverviewProps {
  projects: ClientProject[];
  loading?: boolean;
  error?: string;
  onOpenProject?: (project: ClientProject) => void;
  onRetry?: () => void;
}

const statusStyles: Record<ClientProjectStatus, string> = {
  Planning: "bg-[#EAE7DF] text-[#71664F]",
  "Under Design": "bg-[#E7EDF2] text-[#526B80]",
  "Under Execution": "bg-[#E9EFE6] text-[#58724F]",
  "On Hold": "bg-[#F5EAE5] text-[#99634F]",
  Completed: "bg-[#E7ECE8] text-[#526D5A]",
};

function formatDateReadable(iso?: string): string {
  if (!iso) return "Scheduled Soon";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ClientProjectOverview({
  projects,
  loading = false,
  error,
  onRetry,
}: ClientProjectOverviewProps) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Record<string, LoadedProjectWorkspace>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Modals (Lightbox & Vendor Bank/QR)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [selectedVendorPayment, setSelectedVendorPayment] = useState<{
    vendorName: string;
    details: VendorPaymentMethod | null;
  } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const loadWorkspaceForProject = useCallback(async (projectId: string, fallbackLastVisit?: string) => {
    setWorkspaces((prev) => ({
      ...prev,
      [projectId]: {
        loading: true,
        lastVisitDate: prev[projectId]?.lastVisitDate || fallbackLastVisit,
        updates: prev[projectId]?.updates || [],
        expenseSummary: prev[projectId]?.expenseSummary || null,
        bills: prev[projectId]?.bills || [],
        cashQueue: prev[projectId]?.cashQueue || [],
      },
    }));

    const [projRes, updRes, expRes, billsRes, cashRes] = await Promise.all([
      apiFetch(`/api/operational-projects/${projectId}`).catch(() => null),
      apiFetch(`/api/site-updates/projects/${projectId}`).catch(() => null),
      apiFetch(`/api/billing/project/${projectId}/expenses`).catch(() => null),
      apiFetch(`/api/billing/bills?projectId=${projectId}`).catch(() => null),
      apiFetch(`/api/billing/cash-queue`).catch(() => null),
    ]);

    const projData = projRes && projRes.ok ? await projRes.json().catch(() => null) : null;
    const updData = updRes && updRes.ok ? await updRes.json().catch(() => []) : [];
    const expData = expRes && expRes.ok ? await expRes.json().catch(() => null) : null;
    const billsData = billsRes && billsRes.ok ? await billsRes.json().catch(() => []) : [];
    const cashData = cashRes && cashRes.ok ? await cashRes.json().catch(() => []) : [];

    const sortedBills = Array.isArray(billsData)
      ? [...billsData].sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      : [];

    setWorkspaces((prev) => ({
      ...prev,
      [projectId]: {
        loading: false,
        lastVisitDate: projData?.lastVisitDate || fallbackLastVisit,
        updates: Array.isArray(updData) ? updData : [],
        expenseSummary: expData,
        bills: sortedBills,
        cashQueue: Array.isArray(cashData) ? cashData : [],
      },
    }));
  }, []);

  const handleToggleProject = (project: ClientProject) => {
    if (expandedProjectId === project.id) {
      setExpandedProjectId(null);
      return;
    }
    setExpandedProjectId(project.id);
    loadWorkspaceForProject(project.id, project.lastVisitDate);
  };

  const handleViewPaymentDetails = async (vendorId: string, vendorName: string) => {
    setPaymentLoading(true);
    setSelectedVendorPayment({ vendorName, details: null });
    try {
      const res = await apiFetch(`/api/vendor-payment-methods/vendor/${vendorId}`);
      if (res.ok && res.status !== 204) {
        const pm = await res.json();
        setSelectedVendorPayment({ vendorName, details: pm });
      }
    } catch {
      setSelectedVendorPayment({ vendorName, details: null });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleApproveCash = async (projectId: string, billId: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/billing/bills/${billId}/cash-approve`, { method: "POST" });
      setActionMessage({ type: "ok", text: "Cash payment approved cleanly." });
      await loadWorkspaceForProject(projectId);
    } catch {
      setActionMessage({ type: "err", text: "Failed to approve cash payment." });
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleRejectCash = async (projectId: string, billId: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/billing/bills/${billId}/cash-reject`, { method: "POST" });
      setActionMessage({ type: "ok", text: "Cash request declined and reverted to pending." });
      await loadWorkspaceForProject(projectId);
    } catch {
      setActionMessage({ type: "err", text: "Failed to reject cash payment." });
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <section className="min-h-screen bg-[#F2F0EB] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#A58A64]">
              Client Workspace / Projects
            </p>
            <h1 className="mt-3 font-serif text-4xl text-[#111111] md:text-5xl">
              Your Projects
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
              Inspect your project overview, architect site visits, vendor expense breakdowns, bills, and progress photos right here in each tile.
            </p>
          </div>

          <span className="font-mono text-xs text-[#77736C]">
            {projects.length} {projects.length === 1 ? "PROJECT" : "PROJECTS"}
          </span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-24 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#D8D6D0] border-t-[#A58A64]" />
            <p className="mt-5 text-sm text-[#77736C]">Loading your projects...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div role="alert" className="mt-8 border border-[#E3C9C5] bg-[#FAF3F1] p-7">
            <h2 className="font-serif text-2xl text-[#773B34]">Projects could not be loaded</h2>
            <p className="mt-2 text-sm text-[#805B55]">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline underline-offset-4 cursor-pointer"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="mt-10 border border-[#D8D6D0] bg-white px-6 py-20 text-center">
            <FolderOpen size={34} strokeWidth={1.2} className="mx-auto text-[#A58A64]" />
            <h2 className="mt-6 font-serif text-2xl text-[#171717]">No projects assigned</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#77736C]">
              Projects assigned to your account will appear here. Contact the studio if you believe something is missing.
            </p>
          </div>
        )}

        {/* Project Cards with Inline Details Expansion */}
        {!loading && !error && projects.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6">
            {projects.map((project) => {
              const isExpanded = expandedProjectId === project.id;
              const ws = workspaces[project.id];
              const architectUpdates = (ws?.updates || []).filter((u) => u.authorRole === "ARCHITECT");

              return (
                <article
                  key={project.id}
                  className={`border bg-white p-6 sm:p-8 transition-all duration-300 ${isExpanded
                    ? "border-[#A58A64] shadow-md"
                    : "border-[#D8D6D0] hover:border-[#B68A4A]"
                    }`}
                >
                  {/* Top Summary Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                      Project / {project.projectReference || project.id}
                    </span>
                    <span className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-mono ${statusStyles[project.status]}`}>
                      {project.status}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <h2 className="font-serif text-3xl leading-tight text-[#171717] md:text-4xl">
                        {project.projectName}
                      </h2>
                      <p className="font-mono text-xs uppercase tracking-wider text-[#77736C]">
                        {project.projectType.replace(/_/g, " ")}
                      </p>
                      {project.description && (
                        <p className="pt-2 text-sm leading-7 text-[#55514A]">{project.description}</p>
                      )}
                    </div>

                    {/* Metadata Box */}
                    <div className="min-w-0 md:min-w-[270px] space-y-3 rounded-sm border border-[#EFECE6] bg-[#FAF9F6] p-4">
                      <Metadata icon={<MapPin size={15} />} label="Location" value={project.location} />
                      {project.projectManager && (
                        <Metadata icon={<FileText size={15} />} label="Architect / Lead" value={project.projectManager} />
                      )}
                      {project.startDate && (
                        <Metadata icon={<CalendarDays size={15} />} label="Start Date" value={project.startDate} />
                      )}
                      {project.expectedCompletion && (
                        <Metadata icon={<CalendarDays size={15} />} label="Target Date" value={project.expectedCompletion} />
                      )}
                    </div>
                  </div>

                  {/* Milestone Completion */}
                  <div className="mt-6 border-t border-[#E5E2DC] pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-mono text-xs uppercase tracking-widest text-[#4F4B45]">
                        Milestone Completion
                      </p>
                      <span className="font-mono text-xs font-semibold text-[#171717]">
                        {Math.max(0, Math.min(100, Math.round(project.progressPercentage ?? 0)))}%
                      </span>
                    </div>
                    <div
                      className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#ECEAE5]"
                      role="progressbar"
                      aria-valuenow={Math.max(0, Math.min(100, Math.round(project.progressPercentage ?? 0)))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Project milestone completion"
                    >
                      <div
                        className="h-full bg-[#A58A64] transition-all duration-300"
                        style={{
                          width: `${Math.max(0, Math.min(100, Math.round(project.progressPercentage ?? 0)))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Trigger Row: View Details / Hide Details (No Redirection!) */}
                  <button
                    type="button"
                    onClick={() => handleToggleProject(project)}
                    aria-expanded={isExpanded}
                    className="mt-7 flex w-full items-center justify-between border-t border-[#E5E2DC] pt-5 text-left group cursor-pointer"
                  >
                    <span className="font-mono text-xs uppercase tracking-widest font-semibold text-[#171717] group-hover:text-[#A58A64] transition-colors">
                      {isExpanded ? "Hide Details" : "View Details"}
                    </span>

                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D8D6D0] text-[#A58A64] group-hover:border-[#A58A64] group-hover:bg-[#FAF8F5] transition-colors">
                      {isExpanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                    </span>
                  </button>

                  {/* EXPANDED INLINE WORKSPACE INSIDE THE SAME TILE */}
                  {isExpanded && (
                    <div className="mt-7 space-y-7 border-t border-[#D8D6D0] pt-7">
                      {actionMessage && (
                        <div
                          className={`flex items-center gap-2 rounded-sm border p-3.5 font-mono text-xs ${actionMessage.type === "ok"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-800"
                            }`}
                        >
                          {actionMessage.type === "ok" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          <span>{actionMessage.text}</span>
                        </div>
                      )}

                      {ws?.loading && !ws.expenseSummary && ws.bills.length === 0 ? (
                        <div className="py-12 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-widest text-[#A58A64]">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading Project Details...
                        </div>
                      ) : (
                        <>
                          {/* 1. Financial Summary & Site Visit Highlight */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="rounded-sm border border-[#B68A4A]/40 bg-[#FAF8F5] p-4">
                              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#9F7947] font-semibold">
                                <CalendarDays size={13} /> Last Site Visit
                              </div>
                              <p className="mt-2 font-serif text-xl text-[#171717]">
                                {formatDateReadable(ws?.lastVisitDate || project.lastVisitDate)}
                              </p>
                              <p className="mt-1 text-[11px] text-[#77736C]">
                                Supervised by {project.projectManager || "Ar. Mandar Bhalekar"}
                              </p>
                            </div>

                            <div className="rounded-sm border border-[#E4E1DA] bg-[#FAF9F6] p-4">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
                                Total Billed
                              </span>
                              <p className="mt-2 font-mono text-xl font-bold text-[#171717]">
                                ₹{Number(ws?.expenseSummary?.totalBilled || 0).toLocaleString("en-IN")}
                              </p>
                            </div>

                            <div className="rounded-sm border border-emerald-200 bg-emerald-50/50 p-4">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-800">
                                Total Settled
                              </span>
                              <p className="mt-2 font-mono text-xl font-bold text-emerald-700">
                                ₹{Number(ws?.expenseSummary?.totalSettled || 0).toLocaleString("en-IN")}
                              </p>
                            </div>

                            <div className="rounded-sm border border-amber-200 bg-amber-50/50 p-4">
                              <span className="font-mono text-[9px] uppercase tracking-wider text-amber-800">
                                Pending Balance
                              </span>
                              <p className="mt-2 font-mono text-xl font-bold text-amber-700">
                                ₹{Number(ws?.expenseSummary?.totalPending || 0).toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>

                          {/* 2. Project Bills & Invoices */}
                          {/* 2. Progress Gallery & Architect Notes */}
                          <div className="rounded-sm border border-[#E4E1DA] bg-[#FAF9F6] p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-3">
                              <div className="flex items-center gap-2">
                                <Camera size={16} className="text-[#A58A64]" />
                                <h3 className="font-serif text-lg text-[#171717]">Project Progress Gallery &amp; Architect Notes</h3>
                              </div>
                              <span className="font-mono text-[10px] text-[#77736C]">
                                {architectUpdates.length} Updates
                              </span>
                            </div>

                            {architectUpdates.length === 0 ? (
                              <p className="py-4 text-center font-mono text-xs text-[#77736C]">
                                No site progress updates uploaded yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {architectUpdates.map((u) => (
                                  <div
                                    key={u.id}
                                    className="rounded-sm border border-[#D8D6D0] bg-white overflow-hidden"
                                  >
                                    {u.photoUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewPhotoUrl(u.photoUrl || null)}
                                        className="block relative h-40 w-full bg-stone-100 overflow-hidden cursor-pointer"
                                      >
                                        <img
                                          src={u.photoUrl}
                                          alt="Site update"
                                          className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                      </button>
                                    ) : (
                                      <div className="h-24 flex items-center justify-center bg-[#F2F0EB] text-[#77736C]">
                                        <ImageIcon size={20} />
                                      </div>
                                    )}
                                    <div className="p-3.5 space-y-1.5">
                                      <div className="flex justify-between font-mono text-[9px] text-[#77736C]">
                                        <span>{formatDateReadable(u.createdAt)}</span>
                                        <span className="text-[#9F7947]">{u.authorName}</span>
                                      </div>
                                      <p className="text-xs text-[#33312D] leading-relaxed">
                                        {u.note || "Site progress note logged."}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 3. Project Bills & Invoices */}
                          <div className="rounded-sm border border-[#E4E1DA] bg-[#FAF9F6] p-5 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E1DA] pb-3">
                              <div className="flex items-center gap-2">
                                <FileText size={16} className="text-[#A58A64]" />
                                <h3 className="font-serif text-lg text-[#171717]">Project Bills &amp; Invoices</h3>
                              </div>
                              <span className="font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                                {ws?.bills?.length || 0} Records
                              </span>
                            </div>

                            {!ws?.bills || ws.bills.length === 0 ? (
                              <p className="py-4 text-center font-mono text-xs text-[#77736C]">
                                No trade bills recorded on this project yet.
                              </p>
                            ) : (
                              <div className="divide-y divide-[#E4E1DA] bg-white rounded-sm border border-[#E4E1DA]">
                                {ws.bills.map((b) => {
                                  const billNum = b.invoiceNumber || b.billNumber || b.billId || "BILL";
                                  const isPaid = b.status.includes("PAID");
                                  return (
                                    <div
                                      key={b.id || billNum}
                                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-semibold text-sm text-[#171717]">
                                            {b.vendorName || "Trade Partner"}
                                          </span>
                                          {b.tradeCategory && (
                                            <span className="rounded-xs bg-[#F2F0EB] px-2 py-0.5 font-mono text-[9px] uppercase text-[#55514A]">
                                              {b.tradeCategory}
                                            </span>
                                          )}
                                          <span
                                            className={`rounded-xs px-2 py-0.5 font-mono text-[9px] uppercase font-semibold ${isPaid
                                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                              : "bg-amber-50 text-amber-800 border border-amber-200"
                                              }`}
                                          >
                                            {b.status.replace(/_/g, " ")}
                                          </span>
                                        </div>
                                        <p className="font-mono text-[11px] text-[#77736C]">
                                          Bill #{billNum} · {b.createdAt ? formatDateReadable(b.createdAt) : "Today"}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between sm:justify-end gap-4">
                                        <span className="font-mono text-base font-bold text-[#171717]">
                                          ₹{Number(b.amount || 0).toLocaleString("en-IN")}
                                        </span>
                                        {b.billPhotoUrl && (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewPhotoUrl(b.billPhotoUrl || null)}
                                            className="inline-flex items-center gap-1.5 rounded-xs border border-[#A58A64] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#9F7947] hover:bg-[#A58A64] hover:text-white transition-colors cursor-pointer"
                                          >
                                            <Eye size={12} /> View Photo
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* 3. Assigned Vendors Breakdown */}
                          <div className="rounded-sm border border-[#E4E1DA] bg-[#FAF9F6] p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-3">
                              <div className="flex items-center gap-2">
                                <Users size={16} className="text-[#A58A64]" />
                                <h3 className="font-serif text-lg text-[#171717]">Assigned Vendors &amp; Payment Details</h3>
                              </div>
                              <span className="font-mono text-[10px] text-[#77736C]">
                                {ws?.expenseSummary?.vendors?.length || 0} Contractors
                              </span>
                            </div>

                            {!ws?.expenseSummary?.vendors || ws.expenseSummary.vendors.length === 0 ? (
                              <p className="py-4 text-center font-mono text-xs text-[#77736C]">
                                No vendor billing activity assigned to this project yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ws.expenseSummary.vendors.map((v) => {
                                  const vName = v.vendorBusinessName || v.vendorName || "Contractor";
                                  const settled = Number(v.settledBillsAmount ?? v.settledAmount ?? 0);
                                  const pending = Number(v.pendingBillsAmount ?? v.pendingAmount ?? 0);
                                  return (
                                    <div
                                      key={v.vendorId}
                                      className="rounded-sm border border-[#D8D6D0] bg-white p-4 space-y-3"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <p className="font-semibold text-sm text-[#171717]">{vName}</p>
                                          <p className="font-mono text-[10px] uppercase text-[#9F7947]">
                                            {v.tradeCategory || "Contractor"}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleViewPaymentDetails(v.vendorId, vName)}
                                          className="inline-flex items-center gap-1 rounded-xs border border-[#A58A64] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#9F7947] hover:bg-[#A58A64] hover:text-white transition-colors cursor-pointer shrink-0"
                                        >
                                          <CreditCard size={11} /> Bank &amp; QR
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-[#EFECE6]">
                                        <div>
                                          <span className="text-[9px] uppercase text-emerald-700 block">Settled</span>
                                          <span className="font-semibold text-emerald-700">₹{settled.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] uppercase text-amber-700 block">Pending</span>
                                          <span className="font-semibold text-amber-700">₹{pending.toLocaleString("en-IN")}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* 5. Pending Cash Approval Requests (if any) */}
                          {ws?.cashQueue && ws.cashQueue.length > 0 && (
                            <div className="rounded-sm border border-amber-200 bg-amber-50/40 p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-serif text-lg text-[#171717]">
                                  <DollarSign size={16} className="text-amber-700" />
                                  Cash Payment Approval Requests ({ws.cashQueue.length})
                                </div>
                              </div>
                              <div className="divide-y divide-amber-200/70 bg-white rounded-sm border border-amber-200">
                                {ws.cashQueue.map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div>
                                      <p className="font-semibold text-sm text-[#171717]">{item.vendorName}</p>
                                      <p className="font-mono text-xs text-[#77736C]">
                                        Bill #{item.billNumber} · ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleRejectCash(project.id, item.id)}
                                        className="inline-flex items-center gap-1 rounded-xs border border-red-300 px-3 py-1.5 font-mono text-[10px] uppercase text-red-700 hover:bg-red-50 cursor-pointer"
                                      >
                                        <X size={12} /> Reject
                                      </button>
                                      <button
                                        type="button"
                                        disabled={actionLoading}
                                        onClick={() => handleApproveCash(project.id, item.id)}
                                        className="inline-flex items-center gap-1 rounded-xs bg-emerald-600 px-3 py-1.5 font-mono text-[10px] uppercase text-white hover:bg-emerald-700 cursor-pointer"
                                      >
                                        <Check size={12} /> Approve Cash
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-14 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#99958D]">
            ARCHEON DESIGN STUDIO / PRIVATE CLIENT WORKSPACE
          </p>
        </div>
      </div>

      {/* Bank & QR Modal */}
      {selectedVendorPayment && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div
            data-lenis-prevent="true"
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setSelectedVendorPayment(null)}
              className="absolute top-4 right-4 p-1 text-[#77736C] hover:text-[#171717] cursor-pointer"
            >
              <X size={18} />
            </button>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#9F7947]">
              Direct Vendor Payment Details
            </p>
            <h3 className="mt-1 font-serif text-2xl text-[#171717]">
              {selectedVendorPayment.vendorName}
            </h3>

            {paymentLoading ? (
              <div className="py-10 text-center font-mono text-xs text-[#9F7947]">
                Loading Bank &amp; UPI Coordinates...
              </div>
            ) : selectedVendorPayment.details ? (
              <div className="mt-5 space-y-4 font-mono text-xs">
                <div className="rounded-sm border border-[#EFECE6] bg-[#FAF9F6] p-3.5 space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-[#77736C]">Holder:</span>
                    <span className="font-semibold text-[#171717]">
                      {selectedVendorPayment.details.accountHolderName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#77736C]">Bank:</span>
                    <span className="font-semibold text-[#171717]">
                      {selectedVendorPayment.details.bankName || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#77736C]">Account:</span>
                    <span className="font-semibold text-[#171717]">
                      {selectedVendorPayment.details.accountNumber || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#77736C]">IFSC:</span>
                    <span className="font-semibold text-[#171717]">
                      {selectedVendorPayment.details.ifscCode || "—"}
                    </span>
                  </div>
                </div>

                {selectedVendorPayment.details.upiId && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedVendorPayment.details.upiId}
                      className="flex-1 rounded-sm border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-1.5 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedVendorPayment.details?.upiId || "");
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="p-2 border border-[#D8D6D0] rounded-sm hover:bg-[#FAF8F5] cursor-pointer"
                    >
                      {copiedUpi ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}

                {selectedVendorPayment.details.qrCodeUrl && (
                  <div className="flex justify-center p-3 border border-[#EFECE6] rounded-sm bg-[#FAF9F6]">
                    <img
                      src={selectedVendorPayment.details.qrCodeUrl}
                      alt="UPI QR"
                      className="h-40 w-40 object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <p className="py-8 text-center font-mono text-xs text-[#77736C]">
                Payment credentials have not been configured for this vendor yet.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Photo Preview Lightbox */}
      {previewPhotoUrl && (
        <div
          data-lenis-prevent="true"
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white rounded-sm p-3 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-[#171717] text-white flex items-center justify-center shadow cursor-pointer"
            >
              <X size={16} />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Full Resolution Preview"
              className="max-h-[80vh] w-full object-contain rounded-xs"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Metadata({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-[#A58A64] shrink-0">{icon}</span>
      <div className="flex flex-1 items-start justify-between gap-3">
        <span className="text-xs text-[#99958D]">{label}</span>
        <span className="text-right text-xs font-medium text-[#33312D]">{value}</span>
      </div>
    </div>
  );
}
