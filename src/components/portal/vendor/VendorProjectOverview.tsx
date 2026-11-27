
"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  FileText,
  FolderOpen,
  MapPin,
  Clock3,
  AlertCircle,
  Plus,
  Receipt,
  ShieldCheck,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BillPhotoModal, type BillPhotoTarget } from "@/components/portal/admin/BillPhotoModal";
import { DualImageUpload } from "@/components/ui/DualImageUpload";
import { OptionalField } from "@/components/ui/OptionalField";
import { emitToast } from "@/providers/ToastProvider";
import { useVendorLanguage } from "@/providers/VendorLanguageProvider";

export type VendorProjectStatus =
  | "Assigned"
  | "In Progress"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export interface VendorProjectDocument {
  id: string;
  title: string;
  category: "Drawing" | "Specification" | "Work Order" | "Other";
  version?: string;
  uploadedAt: string;
}

export interface VendorProjectRecord {
  id: string;
  clientId?: string;
  projectName: string;
  location: string;
  assignment: string;
  scopeDescription: string;
  status: VendorProjectStatus;
  assignedAt: string;
  expectedCompletion?: string;
  projectManager?: string;
  instructions?: string;
  documents: VendorProjectDocument[];
}

interface VendorProjectOverviewProps {
  projects: VendorProjectRecord[];
  loading?: boolean;
  error?: string;
  onOpenProject?: (project: VendorProjectRecord) => void;
  onOpenDocument: (
    document: VendorProjectDocument,
    project: VendorProjectRecord
  ) => void | Promise<void>;
  onRetry?: () => void;
  onBack?: () => void;
}

interface ExpandedProjectDetails {
  loading: boolean;
  progressPercentage?: number;
  phases: Array<{ id: string; name: string; status: string }>;
  milestones: Array<{ id: string; name: string; status: string }>;
  bills: BillPhotoTarget[];
}

