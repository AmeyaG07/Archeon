
"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FolderKanban,
  History,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
  AlertCircle,
  X,
} from "lucide-react";

export type ProjectDetailStatus =
  | "Planning"
  | "Under Design"
  | "Under Execution"
  | "On Hold"
  | "Completed"
  | "Cancelled";

export type ProjectMilestoneStatus =
  | "Not Started"
  | "In Progress"
  | "Completed"
  | "Delayed";

export type ProjectDocumentCategory =
  | "Drawings"
  | "Renders"
  | "Contracts"
  | "Reports"
  | "Invoices"
  | "Other";

export interface ProjectDetailMilestone {
  id: string;
  title: string;
  description?: string;
  status: ProjectMilestoneStatus;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  responsiblePerson?: string;
}

export interface ProjectDetailDocument {
  id: string;
  name: string;
  category: ProjectDocumentCategory;
  version?: string;
  uploadedBy: string;
  uploadedAt: string;
  visibility: "Internal" | "Client Approved" | "Vendor Shared";
  mimeType?: string;
}

export interface ProjectDetailTeamMember {
  id: string;
  name: string;
  role: string;
  assignmentStatus: "Active" | "Inactive";
}

export interface ProjectDetailActivity {
  id: string;
  title: string;
  description: string;
  actor: string;
  occurredAt: string;
  category: "Project" | "Milestone" | "Document" | "Team" | "Finance";
}

export interface AdminProjectDetail {
  id: string;
  reference: string;
  name: string;
  category: string;
  status: ProjectDetailStatus;
  clientName: string;
  clientReference: string;
  location: string;
  projectManager: string;
  description: string;
  startDate?: string;
  expectedCompletion?: string;
  createdAt: string;
  lastUpdated: string;
  milestones: ProjectDetailMilestone[];
  documents: ProjectDetailDocument[];
  team: ProjectDetailTeamMember[];
  activities: ProjectDetailActivity[];
}

interface AdminProjectDetailWorkspaceProps {
  project: AdminProjectDetail | null;
  loading?: boolean;
  error?: string;

  onBack: () => void;
  onRefresh?: () => void;

  onUpdateStatus?: (
    projectId: string,
    status: ProjectDetailStatus
  ) => Promise<void>;

  onOpenMilestone?: (
    milestoneId: string
  ) => void;

  onCreateMilestone?: (
    projectId: string
  ) => void;

  onOpenDocument?: (
    documentId: string
  ) => void;

  onDownloadDocument?: (
    documentId: string
  ) => void;

  onAssignTeamMember?: (
    projectId: string
  ) => void;

  onOpenClient?: (
    clientReference: string
  ) => void;
}

type ProjectTab =
  | "overview"
  | "milestones"
  | "team"
  | "documents"
  | "activity";

const TABS: { id: ProjectTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "milestones", label: "Milestones" },
  { id: "team", label: "Project Team" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity History" },
];

function formatDate(value?: string) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getProjectStatusStyle(status: ProjectDetailStatus) {
  switch (status) {
    case "Completed":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Under Execution":
      return "bg-[#EAF0F5] text-[#58738C]";
    case "Under Design":
      return "bg-[#F4EFE2] text-[#94743F]";
    case "On Hold":
      return "bg-[#F8EAE7] text-[#9A5147]";
    case "Cancelled":
      return "bg-[#ECEAE5] text-[#77736C]";
    default:
      return "bg-[#F0EEE9] text-[#77736C]";
  }
}

