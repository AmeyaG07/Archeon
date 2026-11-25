"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  ImageIcon,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Tag,
  Upload,
  User,
  X,
  Banknote,
  ExternalLink,
  Layers,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { DualImageUpload } from "@/components/ui/DualImageUpload";

interface ProjectDetail {
  id: string;
  projectReference?: string;
  name: string;
  description?: string;
  projectType?: string;
  status: string;
  clientName?: string;
  projectManagerUsername?: string;
  siteAddress?: string;
  startDate?: string;
  expectedCompletionDate?: string;
  lastVisitDate?: string;
  progressPercentage?: number;
  assignedVendors?: Array<{
    id: string;
    vendorId: string;
    tradeCategory: string;
    status: string;
    scopeOfWork?: string;
  }>;
  phases?: Array<{
    id: string;
    name: string;
    status: string;
    phaseOrder: number;
  }>;
  milestones?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
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

interface BillItem {
  id: string | number;
  billId?: string;
  invoiceNumber?: string;
  billNumber?: string;
  projectId?: string;
  amount: number;
  tradeCategory?: string;
  status: string;
  billPhotoUrl?: string;
  paymentProofUrl?: string;
  createdAt: string;
}

export default function VendorProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<"overview" | "updates" | "bills" | "documents">("overview");

