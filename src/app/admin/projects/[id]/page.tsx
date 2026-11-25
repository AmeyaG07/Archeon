"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  ImageIcon,
  Plus,
  RefreshCw,
  Send,
  User,
  Users,
  UserPlus,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { DualImageUpload } from "@/components/ui/DualImageUpload";
import { AdminAssignVendorModal } from "@/components/portal/admin/AdminAssignVendorModal";

interface ProjectDetail {
  id: string;
  projectReference: string;
  name: string;
  projectType: string;
  status: string;
  clientName?: string;
  siteAddress?: string;
  contractValue?: number;
  budgetAllocated?: number;
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

interface VendorExpenseItem {
  vendorId: string;
  vendorName: string;
  tradeCategory: string;
  settledAmount: number;
  pendingAmount: number;
  totalBilled: number;
  settledCount: number;
  pendingCount: number;
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

export default function AdminProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [vendorUpdates, setVendorUpdates] = useState<SiteUpdate[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ProjectExpenseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [newVisitDate, setNewVisitDate] = useState(new Date().toISOString().split("T")[0]);
  const [photoNote, setPhotoNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [isAssignVendorModalOpen, setIsAssignVendorModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      // 1. Fetch Project
      try {
        const res = await apiFetch(`/api/operational-projects/${projectId}`);
        const proj = await res.json();
        setProject(proj);
      } catch (err) {
        console.error("Failed to load project:", err);
      }

      // 2. Fetch all site updates
      try {
        const res = await apiFetch(`/api/site-updates/projects/${projectId}`);
        const allUpdates = await res.json();
        setUpdates(Array.isArray(allUpdates) ? allUpdates : []);
      } catch {
        setUpdates([]);
      }

      // 3. Fetch vendor updates specifically
      try {
        const res = await apiFetch(`/api/site-updates/projects/${projectId}/vendor-updates`);
        const vUpdates = await res.json();
        setVendorUpdates(Array.isArray(vUpdates) ? vUpdates : []);
      } catch {
        setVendorUpdates([]);
      }

      // 4. Fetch expense summary
      try {
        const res = await apiFetch(`/api/billing/project/${projectId}/expenses`);
        const exp = await res.json();
        setExpenseSummary(exp);
      } catch {
        setExpenseSummary(null);
      }
    } catch (err: unknown) {
      console.error("Failed to load project details:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Log new site visit date
  const handleLogSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitDate) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/site-updates/projects/${projectId}/site-visit`, {
        method: "POST",
        body: JSON.stringify({ visitDate: newVisitDate }),
      });
      setMessage("Site visit date successfully updated.");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to log site visit:", err);
      setMessage("Failed to log site visit date.");
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Upload progress photo for client
  const handleUploadProgressPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl && !photoNote) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/site-updates`, {
        method: "POST",
        body: JSON.stringify({
          projectId,
          authorRole: "ARCHITECT",
          authorName: "Ar. Mandar Bhalekar",
          photoUrl: photoUrl || undefined,
          note: photoNote,
        }),
      });
      setPhotoUrl("");
      setPhotoNote("");
      setShowPhotoForm(false);
      setMessage("Client progress update published successfully.");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to post progress update:", err);
      setMessage("Failed to upload progress update.");
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

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
      {/* Back button & top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D8D6D0] pb-6">
        <button
          onClick={() => router.push("/admin/projects")}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#777777] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Projects
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider px-2.5 py-1 rounded-sm bg-[#B68A4A]/10 text-[#B68A4A] border border-[#B68A4A]/30">
            {project?.status || "IN_PROGRESS"}
          </span>
          <span className="font-mono text-xs text-[#777777]">
            Ref: {project?.projectReference || project?.id?.substring(0, 8)}
          </span>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-4 rounded-sm bg-[#10B981]/10 border border-[#10B981]/30 font-mono text-xs text-[#10B981]">
          <CheckCircle2 size={14} /> {message}
        </div>
      )}

      {/* Project Overview Card */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 sm:p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#111111]">{project?.name}</h1>
          <p className="font-mono text-xs sm:text-[13px] text-[#777777]">
            Client: <span className="text-[#111111] font-medium">{project?.clientName || "Direct Studio Client"}</span> • Category: {project?.projectType}
          </p>
          {project?.siteAddress && (
            <p className="font-mono text-xs sm:text-[13px] text-[#777777]">Site Address: {project.siteAddress}</p>
          )}
        </div>

        {/* Finance Specifics */}
        <div className="mt-7 pt-7 border-t border-[#E5E2DC] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
          <div className="rounded-sm border border-[#E5E2DC] bg-[#FAF9F5] p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#77736C]">
              Contract Value
            </div>
            <div className="mt-3 font-serif text-2xl sm:text-[28px] leading-none font-medium tabular-nums text-[#111111]">
              ₹{project?.contractValue?.toLocaleString("en-IN") || "—"}
            </div>
          </div>

          <div className="rounded-sm border border-[#E5E2DC] bg-[#FAF9F5] p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#77736C]">
              Total Billed
            </div>
            <div className="mt-3 font-serif text-2xl sm:text-[28px] leading-none font-medium tabular-nums text-[#111111]">
              ₹{expenseSummary?.totalBilled?.toLocaleString("en-IN") || "0"}
            </div>
          </div>

          <div className="rounded-sm border border-[#D7E2D2] bg-[#F5F9F4] p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#10B981]">
              Settled
            </div>
            <div className="mt-3 font-serif text-2xl sm:text-[28px] leading-none font-medium tabular-nums text-[#10B981]">
              ₹{expenseSummary?.totalSettled?.toLocaleString("en-IN") || "0"}
            </div>
          </div>

          <div className="rounded-sm border border-[#EADBC8] bg-[#FCF8F2] p-5">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#D97724]">
              Pending
            </div>
            <div className="mt-3 font-serif text-2xl sm:text-[28px] leading-none font-medium tabular-nums text-[#D97724]">
              ₹{expenseSummary?.totalPending?.toLocaleString("en-IN") || "0"}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Site Visit Logger + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Last Site Visit Date & Visit Logger */}
        <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
            <CalendarDays size={14} /> Site Visit Management
          </div>
          <div className="mt-4">
            <div className="text-xs text-[#777777]">Current Last Visit Date:</div>
            <div className="font-mono text-lg font-bold text-[#111111] mt-1">
              {project?.lastVisitDate ? new Date(project.lastVisitDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              }) : "No site visits logged yet"}
            </div>
          </div>

          <form onSubmit={handleLogSiteVisit} className="mt-6 border-t border-[#D8D6D0] pt-4 space-y-3">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#777777]">
              Log New Site Visit Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={newVisitDate}
                onChange={(e) => setNewVisitDate(e.target.value)}
                className="flex-1 rounded-sm border border-[#D8D6D0] px-3 py-2 font-mono text-xs text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-[#111111] text-[#F2F0EB] hover:bg-[#B68A4A] font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Upload Client Progress Photo */}
        <div className="lg:col-span-2 rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
              <Camera size={14} /> Client Progress Photos & Notes
            </div>
            <button
              onClick={() => setShowPhotoForm(!showPhotoForm)}
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-3 py-1 bg-[#111111] text-white hover:bg-[#B68A4A] transition-colors rounded-sm"
            >
              <Plus size={12} /> {showPhotoForm ? "Cancel" : "Upload New Photo"}
            </button>
          </div>

          {showPhotoForm && (
            <form onSubmit={handleUploadProgressPhoto} className="mt-4 border-t border-[#D8D6D0] pt-4 space-y-4">
              <DualImageUpload
                label="Progress Photo (Upload from Device or Paste Google Drive Link)"
                value={photoUrl}
                onChange={setPhotoUrl}
                placeholder="Paste Google Drive share link, Dropbox or cloud photo URL..."
              />
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#777777]">
                  Architect Note for Client
                </label>
                <textarea
                  placeholder="Detailed inspection update, milestone progress, or client notes..."
                  value={photoNote}
                  onChange={(e) => setPhotoNote(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-sm border border-[#D8D6D0] px-3 py-2 text-xs text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#B68A4A] text-white font-mono text-xs uppercase tracking-wider hover:bg-[#A3783A] transition-colors disabled:opacity-50"
                >
                  <Send size={12} /> Publish Progress Photo
                </button>
              </div>
            </form>
          )}

          {/* Progress Gallery Preview */}
          <div className="mt-4">
            {(Array.isArray(updates) ? updates : []).filter((u) => u.authorRole === "ARCHITECT").length === 0 ? (
              <div className="py-6 text-center font-mono text-xs text-[#777777]">
                No progress photos published yet for this project.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Array.isArray(updates) ? updates : [])
                  .filter((u) => u.authorRole === "ARCHITECT")
                  .slice(0, 6)
                  .map((u) => (
                    <div key={u.id} className="group relative rounded-sm border border-[#D8D6D0] overflow-hidden bg-[#FAF9F5]">
                      {u.photoUrl ? (
                        <img src={u.photoUrl} alt="Progress" className="h-28 w-full object-cover" />
                      ) : (
                        <div className="h-28 w-full flex items-center justify-center bg-[#E5E3DE] text-[#777777]">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      <div className="p-2">
                        <div className="font-mono text-[9px] text-[#777777]">
                          {new Date(u.createdAt).toLocaleDateString("en-IN")}
                        </div>
                        <p className="line-clamp-2 text-[11px] text-[#111111] mt-0.5">{u.note || "Site Progress"}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Incoming Vendor Updates */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
            <FileText size={14} /> Incoming Vendor Updates (Site Notes & Photos)
          </div>
          <span className="font-mono text-xs text-[#777777]">
            {vendorUpdates.length} Updates Received
          </span>
        </div>

        {vendorUpdates.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-[#777777]">
            No site notes or updates submitted by vendors for this project yet.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[#E5E3DE]">
            {vendorUpdates.map((vu) => (
              <div key={vu.id} className="py-4 flex flex-col md:flex-row gap-4">
                {vu.photoUrl && (
                  <div className="shrink-0 w-32 h-24 rounded-sm overflow-hidden border border-[#D8D6D0] bg-black/5">
                    <img src={vu.photoUrl} alt="Vendor upload" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-xs text-[#111111]">{vu.authorName}</span>
                    <span className="font-mono text-[10px] text-[#777777]">
                      {new Date(vu.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#333333] leading-relaxed whitespace-pre-line">
                    {vu.note || "No additional text note provided."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Vendors & Expenses Breakdown */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D8D6D0] pb-4 gap-3">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
            <Users size={14} /> Assigned Vendors & Expense Breakdown
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#777777]">
              {expenseSummary?.vendors?.length || 0} Vendors Assigned
            </span>
            <button
              onClick={() => setIsAssignVendorModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171717] text-white hover:bg-[#A58A64] font-mono text-[10px] uppercase tracking-wider rounded-sm transition-colors shadow-xs"
            >
              <UserPlus size={12} /> + Assign Vendor
            </button>
          </div>
        </div>

        {!expenseSummary?.vendors || expenseSummary.vendors.length === 0 ? (
          <div className="py-8 text-center font-mono text-xs text-[#777777]">
            No vendors with billing activity recorded on this project.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead>
                <tr className="border-b border-[#D8D6D0] text-[#777777] uppercase text-[11px] tracking-[0.12em]">
                  <th className="py-4 px-5">Vendor</th>
                  <th className="py-4 px-5">Trade Category</th>
                  <th className="py-4 px-5 text-right">Settled Bills</th>
                  <th className="py-4 px-5 text-right">Pending Bills</th>
                  <th className="py-4 px-5 text-right">Total Billed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DE]">
                {expenseSummary.vendors.map((v: any) => {
                  const sAmt = Number(v.settledBillsAmount ?? v.settledAmount ?? 0);
                  const sCnt = Number(v.settledBillsCount ?? v.settledCount ?? 0);
                  const pAmt = Number(v.pendingBillsAmount ?? v.pendingAmount ?? 0);
                  const pCnt = Number(v.pendingBillsCount ?? v.pendingCount ?? 0);
                  const tot = Number(v.totalSpending ?? v.totalBilled ?? (sAmt + pAmt));
                  const name = v.vendorBusinessName || v.vendorName || "Contractor";
                  return (
                    <tr key={v.vendorId || name} className="hover:bg-[#FAF9F5]">
                      <td className="py-4 px-5 font-semibold text-[#111111]">{name}</td>
                      <td className="py-4 px-5 text-xs text-[#777777]">{v.tradeCategory || "Contractor"}</td>
                      <td className="py-4 px-5 text-right font-medium tabular-nums text-[#10B981]">
                        ₹{sAmt.toLocaleString("en-IN")} ({sCnt})
                      </td>
                      <td className="py-4 px-5 text-right font-medium tabular-nums text-[#D97724]">
                        ₹{pAmt.toLocaleString("en-IN")} ({pCnt})
                      </td>
                      <td className="py-4 px-5 text-right text-base font-bold tabular-nums text-[#111111]">
                        ₹{tot.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Assign Vendor Modal */}
      <AdminAssignVendorModal
        projectId={projectId}
        projectName={project?.name || "Project"}
        isOpen={isAssignVendorModalOpen}
        onClose={() => setIsAssignVendorModalOpen(false)}
        onVendorAssigned={loadData}
      />
    </div>
  );
}