function getMilestoneStyle(status: ProjectMilestoneStatus) {
  switch (status) {
    case "Completed":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "In Progress":
      return "bg-[#EAF0F5] text-[#58738C]";
    case "Delayed":
      return "bg-[#F8EAE7] text-[#9A5147]";
    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

export function AdminProjectDetailWorkspace({
  project,
  loading = false,
  error,
  onBack,
  onRefresh,
  onUpdateStatus,
  onOpenMilestone,
  onCreateMilestone,
  onOpenDocument,
  onDownloadDocument,
  onAssignTeamMember,
  onOpenClient,
}: AdminProjectDetailWorkspaceProps) {
  const [activeTab, setActiveTab] =
    useState<ProjectTab>("overview");

  const [showStatusDialog, setShowStatusDialog] =
    useState(false);

  const [selectedStatus, setSelectedStatus] =
    useState<ProjectDetailStatus | "">("");

  const [statusSubmitting, setStatusSubmitting] =
    useState(false);

  const [statusError, setStatusError] = useState("");

  if (loading && !project) {
    return (
      <div className="flex min-h-[450px] items-center justify-center bg-[#F2F0EB]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
          Loading project record...
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <main className="min-h-[450px] bg-[#F2F0EB] p-6 md:p-10">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#987543]"
        >
          <ArrowLeft size={15} />
          Back to Projects
        </button>

        <div
          role="alert"
          className="mt-9 border border-[#E3C9C5] bg-[#FAF3F1] p-7"
        >
          <AlertCircle size={21} className="text-[#9A5147]" />

          <h2 className="mt-4 font-serif text-2xl text-[#171717]">
            Project record unavailable
          </h2>

          <p className="mt-3 text-sm leading-6 text-[#805B55]">
            {error || "The requested project could not be loaded."}
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-5 bg-[#171717] px-6 py-3 text-[10px] uppercase tracking-widest text-white"
            >
              Retry
            </button>
          )}
        </div>
      </main>
    );
  }

  const completedMilestones = project.milestones.filter(
    (item) => item.status === "Completed"
  ).length;

  const totalMilestones = project.milestones.length;

  const milestoneProgress =
    totalMilestones > 0
      ? Math.round(
          (completedMilestones / totalMilestones) * 100
        )
      : null;

  const activeTeamMembers = project.team.filter(
    (member) => member.assignmentStatus === "Active"
  ).length;

  async function handleStatusUpdate() {
    if (!project || !selectedStatus || !onUpdateStatus) return;

    setStatusSubmitting(true);
    setStatusError("");

    try {
      await onUpdateStatus(project.id, selectedStatus);
      setShowStatusDialog(false);
      setSelectedStatus("");
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : "The project status could not be updated."
      );
    } finally {
      setStatusSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-8 md:px-10 md:py-11 lg:px-12">

      {/* Back Navigation */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
      >
        <ArrowLeft size={15} />
        Project Register
      </button>

      {/* Project Header */}
      <header className="mt-7 border-b border-[#D8D6D0] pb-8">
        <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              Project Record / {project.reference}
            </p>

            <h1 className="mt-4 break-words font-serif text-4xl text-[#171717] md:text-5xl">
              {project.name}
            </h1>

            <p className="mt-3 text-xs uppercase tracking-widest text-[#77736C]">
              {project.category}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`px-4 py-3 text-[9px] uppercase tracking-widest ${getProjectStatusStyle(project.status)}`}
            >
              {project.status}
            </span>

            {onUpdateStatus && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus(project.status);
                  setStatusError("");
                  setShowStatusDialog(true);
                }}
                className="border border-[#D8D6D0] bg-white px-5 py-3 text-[9px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64]"
              >
                Change Status
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="border border-[#D8D6D0] bg-white px-5 py-3 text-[9px] uppercase tracking-widest text-[#55514A] disabled:opacity-50"
              >
                Refresh
              </button>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs leading-6 text-[#805B55]"
          >
            {error}
          </div>
        )}
      </header>

      {/* Project Summary */}
      <section className="mt-8 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Milestones Completed"
          value={`${completedMilestones}/${totalMilestones}`}
          icon={<CheckCircle2 size={18} />}
        />

        <SummaryCard
          label="Active Team Members"
          value={String(activeTeamMembers)}
          icon={<Users size={18} />}
        />

        <SummaryCard
          label="Project Documents"
          value={String(project.documents.length)}
          icon={<FileText size={18} />}
        />

        <SummaryCard
          label="Milestone Progress"
          value={
            milestoneProgress === null
              ? "—"
              : `${milestoneProgress}%`
          }
          icon={<FolderKanban size={18} />}
        />
      </section>

      {/* Project Tabs */}
      <nav
        aria-label="Project details navigation"
        className="mt-10 flex gap-2 overflow-x-auto border-b border-[#D8D6D0]"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={`shrink-0 border-b-2 px-4 py-4 text-[9px] uppercase tracking-widest transition-colors ${
              activeTab === tab.id
                ? "border-[#A58A64] text-[#171717]"
                : "border-transparent text-[#99958D] hover:text-[#55514A]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Overview */}
      {activeTab === "overview" && (
        <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.5fr_1fr]">

          <div className="border border-[#D8D6D0] bg-white p-6 md:p-8">
            <SectionHeading>Project Information</SectionHeading>

            <p className="mt-5 text-sm leading-8 text-[#55514A]">
              {project.description || "No project description has been provided."}
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 border-t border-[#E5E2DC] pt-7 sm:grid-cols-2">
              <DetailItem
                icon={<Users size={15} />}
                label="Client"
                value={project.clientName}
              />

              <DetailItem
                icon={<Building2 size={15} />}
                label="Client Reference"
                value={project.clientReference}
              />

              <DetailItem
                icon={<MapPin size={15} />}
                label="Project Location"
                value={project.location}
              />

              <DetailItem
                icon={<Users size={15} />}
                label="Project Manager"
                value={project.projectManager}
              />

              <DetailItem
                icon={<CalendarDays size={15} />}
                label="Start Date"
                value={formatDate(project.startDate)}
              />

              <DetailItem
                icon={<CalendarDays size={15} />}
                label="Expected Completion"
                value={formatDate(project.expectedCompletion)}
              />

              <DetailItem
                icon={<Clock3 size={15} />}
                label="Created"
                value={formatDate(project.createdAt)}
              />

              <DetailItem
                icon={<History size={15} />}
                label="Last Updated"
                value={formatDateTime(project.lastUpdated)}
              />
            </div>

            {onOpenClient && (
              <button
                type="button"
                onClick={() =>
                  onOpenClient(project.clientReference)
                }
                className="mt-8 inline-flex items-center gap-2 border-t border-[#E5E2DC] pt-6 text-[9px] uppercase tracking-widest text-[#987543]"
              >
                Open Client Record
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div className="border border-[#D8D6D0] bg-white p-6">
              <SectionHeading>Milestone Summary</SectionHeading>

              {totalMilestones === 0 ? (
                <p className="mt-5 text-xs leading-6 text-[#77736C]">
                  No milestones have been recorded for this project.
                </p>
              ) : (
                <>
                  <div className="mt-6 flex items-end justify-between">
                    <p className="font-serif text-4xl text-[#171717]">
                      {milestoneProgress}%
                    </p>

                    <p className="font-mono text-[9px] text-[#99958D]">
                      {completedMilestones} OF {totalMilestones}
                    </p>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden bg-[#ECEAE5]">
                    <div
                      className="h-full bg-[#A58A64]"
                      style={{
                        width: `${milestoneProgress}%`,
                      }}
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setActiveTab("milestones")}
                className="mt-7 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
              >
                View All Milestones
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="border border-[#D8D6D0] bg-white p-6">
              <SectionHeading>Project Team</SectionHeading>

              <p className="mt-5 font-serif text-3xl text-[#171717]">
                {activeTeamMembers}
              </p>

              <p className="mt-2 text-xs text-[#77736C]">
                Currently active assignments
              </p>

              <button
                type="button"
                onClick={() => setActiveTab("team")}
                className="mt-7 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
              >
                View Team
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Milestones */}
      {activeTab === "milestones" && (
        <section className="mt-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-5 sm:flex-row sm:items-end">
            <div>
              <SectionHeading>Project Schedule</SectionHeading>
              <h2 className="mt-3 font-serif text-2xl text-[#171717]">
                Milestones
              </h2>
            </div>

            {onCreateMilestone && (
              <button
                type="button"
                onClick={() => onCreateMilestone(project.id)}
                className="inline-flex items-center gap-2 bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64]"
              >
                <Plus size={14} />
                Add Milestone
              </button>
            )}
          </div>

          {project.milestones.length === 0 ? (
            <EmptyState message="No milestones have been recorded." />
          ) : (
            <div className="mt-5 space-y-3">
              {project.milestones.map((milestone, index) => (
                <button
                  key={milestone.id}
                  type="button"
                  onClick={() => onOpenMilestone?.(milestone.id)}
                  disabled={!onOpenMilestone}
                  className="flex w-full items-start gap-4 border border-[#D8D6D0] bg-white p-5 text-left hover:border-[#A58A64] disabled:cursor-default"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] font-mono text-xs text-[#A58A64]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-serif text-xl text-[#171717]">
                        {milestone.title}
                      </span>

                      <span
                        className={`px-3 py-2 text-[9px] uppercase tracking-widest ${getMilestoneStyle(milestone.status)}`}
                      >
                        {milestone.status}
                      </span>
                    </span>

                    {milestone.description && (
                      <span className="mt-3 block text-xs leading-6 text-[#77736C]">
                        {milestone.description}
                      </span>
                    )}

                    <span className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[9px] text-[#99958D]">
                      <span>
                        Start: {formatDate(milestone.startDate)}
                      </span>

                      <span>
                        Due: {formatDate(milestone.dueDate)}
                      </span>

                      {milestone.responsiblePerson && (
                        <span>
                          Owner: {milestone.responsiblePerson}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Team */}
      {activeTab === "team" && (
        <section className="mt-8">
          <div className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-5 sm:flex-row sm:items-end">
            <div>
              <SectionHeading>Project Resources</SectionHeading>
              <h2 className="mt-3 font-serif text-2xl text-[#171717]">
                Assigned Team
              </h2>
            </div>

            {onAssignTeamMember && (
              <button
                type="button"
                onClick={() => onAssignTeamMember(project.id)}
                className="inline-flex items-center gap-2 bg-[#171717] px-5 py-3 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64]"
              >
                <Plus size={14} />
                Assign Team Member
              </button>
            )}
          </div>

          {project.team.length === 0 ? (
            <EmptyState message="No team assignments have been recorded." />
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {project.team.map((member) => (
                <div
                  key={member.id}
                  className="border border-[#D8D6D0] bg-white p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
                      <Users size={19} />
                    </div>

                    <span
                      className={`px-3 py-2 text-[8px] uppercase tracking-widest ${
                        member.assignmentStatus === "Active"
                          ? "bg-[#EAF1E8] text-[#547A51]"
                          : "bg-[#ECEAE5] text-[#77736C]"
                      }`}
                    >
                      {member.assignmentStatus}
                    </span>
                  </div>

                  <h3 className="mt-5 font-serif text-xl text-[#171717]">
                    {member.name}
                  </h3>

                  <p className="mt-2 text-xs text-[#77736C]">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Documents */}
      {activeTab === "documents" && (
        <section className="mt-8">
          <div className="border-b border-[#D8D6D0] pb-5">
            <SectionHeading>Project Records</SectionHeading>
            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Documents & Deliverables
            </h2>
          </div>

          {project.documents.length === 0 ? (
            <EmptyState message="No project documents are available." />
          ) : (
            <div className="mt-5 overflow-x-auto border border-[#D8D6D0] bg-white">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-[#E5E2DC] bg-[#FAF9F6]">
                  <tr className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                    <th className="px-5 py-4 font-normal">Document</th>
                    <th className="px-5 py-4 font-normal">Category</th>
                    <th className="px-5 py-4 font-normal">Version</th>
                    <th className="px-5 py-4 font-normal">Visibility</th>
                    <th className="px-5 py-4 font-normal">Uploaded</th>
                    <th className="px-5 py-4 font-normal">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {project.documents.map((document) => (
                    <tr
                      key={document.id}
                      className="border-b border-[#E5E2DC] last:border-0"
                    >
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <FileText
                            size={17}
                            className="shrink-0 text-[#A58A64]"
                          />

                          <div>
                            <p className="text-xs text-[#33312D]">
                              {document.name}
                            </p>

                            <p className="mt-1 text-[9px] text-[#99958D]">
                              {document.uploadedBy}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-5 text-xs text-[#77736C]">
                        {document.category}
                      </td>

                      <td className="px-5 py-5 text-xs text-[#77736C]">
                        {document.version || "—"}
                      </td>

                      <td className="px-5 py-5">
                        <span className="text-[9px] uppercase tracking-wide text-[#77736C]">
                          {document.visibility}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-xs text-[#77736C]">
                        {formatDate(document.uploadedAt)}
                      </td>

                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          {onOpenDocument && (
                            <button
                              type="button"
                              onClick={() => onOpenDocument(document.id)}
                              aria-label={`Open ${document.name}`}
                              className="text-[#987543] hover:text-[#171717]"
                            >
                              <ArrowUpRight size={16} />
                            </button>
                          )}

                          {onDownloadDocument && (
                            <button
                              type="button"
                              onClick={() =>
                                onDownloadDocument(document.id)
                              }
                              aria-label={`Download ${document.name}`}
                              className="text-[#987543] hover:text-[#171717]"
                            >
                              <Download size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 border border-[#D8D6D0] bg-white p-5">
            <ShieldCheck
              size={18}
              className="mt-0.5 shrink-0 text-[#A58A64]"
            />

            <p className="text-xs leading-6 text-[#77736C]">
              Document visibility labels are informational. Actual
              access must be enforced by the document service and
              backend permissions. Internal files must never become
              publicly downloadable.
            </p>
          </div>
        </section>
      )}

      {/* Activity History */}
      {activeTab === "activity" && (
        <section className="mt-8">
          <div className="border-b border-[#D8D6D0] pb-5">
            <SectionHeading>Project Audit Trail</SectionHeading>
            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Activity History
            </h2>
          </div>

          {project.activities.length === 0 ? (
            <EmptyState message="No project activity records are available." />
          ) : (
            <div className="mt-6 border border-[#D8D6D0] bg-white">
              {project.activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-4 p-5 md:p-6 ${
                    index !== project.activities.length - 1
                      ? "border-b border-[#E5E2DC]"
                      : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
                    <History size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm text-[#33312D]">
                        {activity.title}
                      </h3>

                      <span className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                        {activity.category}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-6 text-[#77736C]">
                      {activity.description}
                    </p>

                    <p className="mt-3 font-mono text-[9px] text-[#99958D]">
                      {activity.actor} · {formatDateTime(activity.occurredAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Status Dialog */}
      {showStatusDialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !statusSubmitting
            ) {
              setShowStatusDialog(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-status-title"
            className="w-full max-w-md border border-[#D8D6D0] bg-[#F2F0EB] p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  Project Controls
                </p>

                <h2
                  id="project-status-title"
                  className="mt-3 font-serif text-2xl text-[#171717]"
                >
                  Change Project Status
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowStatusDialog(false)}
                disabled={statusSubmitting}
                aria-label="Close status dialog"
                className="text-[#77736C] disabled:opacity-40"
              >
                <X size={19} />
              </button>
            </div>

            <p className="mt-4 text-xs leading-6 text-[#77736C]">
              Select the proposed status. The backend must validate
              whether this transition is permitted.
            </p>

            <label className="mt-6 block">
              <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                New Status
              </span>

              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target.value as ProjectDetailStatus
                  )
                }
                disabled={statusSubmitting}
                className="h-12 w-full border border-[#D8D6D0] bg-white px-4 text-xs outline-none focus:border-[#A58A64]"
              >
                <option value="">Select status</option>
                <option value="Planning">Planning</option>
                <option value="Under Design">Under Design</option>
                <option value="Under Execution">Under Execution</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>

            {statusError && (
              <p role="alert" className="mt-4 text-xs text-[#9A5147]">
                {statusError}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowStatusDialog(false)}
                disabled={statusSubmitting}
                className="flex-1 border border-[#D8D6D0] px-5 py-4 text-[9px] uppercase tracking-widest text-[#77736C] disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={
                  !selectedStatus ||
                  selectedStatus === project.status ||
                  statusSubmitting
                }
                className="flex-1 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {statusSubmitting ? "Saving..." : "Confirm Change"}
              </button>
            </div>
          </section>
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
  icon: ReactNode;
}) {
  return (
    <div className="bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-6 font-serif text-3xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
      {children}
    </p>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[#A58A64]">{icon}</span>

      <div className="min-w-0">
        <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <p className="mt-1 break-words text-xs text-[#55514A]">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 border border-[#D8D6D0] bg-white px-6 py-14 text-center">
      <FolderKanban
        size={26}
        strokeWidth={1.3}
        className="mx-auto text-[#A58A64]"
      />

      <p className="mt-4 text-xs text-[#77736C]">{message}</p>
    </div>
  );
}