  // Modals
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateNote, setUpdateNote] = useState("");
  const [updatePhotoUrl, setUpdatePhotoUrl] = useState("");

  const [showBillModal, setShowBillModal] = useState(false);
  const [billAmount, setBillAmount] = useState("");
  const [billCategory, setBillCategory] = useState("Carpentry");
  const [billPhotoUrl, setBillPhotoUrl] = useState("");

  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Project details
      let loadedProject: ProjectDetail | null = null;
      try {
        const res = await apiFetch(`/api/operational-projects/${projectId}`);
        const proj = await res.json();
        loadedProject = proj;
        setProject(proj);
      } catch (err) {
        console.error("Failed to load project:", err);
      }

      // 2. Site updates
      try {
        const uRes = await apiFetch(`/api/site-updates/projects/${projectId}`);
        const uList = await uRes.json();
        setUpdates(Array.isArray(uList) ? uList : []);
      } catch {
        setUpdates([]);
      }

      // 3. Trade bills for this project
      try {
        const bRes = await apiFetch("/api/billing/bills/me");
        const bList = await bRes.json();
        if (Array.isArray(bList)) {
          const projectBills = bList.filter(
            (b: any) =>
              String(b.projectId || "") === String(projectId) ||
              (loadedProject?.projectReference &&
                String(b.projectId || "") === String(loadedProject.projectReference)) ||
              (loadedProject?.name && b.projectName === loadedProject.name)
          );
          setBills(projectBills);
        }
      } catch {
        setBills([]);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load project workspace.");
    } finally {
      setLoading(false);
    }
  }, [projectId, project?.name]);

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated) {
        loadData();
      } else {
        router.push("/login");
      }
    }
  }, [authLoading, isAuthenticated, loadData, router]);

  // Submit site progress update
  const handleSendSiteUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateNote && !updatePhotoUrl) return;

    setActionLoading(true);
    try {
      await apiFetch("/api/site-updates", {
        method: "POST",
        body: JSON.stringify({
          projectId,
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
        message: "Site note & progress photo submitted to the architect successfully.",
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to submit site update.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Submit new trade bill for this project
  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(billAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setActionLoading(true);
    try {
      await apiFetch("/api/billing/bills", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          amount: amountVal,
          tradeCategory: billCategory,
          billPhotoUrl: billPhotoUrl || undefined,
        }),
      });

      setShowBillModal(false);
      setBillAmount("");
      setBillPhotoUrl("");
      setFeedback({
        type: "success",
        message: "Trade bill submitted successfully. Sent to client approval queue.",
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to submit trade bill.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  // Request cash payment on a pending bill
  const handleRequestCash = async (billId: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/billing/bills/${billId}/request-cash`, {
        method: "POST",
      });
      setFeedback({
        type: "success",
        message: "Cash settlement requested. Client has been alerted for on-site cash handoff.",
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to request cash settlement.",
      });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] p-6 sm:p-12 flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-sm text-[#777]">
          <RefreshCw size={18} className="animate-spin text-[#B68A4A]" />
          Loading project workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] pb-24 text-[#111111]">
      {/* Top Header Bar */}
      <div className="border-b border-[#D8D6D0] bg-white px-4 sm:px-6 py-5 sm:py-6 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => router.push("/vendor/projects")}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#77736C] hover:text-[#111111] transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Back to Assigned Projects
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#111111]">
                  {project?.name || "Assigned Site Project"}
                </h1>
                <span className="rounded-full bg-[#10B981]/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#10B981] border border-[#10B981]/30">
                  {project?.status || "IN PROGRESS"}
                </span>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-[#77736C]">
                <MapPin size={13} className="text-[#B68A4A] shrink-0" />
                <span>{project?.siteAddress || "Site Location: Maharashtra"} · Ref: {project?.projectReference || "PRJ-2026-SITE"}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="inline-flex items-center gap-2 rounded-sm border border-[#D8D6D0] bg-white px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#111111] hover:border-[#B68A4A] hover:bg-[#FAF9F5] transition-all"
              >
                <Camera size={14} className="text-[#B68A4A]" />
                <span>Post Site Update</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                className="inline-flex items-center gap-2 rounded-sm bg-[#B68A4A] px-5 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#9E7336] transition-all shadow-sm"
              >
                <Plus size={14} />
                <span>Submit Trade Bill</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex gap-4 sm:gap-8 border-b border-[#E5E2DC] overflow-x-auto scrollbar-none whitespace-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "overview"
                  ? "border-[#B68A4A] text-[#111111] font-semibold"
                  : "border-transparent text-[#77736C] hover:text-[#111111]"
              }`}
            >
              Overview &amp; Scope
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("updates")}
              className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "updates"
                  ? "border-[#B68A4A] text-[#111111] font-semibold"
                  : "border-transparent text-[#77736C] hover:text-[#111111]"
              }`}
            >
              <span>Site Updates &amp; Photos</span>
              <span className="rounded-full bg-[#FAF9F5] px-2 py-0.5 text-[10px] text-[#B68A4A] border border-[#B68A4A]/20">
                {updates.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bills")}
              className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === "bills"
                  ? "border-[#B68A4A] text-[#111111] font-semibold"
                  : "border-transparent text-[#77736C] hover:text-[#111111]"
              }`}
            >
              <span>Trade Bills &amp; Settlements</span>
              <span className="rounded-full bg-[#FAF9F5] px-2 py-0.5 text-[10px] text-[#B68A4A] border border-[#B68A4A]/20">
                {bills.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("documents")}
              className={`pb-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === "documents"
                  ? "border-[#B68A4A] text-[#111111] font-semibold"
                  : "border-transparent text-[#77736C] hover:text-[#111111]"
              }`}
            >
              Drawings &amp; Documents
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-sm font-mono text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-[#065F46]/10 text-[#065F46] border border-[#065F46]/30"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            <CheckCircle2 size={16} />
            {feedback.message}
          </div>
        )}

        {/* Tab 1: Overview & Scope */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Assigned Scope */}
              <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
                <h2 className="font-serif text-xl text-[#111111] border-b border-[#E5E2DC] pb-3">
                  Contractor Scope of Work
                </h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                      Project Type &amp; Discipline
                    </span>
                    <p className="mt-1 font-mono text-sm text-[#111111]">
                      {project?.projectType || "Residential Architecture & Turnkey Execution"}
                    </p>
                  </div>

                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                      Scope Description &amp; Specifications
                    </span>
                    <p className="mt-1 text-sm leading-relaxed text-[#555]">
                      {project?.description ||
                        "Supply, fabrication, and on-site architectural execution strictly as per studio specifications and shop drawings released by Ar. Mandar Bhalekar."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Phases & Timeline */}
              {project?.phases && project.phases.length > 0 && (
                <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
                  <h2 className="font-serif text-xl text-[#111111] border-b border-[#E5E2DC] pb-3">
                    Project Execution Phases
                  </h2>
                  <div className="mt-4 space-y-3">
                    {project.phases.map((ph) => (
                      <div
                        key={ph.id}
                        className="flex items-center justify-between border-b border-[#F0EFEA] pb-3 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-[#B68A4A]">0{ph.phaseOrder}</span>
                          <span className="text-sm font-medium text-[#111111]">{ph.name}</span>
                        </div>
                        <span className="font-mono text-[10px] px-2.5 py-0.5 rounded bg-[#FAF9F5] text-stone-600 border border-[#D8D6D0]">
                          {ph.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Details */}
            <div className="space-y-6">
              <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-mono text-xs uppercase tracking-wider text-[#B68A4A] border-b border-[#E5E2DC] pb-2">
                  Assignment Metadata
                </h3>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                    Project Manager
                  </span>
                  <p className="font-mono text-xs text-[#111111]">
                    {project?.projectManagerUsername || "Ar. Mandar Bhalekar"}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                    Client Reference
                  </span>
                  <p className="font-mono text-xs text-[#111111]">
                    {project?.clientName || "Studio Turnkey Client"}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                    Commencement Date
                  </span>
                  <p className="font-mono text-xs text-[#111111]">
                    {project?.startDate || "2026-11-21"}
                  </p>
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                    Target Completion
                  </span>
                  <p className="font-mono text-xs text-[#111111]">
                    {project?.expectedCompletionDate || "2026-12-21"}
                  </p>
                </div>
              </div>

              {/* Safety & Protocol Card */}
              <div className="rounded-sm border border-[#B68A4A]/30 bg-[#FAF9F5] p-5">
                <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
                  <ShieldCheck size={16} />
                  <span>Quality Standard</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#666]">
                  All site work is inspected directly by Ar. Mandar Bhalekar. Submit trade bills along with material delivery receipts and progress photographs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Site Updates & Photos */}
        {activeTab === "updates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#D8D6D0] bg-white p-6 shadow-sm">
              <div>
                <h2 className="font-serif text-2xl text-[#111111]">Site Log &amp; Progress Photos</h2>
                <p className="text-xs text-[#777] mt-1 font-mono">
                  Chronological site updates and photos exchanged between contractor and studio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateModal(true)}
                className="inline-flex items-center gap-2 rounded-sm bg-[#B68A4A] px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#9E7336] transition-all"
              >
                <Camera size={14} />
                <span>Add Site Photo</span>
              </button>
            </div>

            {updates.length === 0 ? (
              <div className="border border-dashed border-[#D8D6D0] bg-white p-12 text-center font-mono text-xs text-[#777]">
                No site updates logged for this project yet. Click &quot;Add Site Photo&quot; to upload your first site update.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {updates.map((up) => (
                  <div key={up.id} className="rounded-sm border border-[#D8D6D0] bg-white overflow-hidden shadow-sm flex flex-col">
                    {up.photoUrl ? (
                      <div
                        onClick={() => setPreviewPhotoUrl(up.photoUrl || null)}
                        className="relative h-48 w-full bg-[#1A1A1A] cursor-pointer group overflow-hidden"
                      >
                        <img
                          src={up.photoUrl}
                          alt="Site Progress"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-mono text-xs gap-1.5">
                          <Eye size={14} /> Click to Enlarge
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 w-full bg-[#F5F4EE] flex items-center justify-center font-mono text-xs text-[#999]">
                        <FileText size={18} className="mr-2" /> Text Log Entry
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs leading-relaxed text-[#333] whitespace-pre-wrap">
                        {up.note || "Site progress update recorded."}
                      </p>
                      <div className="mt-4 pt-3 border-t border-[#E5E2DC] flex items-center justify-between font-mono text-[10px] text-[#777]">
                        <span>By: {up.authorName} ({up.authorRole})</span>
                        <span>{new Date(up.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Trade Bills & Settlements */}
        {activeTab === "bills" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#D8D6D0] bg-white p-6 shadow-sm">
              <div>
                <h2 className="font-serif text-2xl text-[#111111]">Project Trade Bills</h2>
                <p className="text-xs text-[#777] mt-1 font-mono">
                  All trade invoices and cash settlement requests linked to this site package.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBillModal(true)}
                className="inline-flex items-center gap-2 rounded-sm bg-[#B68A4A] px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-[#9E7336] transition-all"
              >
                <Plus size={14} />
                <span>Submit Bill</span>
              </button>
            </div>

            {bills.length === 0 ? (
              <div className="border border-dashed border-[#D8D6D0] bg-white p-12 text-center font-mono text-xs text-[#777]">
                No trade bills submitted for this project yet. Click &quot;Submit Bill&quot; to upload your bill.
              </div>
            ) : (
              <div className="rounded-sm border border-[#D8D6D0] bg-white overflow-x-auto shadow-sm">
                <table className="w-full min-w-[540px] text-left text-xs font-mono">
                  <thead className="bg-[#FAF9F5] border-b border-[#E5E2DC] text-[#777] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Bill Reference</th>
                      <th className="py-3 px-4">Trade Category</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Document</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DC]">
                    {bills.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FAF9F5] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#111111]">
                          {b.invoiceNumber || b.billNumber || b.billId || String(b.id ?? "").slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 text-[#555]">{b.tradeCategory || "Contractor Trade"}</td>
                        <td className="py-3 px-4 text-right font-bold text-sm text-[#111111]">
                          ₹{Number(b.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              b.status === "PAID_CASH" || b.status === "PAID_ONLINE" || b.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "CASH_REQUESTED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {b.billPhotoUrl ? (
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl(b.billPhotoUrl || null)}
                              className="text-[#06B6D4] hover:underline inline-flex items-center gap-1 text-[11px]"
                            >
                              <Eye size={12} /> View Bill Photo
                            </button>
                          ) : (
                            <span className="text-[#999]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {b.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => handleRequestCash(String(b.id))}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-[#D97724] text-white hover:bg-[#B45309] font-mono text-[10px] uppercase tracking-wider rounded-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <Banknote size={11} /> Request Cash
                            </button>
                          )}
                          {b.status === "CASH_REQUESTED" && (
                            <span className="text-[10px] text-[#6366F1]">Client Queue</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Drawings & Documents */}
        {activeTab === "documents" && (
          <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-serif text-2xl text-[#111111]">Shared Architectural Drawings &amp; Documents</h2>
            <p className="text-xs text-[#777] font-mono">
              Working drawings, shop details, and site specifications shared for this project assignment.
            </p>

            <div className="mt-6 border border-dashed border-[#D8D6D0] p-8 text-center font-mono text-xs text-[#777]">
              No documents currently attached to this project assignment. The studio administrator or project manager will publish revision drawings here.
            </div>
          </div>
        )}
      </div>

      {/* Modal: Post Site Update */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-sm bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowUpdateModal(false)}
              className="absolute top-4 right-4 p-1 text-[#77736C] hover:text-[#111111]"
            >
              <X size={18} />
            </button>
            <h2 className="font-serif text-2xl font-medium text-[#111111] border-b border-[#E5E2DC] pb-3">
              Post Site Progress Update
            </h2>

            <form onSubmit={handleSendSiteUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#77736C] mb-1">
                  Site Observation / Note
                </label>
                <textarea
                  rows={3}
                  value={updateNote}
                  onChange={(e) => setUpdateNote(e.target.value)}
                  placeholder="e.g. Master bedroom flooring completed. Level check verified with site engineer."
                  className="w-full rounded-sm border border-[#D8D6D0] p-3 text-xs focus:border-[#B68A4A] focus:outline-none"
                />
              </div>

              <div>
                <DualImageUpload
                  label="Attach Progress Photograph (Device or Drive)"
                  value={updatePhotoUrl}
                  onChange={(url) => setUpdatePhotoUrl(url)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#77736C] hover:text-[#111111]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || (!updateNote && !updatePhotoUrl)}
                  className="px-6 py-2 bg-[#B68A4A] text-white hover:bg-[#9E7336] font-mono text-xs uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Post Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Trade Bill */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-sm bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowBillModal(false)}
              className="absolute top-4 right-4 p-1 text-[#77736C] hover:text-[#111111]"
            >
              <X size={18} />
            </button>
            <h2 className="font-serif text-2xl font-medium text-[#111111] border-b border-[#E5E2DC] pb-3">
              Submit Trade Bill
            </h2>

            <form onSubmit={handleSubmitBill} className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#77736C] mb-1">
                  Bill Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full rounded-sm border border-[#D8D6D0] p-2.5 text-xs font-mono focus:border-[#B68A4A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[#77736C] mb-1">
                  Trade Category
                </label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value)}
                  className="w-full rounded-sm border border-[#D8D6D0] p-2.5 text-xs font-mono focus:border-[#B68A4A] focus:outline-none"
                >
                  <option value="Carpentry">Carpentry &amp; Millwork</option>
                  <option value="Flooring">Marble &amp; Tile Flooring</option>
                  <option value="Civil">Civil &amp; Masonry</option>
                  <option value="Electrical">Electrical Works</option>
                  <option value="Plumbing">Plumbing &amp; Sanitary</option>
                  <option value="Painting">Painting &amp; Polishing</option>
                  <option value="Glass">Glass &amp; Metal Fabrication</option>
                </select>
              </div>

              <div>
                <DualImageUpload
                  label="Upload Bill / Invoice Photograph (Device or Drive)"
                  value={billPhotoUrl}
                  onChange={(url) => setBillPhotoUrl(url)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 font-mono text-xs uppercase tracking-wider text-[#77736C] hover:text-[#111111]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !billAmount}
                  className="px-6 py-2 bg-[#B68A4A] text-white hover:bg-[#9E7336] font-mono text-xs uppercase tracking-wider rounded-sm transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Bill"}
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
