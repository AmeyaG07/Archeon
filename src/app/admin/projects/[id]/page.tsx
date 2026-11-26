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
import { emitToast } from "@/providers/ToastProvider";
import { PortalDashboardSkeleton } from "@/components/portal/shared/PortalSkeleton";
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
  progressPercentage?: number;
  phases?: Array<{
    id: string;
    name: string;
    description?: string;
    status: string;
    sequenceOrder?: number;
  }>;
  milestones?: Array<{
    id: string;
    phaseId?: string;
    phaseName?: string;
    title: string;
    description?: string;
    dueDate?: string;
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

  const getLocalTodayIso = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Form states
  const [newVisitDate, setNewVisitDate] = useState(getLocalTodayIso);
  const [photoNote, setPhotoNote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [isAssignVendorModalOpen, setIsAssignVendorModalOpen] = useState(false);

  // Phases & Milestones form states
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [phaseName, setPhaseName] = useState("");
  const [phaseDescription, setPhaseDescription] = useState("");
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestonePhaseId, setMilestonePhaseId] = useState("");
  const [milestoneDueDate, setMilestoneDueDate] = useState(getLocalTodayIso);

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
        // Deduplicate by id to prevent React duplicate-key warnings
        const deduped = Array.isArray(allUpdates)
          ? [...new Map(allUpdates.map((u: SiteUpdate) => [u.id, u])).values()]
          : [];
        setUpdates(deduped);
      } catch {
        setUpdates([]);
      }

      // 3. Fetch vendor updates specifically
      try {
        const res = await apiFetch(`/api/site-updates/projects/${projectId}/vendor-updates`);
        const vUpdates = await res.json();
        const dedupedVendor = Array.isArray(vUpdates)
          ? [...new Map(vUpdates.map((u: SiteUpdate) => [u.id, u])).values()]
          : [];
        setVendorUpdates(dedupedVendor);
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

  // Submit a site visit date update
  const submitSiteVisitDate = async (visitDate: string) => {
    if (!visitDate) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/site-updates/projects/${projectId}/site-visit`, {
        method: "POST",
        body: JSON.stringify({ visitDate }),
      });
      setNewVisitDate(visitDate);
      setMessage("Site visit date successfully updated.");
      emitToast("Site visit date logged to project timeline.", "success");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to log site visit:", err);
      setMessage("Failed to log site visit date.");
      emitToast("Could not update site visit date.", "error");
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Log new site visit date from date picker form
  const handleLogSiteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitSiteVisitDate(newVisitDate);
  };

  // One-click log today's date
  const handleLogToday = async () => {
    await submitSiteVisitDate(getLocalTodayIso());
  };

  // Update project status (PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED)
  const handleStatusChange = async (nextStatus: string) => {
    if (!nextStatus || !projectId) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/operational-projects/${projectId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setMessage(`Project status updated to ${nextStatus.replace("_", " ")}.`);
      emitToast(`Project status updated to ${nextStatus.replace("_", " ")}.`, "success");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to update project status:", err);
      setMessage("Failed to update project status.");
      emitToast("Could not update project status.", "error");
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Create phase
  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phaseName.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/operational-projects/${projectId}/phases`, {
        method: "POST",
        body: JSON.stringify({
          name: phaseName.trim(),
          description: phaseDescription.trim() || undefined,
          sequenceOrder: (project?.phases?.length || 0) + 1,
        }),
      });
      setPhaseName("");
      setPhaseDescription("");
      setShowPhaseForm(false);
      emitToast("Project phase added.", "success");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to add phase:", err);
      emitToast("Could not add project phase.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhaseStatusChange = async (phaseId: string, status: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/operational-projects/${projectId}/phases/${phaseId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      emitToast("Phase status updated.", "success");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to update phase status:", err);
      emitToast("Could not update phase status.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Create milestone
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/operational-projects/${projectId}/milestones`, {
        method: "POST",
        body: JSON.stringify({
          title: milestoneTitle.trim(),
          phaseId: milestonePhaseId || undefined,
          dueDate: milestoneDueDate || undefined,
        }),
      });
      setMilestoneTitle("");
      setMilestonePhaseId("");
      setMilestoneDueDate(getLocalTodayIso());
      setShowMilestoneForm(false);
      emitToast("Project milestone added.", "success");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to add milestone:", err);
      emitToast("Could not add project milestone.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMilestoneStatusChange = async (milestoneId: string, status: string) => {
    setActionLoading(true);
    try {
      await apiFetch(`/api/operational-projects/${projectId}/milestones/${milestoneId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      emitToast("Milestone status updated.", "success");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to update milestone status:", err);
      emitToast("Could not update milestone status.", "error");
    } finally {
      setActionLoading(false);
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
      emitToast("Progress update published to client portal.", "success");
      await loadData();
    } catch (err: unknown) {
      console.error("Failed to post progress update:", err);
      setMessage("Failed to upload progress update.");
      emitToast("Failed to publish progress update.", "error");
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading && !project) {
    return <PortalDashboardSkeleton label="Loading Project Workspace..." />;
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

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777]">
              Status:
            </span>
            <select
              aria-label="Project Status"
              value={project?.status || "PLANNING"}
              disabled={actionLoading}
              onChange={(e) => void handleStatusChange(e.target.value)}
              className="rounded-sm border border-[#B68A4A]/50 bg-[#FAF9F5] px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-[#171717] focus:border-[#A58A64] focus:outline-none disabled:opacity-50"
            >
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>
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
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs text-[#777777]">Current Last Visit Date:</div>
              <div className="font-mono text-lg font-bold text-[#111111] mt-1">
                {project?.lastVisitDate ? new Date(project.lastVisitDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                }) : "No site visits logged yet"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogToday}
              disabled={actionLoading}
              className="shrink-0 rounded-sm border border-[#A58A64]/60 bg-[#FAF9F5] px-3.5 py-2.5 text-left transition-colors hover:border-[#A58A64] hover:bg-[#111111] hover:text-[#F2F0EB] disabled:opacity-50 cursor-pointer group"
            >
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#111111] group-hover:text-[#F2F0EB]">
                <Calendar size={12} className="text-[#A58A64]" />
                Log Today
              </span>
              <span className="mt-0.5 block font-mono text-[9px] text-[#777777] group-hover:text-[#D8D6D0]">
                {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </button>
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

      {/* Phases & Milestones Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Project Phases */}
        <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
              <Clock size={14} /> Project Phases ({project?.phases?.length || 0})
            </div>
            <button
              type="button"
              onClick={() => setShowPhaseForm(!showPhaseForm)}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 bg-[#111111] text-white hover:bg-[#B68A4A] transition-colors rounded-sm"
            >
              <Plus size={11} /> {showPhaseForm ? "Cancel" : "Add Phase"}
            </button>
          </div>

          {showPhaseForm && (
            <form onSubmit={handleAddPhase} className="mt-4 border-b border-[#E5E2DC] pb-4 space-y-2.5">
              <input
                type="text"
                placeholder="Phase name (e.g. Structural Shell)"
                value={phaseName}
                onChange={(e) => setPhaseName(e.target.value)}
                className="w-full rounded-sm border border-[#D8D6D0] px-3 py-1.5 text-xs text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                required
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Optional scope description"
                  value={phaseDescription}
                  onChange={(e) => setPhaseDescription(e.target.value)}
                  className="flex-1 rounded-sm border border-[#D8D6D0] px-3 py-1.5 text-xs text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !phaseName.trim()}
                  className="px-3.5 py-1.5 bg-[#B68A4A] text-white font-mono text-[10px] uppercase tracking-wider hover:bg-[#A3783A] disabled:opacity-50"
                >
                  Save Phase
                </button>
              </div>
            </form>
          )}

          {!project?.phases || project.phases.length === 0 ? (
            <p className="py-6 text-center font-mono text-xs text-[#777777]">
              No phases added yet.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-[#E5E2DC]">
              {project.phases.map((phase) => (
                <div key={phase.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#111111] truncate">{phase.name}</p>
                    {phase.description && (
                      <p className="text-[11px] text-[#777777] truncate">{phase.description}</p>
                    )}
                  </div>
                  <select
                    aria-label={`Phase ${phase.name} status`}
                    value={phase.status}
                    disabled={actionLoading}
                    onChange={(e) => void handlePhaseStatusChange(phase.id, e.target.value)}
                    className="rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] px-2 py-1 font-mono text-[10px] uppercase text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card B: Project Milestones */}
        <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
              <CheckCircle2 size={14} /> Project Milestones ({project?.milestones?.length || 0})
            </div>
            <button
              type="button"
              onClick={() => setShowMilestoneForm(!showMilestoneForm)}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 bg-[#111111] text-white hover:bg-[#B68A4A] transition-colors rounded-sm"
            >
              <Plus size={11} /> {showMilestoneForm ? "Cancel" : "Add Milestone"}
            </button>
          </div>

          {showMilestoneForm && (
            <form onSubmit={handleAddMilestone} className="mt-4 border-b border-[#E5E2DC] pb-4 space-y-2.5">
              <input
                type="text"
                placeholder="Milestone title (e.g. Plinth Beam Sign-off)"
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                className="w-full rounded-sm border border-[#D8D6D0] px-3 py-1.5 text-xs text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                required
              />
              <div className="flex flex-wrap gap-2">
                {project?.phases && project.phases.length > 0 && (
                  <select
                    value={milestonePhaseId}
                    onChange={(e) => setMilestonePhaseId(e.target.value)}
                    className="flex-1 rounded-sm border border-[#D8D6D0] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                  >
                    <option value="">All / General Phase</option>
                    {project.phases.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  required
                  className="rounded-sm border border-[#D8D6D0] px-2.5 py-1.5 font-mono text-xs text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={actionLoading || !milestoneTitle.trim()}
                  className="px-3.5 py-1.5 bg-[#B68A4A] text-white font-mono text-[10px] uppercase tracking-wider hover:bg-[#A3783A] disabled:opacity-50"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          )}

          {!project?.milestones || project.milestones.length === 0 ? (
            <p className="py-6 text-center font-mono text-xs text-[#777777]">
              No milestones added yet.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-[#E5E2DC]">
              {project.milestones.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#111111] truncate">{m.title}</p>
                    <p className="text-[10px] font-mono text-[#777777]">
                      {m.phaseName ? `${m.phaseName} · ` : ""}
                      {m.dueDate ? `Due: ${m.dueDate}` : "No due date"}
                    </p>
                  </div>
                  <select
                    aria-label={`Milestone ${m.title} status`}
                    value={m.status}
                    disabled={actionLoading}
                    onChange={(e) => void handleMilestoneStatusChange(m.id, e.target.value)}
                    className="rounded-sm border border-[#D8D6D0] bg-[#FAF9F5] px-2 py-1 font-mono text-[10px] uppercase text-[#111111] focus:border-[#B68A4A] focus:outline-none"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bills (moved above Vendor Updates) */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#D8D6D0] pb-4 gap-3">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
            <Users size={14} /> Bills
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
                {expenseSummary.vendors.map((v: any, idx: number) => {
                  const sAmt = Number(v.settledBillsAmount ?? v.settledAmount ?? 0);
                  const sCnt = Number(v.settledBillsCount ?? v.settledCount ?? 0);
                  const pAmt = Number(v.pendingBillsAmount ?? v.pendingAmount ?? 0);
                  const pCnt = Number(v.pendingBillsCount ?? v.pendingCount ?? 0);
                  const tot = Number(v.totalSpending ?? v.totalBilled ?? (sAmt + pAmt));
                  const name = v.vendorBusinessName || v.vendorName || "Contractor";
                  return (
                    <tr key={`${v.vendorId || name}-${idx}`} className="hover:bg-[#FAF9F5]">
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

      {/* Vendor Updates (moved below Bills) */}
      <div className="rounded-sm border border-[#D8D6D0] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[#B68A4A]">
            <FileText size={14} /> Vendor Updates
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