function getStatusStyle(status: VendorProjectStatus) {
  switch (status) {
    case "Completed":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "In Progress":
      return "bg-[#EAF0F5] text-[#58738C]";

    case "On Hold":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Cancelled":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

export function VendorProjectOverview({
  projects,
  loading = false,
  error,
  onOpenDocument,
  onRetry,
  onBack,
}: VendorProjectOverviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsByProject, setDetailsByProject] = useState<Record<string, ExpandedProjectDetails>>({});
  const [previewBill, setPreviewBill] = useState<BillPhotoTarget | null>(null);
  const [billTargetProject, setBillTargetProject] = useState<VendorProjectRecord | null>(null);
  const [billAmount, setBillAmount] = useState("");
  const [billTradeCategory, setBillTradeCategory] = useState("Civil Contractor");
  const [billPhotoUrl, setBillPhotoUrl] = useState("");
  const [submittingBill, setSubmittingBill] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const { t } = useVendorLanguage();

  const handleOpenAddBill = (project: VendorProjectRecord) => {
    setBillTargetProject(project);
    setBillAmount("");
    setBillTradeCategory(project.assignment || "Civil Contractor");
    setBillPhotoUrl("");
    setBillError(null);
  };

  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTargetProject || !billAmount) return;

    setSubmittingBill(true);
    setBillError(null);
    try {
      const res = await apiFetch("/api/billing/bills", {
        method: "POST",
        body: JSON.stringify({
          projectId: billTargetProject.id,
          clientId: billTargetProject.clientId || undefined,
          amount: parseFloat(billAmount),
          tradeCategory: billTradeCategory,
          billPhotoUrl: billPhotoUrl || undefined,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || errBody?.message || "Failed to submit bill.");
      }

      const targetProj = billTargetProject;
      setBillTargetProject(null);
      setBillAmount("");
      setBillPhotoUrl("");
      emitToast(`Bill submitted for ${targetProj.projectName}.`, "success");
      setExpandedId(targetProj.id);
      await loadProjectDetails(targetProj);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit bill.";
      setBillError(msg);
      emitToast(msg, "error");
    } finally {
      setSubmittingBill(false);
    }
  };

  const translateProjectStatus = (status: VendorProjectStatus) => {
    switch (status) {
      case "Assigned":
        return t("statusAssigned");
      case "In Progress":
        return t("statusInProgress");
      case "On Hold":
        return t("statusOnHold");
      case "Completed":
        return t("statusCompleted");
      case "Cancelled":
        return t("statusCancelled");
      default:
        return status;
    }
  };

  const loadProjectDetails = async (project: VendorProjectRecord) => {
    setDetailsByProject((prev) => ({
      ...prev,
      [project.id]: {
        ...(prev[project.id] || { phases: [], milestones: [], bills: [] }),
        loading: true,
      },
    }));

    try {
      const [projRes, billsRes] = await Promise.all([
        apiFetch(`/api/operational-projects/${project.id}`).catch(() => null),
        apiFetch("/api/billing/bills/me").catch(() => null),
      ]);

      const projData = projRes && projRes.ok ? await projRes.json().catch(() => null) : null;
      const allBills = billsRes && billsRes.ok ? await billsRes.json().catch(() => []) : [];

      const projKey = project.id.toLowerCase();
      const projRef = (projData?.projectReference || "").toLowerCase();
      const projName = project.projectName.toLowerCase();

      const matchingBills: BillPhotoTarget[] = Array.isArray(allBills)
        ? allBills
            .filter((b: any) => {
              const bProj = (b.projectId || "").toString().toLowerCase();
              return bProj === projKey || (projRef && bProj === projRef) || bProj.includes(projName.replace(/\s+/g, "-"));
            })
            .map((b: any) => ({
              id: String(b.id || b.billId || ""),
              billId: b.billId || "",
              invoiceNumber: b.invoiceNumber || b.billId || "BILL",
              projectName: project.projectName,
              amount: Number(b.amount || 0),
              status: b.status || "PENDING",
              createdAt: b.createdAt || new Date().toISOString(),
              billPhotoUrl: b.billPhotoUrl || undefined,
            }))
        : [];

      setDetailsByProject((prev) => ({
        ...prev,
        [project.id]: {
          loading: false,
          progressPercentage: projData?.progressPercentage,
          phases: Array.isArray(projData?.phases) ? projData.phases : [],
          milestones: Array.isArray(projData?.milestones) ? projData.milestones : [],
          bills: matchingBills,
        },
      }));
    } catch {
      setDetailsByProject((prev) => ({
        ...prev,
        [project.id]: {
          ...(prev[project.id] || { phases: [], milestones: [], bills: [] }),
          loading: false,
        },
      }));
    }
  };

  const toggleExpand = (project: VendorProjectRecord) => {
    if (expandedId === project.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(project.id);
    if (!detailsByProject[project.id]) {
      void loadProjectDetails(project);
    }
  };
  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading assigned projects...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="border border-[#E3C9C5] bg-[#FAF3F1] p-7"
      >
        <AlertCircle size={22} className="text-[#9A5147]" />

        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
          Project information unavailable
        </h2>

        <p className="mt-3 text-sm leading-7 text-[#805B55]">
          {error}
        </p>

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

  const activeProjects = projects.filter(
    (project) =>
      project.status === "Assigned" ||
      project.status === "In Progress"
  );

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-8 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
            >
              <ArrowLeft size={15} />
              {t("backToDashboard")}
            </button>
          )}

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            {t("projectsEyebrow")}
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            {t("projectsPageTitle")}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            {t("projectsSubtitle")}
          </p>
        </header>

        {/* Summary */}
        <section
          aria-label="Project summary"
          className="mt-8 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-3"
        >
          <SummaryCard
            label={t("totalAssignments")}
            value={String(projects.length)}
            icon={<Building2 size={19} />}
          />

          <SummaryCard
            label={t("activeProjects")}
            value={String(activeProjects.length)}
            icon={<Clock3 size={19} />}
          />

          <SummaryCard
            label={t("completedProjects")}
            value={String(
              projects.filter(
                (project) => project.status === "Completed"
              ).length
            )}
            icon={<FolderOpen size={19} />}
          />
        </section>

        {/* Project List */}
        <section className="mt-14">
          <div className="border-b border-[#D8D6D0] pb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
              {t("workPortfolio")}
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              {t("projectAssignments")}
            </h2>
          </div>

          {projects.length === 0 ? (
            <EmptyState message={t("noAssignedProjects")} />
          ) : (
            <div className="mt-7 space-y-4">
              {projects.map((project) => {
                const isExpanded = expandedId === project.id;
                const details = detailsByProject[project.id];

                return (
                  <article
                    key={project.id}
                    className={`border bg-white p-5 transition-all ${
                      isExpanded
                        ? "border-[#A58A64] ring-1 ring-[#A58A64]/40 shadow-md"
                        : "border-[#D8D6D0]"
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
                          <Building2 size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                            <h3 className="break-words font-serif text-xl text-[#171717]">
                              {project.projectName}
                            </h3>
                            <span className="text-xs text-[#77736C]">
                              · {project.assignment}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span
                          className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${getStatusStyle(project.status)}`}
                        >
                          {translateProjectStatus(project.status)}
                        </span>
                      </div>
                    </div>

                    {/* Contact / Meta Strip */}
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E5E2DC] pt-4 sm:grid-cols-3 text-xs text-[#77736C]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin size={13} className="shrink-0 text-[#A58A64]" />
                        <span className="truncate">{project.location}</span>
                      </div>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CalendarDays size={13} className="shrink-0 text-[#A58A64]" />
                        <span>{t("assignedLabel")} {project.assignedAt}</span>
                      </div>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Clock3 size={13} className="shrink-0 text-[#A58A64]" />
                        <span>{t("dueLabel")} {project.expectedCompletion || t("notSpecified")}</span>
                      </div>
                    </div>

                    {/* Scope */}
                    <p className="mt-3 rounded-xs border border-[#E5E2DC] bg-[#FAF8F5] px-3 py-2 text-xs text-[#55524D]">
                      {project.scopeDescription}
                    </p>

                    {/* Footer Row */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DC] pt-4">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#77736C]">
                        {project.projectManager && (
                          <span>PM: {project.projectManager}</span>
                        )}
                        <span>{project.documents.length} {t("sharedFiles")}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenAddBill(project)}
                          className="inline-flex items-center gap-1.5 bg-[#171717] hover:bg-[#A58A64] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white transition-colors rounded-sm cursor-pointer"
                        >
                          <Plus size={12} />
                          Add Bill
                        </button>
                        {!isExpanded && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(project)}
                            className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#987543] hover:border-[#171717] hover:text-[#171717] transition-colors rounded-sm cursor-pointer"
                          >
                            {t("reviewProject")}
                            <ArrowUpRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-[#D8D6D0] pt-4">
                        {details?.loading ? (
                          <div className="border border-[#E5E2DC] bg-[#FAF9F6] px-4 py-4 text-center text-xs text-[#77736C]">
                            {t("loadingProjectDetails")}
                          </div>
                        ) : (
                          <>
                            {/* Bills List */}
                            <section className="border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Receipt size={14} className="text-[#A58A64]" />
                                  <h4 className="font-serif text-base text-[#171717]">
                                    {t("submittedBillsCount")} ({details?.bills.length || 0})
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddBill(project)}
                                  className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#171717] hover:border-[#A58A64] hover:text-[#A58A64] transition-colors rounded-sm cursor-pointer"
                                >
                                  <Plus size={11} />
                                  Add Bill
                                </button>
                              </div>

                              <div className="mt-3">
                                {!details || details.bills.length === 0 ? (
                                  <div className="border border-[#E5E2DC] bg-white px-4 py-3 text-center text-xs text-[#77736C]">
                                    {t("noBillsForProject")}
                                  </div>
                                ) : (
                                  <div className="divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
                                    {details.bills.map((bill) => (
                                      <div
                                        key={bill.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => setPreviewBill(bill)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            setPreviewBill(bill);
                                          }
                                        }}
                                        className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2.5 text-xs hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                                      >
                                        <span className="font-mono text-xs font-semibold text-[#171717]">
                                          {bill.invoiceNumber || bill.billId || "BILL"}
                                        </span>
                                        <div className="flex items-center gap-3 shrink-0">
                                          <span className="bg-[#F4EFE2] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#94743F]">
                                            {bill.status}
                                          </span>
                                          <span className="font-mono text-xs font-semibold text-[#171717]">
                                            ₹{bill.amount.toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </section>

                            {/* 2-Column Equal-Height Details */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch">
                              <section className="flex flex-col border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                                <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-2.5">
                                  <h4 className="font-serif text-base text-[#171717]">
                                    {t("phasesAndProgress")}
                                  </h4>
                                  {details?.progressPercentage !== undefined && (
                                    <span className="font-mono text-[10px] text-[#A58A64]">
                                      {details.progressPercentage}% {t("completePct")}
                                    </span>
                                  )}
                                </div>

                                {(!details || (details.phases.length === 0 && details.milestones.length === 0)) ? (
                                  <div className="mt-3 flex flex-1 items-center justify-center border border-[#E5E2DC] bg-white p-4 text-center text-xs text-[#77736C]">
                                    {t("noPhasesLogged")}
                                  </div>
                                ) : (
                                  <div className="mt-3 divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
                                    {(details.phases.length > 0 ? details.phases : details.milestones).map((item) => (
                                      <div key={item.id} className="flex items-center justify-between px-3.5 py-2 text-xs">
                                        <span className="text-[#171717] truncate">{item.name}</span>
                                        <span className="font-mono text-[10px] uppercase text-[#77736C]">{item.status}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </section>

                              <section className="flex flex-col border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                                <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-2.5">
                                  <h4 className="font-serif text-base text-[#171717]">
                                    {t("sharedProjectDocs")}
                                  </h4>
                                  <span className="font-mono text-[10px] uppercase text-[#99958D]">
                                    {project.documents.length} {t("filesCount")}
                                  </span>
                                </div>

                                {project.documents.length === 0 ? (
                                  <div className="mt-3 flex flex-1 items-center justify-center border border-[#E5E2DC] bg-white p-4 text-center text-xs text-[#77736C]">
                                    {t("noSharedDocs")}
                                  </div>
                                ) : (
                                  <div className="mt-3 divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
                                    {project.documents.map((document) => (
                                      <button
                                        key={document.id}
                                        type="button"
                                        onClick={() => void onOpenDocument(document, project)}
                                        className="flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-xs hover:bg-[#FAF9F6]"
                                      >
                                        <span className="flex items-center gap-2 min-w-0">
                                          <FileText size={13} className="shrink-0 text-[#A58A64]" />
                                          <span className="truncate text-[#171717]">{document.title}</span>
                                        </span>
                                        <span className="font-mono text-[10px] text-[#77736C] shrink-0">
                                          {document.category}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </section>
                            </div>
                          </>
                        )}

                        {/* Bottom Action Bar */}
                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedId(null)}
                            className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-white px-2 py-1 font-mono text-[7px] uppercase tracking-widest text-[#77736C] hover:border-[#171717] hover:text-[#171717] transition-colors"
                          >
                            <X size={9} />
                            {t("closeReview")}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Security Notice */}
        <div className="mt-12 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
          <ShieldCheck
            size={20}
            className="mt-1 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            {t("projectSecurityNotice")}
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            {t("confidentialWorkspace")}
          </p>
        </footer>
      </div>

      <BillPhotoModal
        bill={previewBill}
        onClose={() => setPreviewBill(null)}
        onPhotoUploaded={(updatedBill, newPhotoUrl) => {
          setPreviewBill((prev) => (prev ? { ...prev, billPhotoUrl: newPhotoUrl } : prev));
          if (expandedId) {
            setDetailsByProject((prev) => {
              const cur = prev[expandedId];
              if (!cur) return prev;
              return {
                ...prev,
                [expandedId]: {
                  ...cur,
                  bills: cur.bills.map((b) =>
                    b.id === updatedBill.id ? { ...b, billPhotoUrl: newPhotoUrl } : b
                  ),
                },
              };
            });
          }
        }}
      />

      {/* Add Bill Modal */}
      {billTargetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-add-bill-title"
            className="w-full max-w-md border border-[#D8D6D0] bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E2DC] pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                  Submit Vendor Bill
                </p>
                <h2 id="vendor-add-bill-title" className="mt-1 font-serif text-2xl text-[#171717]">
                  {billTargetProject.projectName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setBillTargetProject(null)}
                aria-label="Close modal"
                className="p-1 text-[#77736C] hover:text-[#171717] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitBill} className="mt-5 space-y-4">
              {billError && (
                <div className="border border-[#E3C9C5] bg-[#FAF3F1] px-3.5 py-2.5 text-xs text-[#9A5147]">
                  {billError}
                </div>
              )}

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#55514A]">
                  Bill Amount (INR) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  placeholder="e.g. 45000"
                  className="mt-1.5 w-full border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-2 text-sm text-[#171717] focus:border-[#A58A64] focus:bg-white focus:outline-none"
                />
              </div>

              <OptionalField label="Trade / Work Category (Optional)">
                <input
                  type="text"
                  value={billTradeCategory}
                  onChange={(e) => setBillTradeCategory(e.target.value)}
                  placeholder="e.g. Civil Contractor, Stonework, MEP"
                  className="w-full border border-[#D8D6D0] bg-[#FAF9F6] px-3 py-2 text-sm text-[#171717] focus:border-[#A58A64] focus:bg-white focus:outline-none"
                />
              </OptionalField>

              <OptionalField label="Bill / Receipt Photo (Optional)">
                <DualImageUpload
                  label="Upload or Attach Receipt"
                  value={billPhotoUrl}
                  onChange={setBillPhotoUrl}
                />
              </OptionalField>

              <div className="flex items-center justify-end gap-3 border-t border-[#E5E2DC] pt-4">
                <button
                  type="button"
                  onClick={() => setBillTargetProject(null)}
                  className="border border-[#D8D6D0] bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-[#55514A] hover:border-[#171717] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBill || !billAmount}
                  className="bg-[#171717] hover:bg-[#A58A64] px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submittingBill ? "Submitting..." : "Submit Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 font-serif text-3xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        <span className="text-[#A58A64]">{icon}</span>
        {label}
      </p>

      <p className="mt-2 text-xs text-[#33312D]">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border-b border-[#D8D6D0] px-5 py-14 text-center">
      <FolderOpen
        size={27}
        strokeWidth={1.3}
        className="mx-auto text-[#A58A64]"
      />

      <p className="mt-4 text-sm leading-7 text-[#77736C]">
        {message}
      </p>
    </div>
  );
}
