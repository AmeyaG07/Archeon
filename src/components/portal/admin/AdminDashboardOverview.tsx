
"use client";

import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  IndianRupee,
  ShieldCheck,
  Users,
} from "lucide-react";

export type AdminActivityType =
  | "project"
  | "invoice"
  | "approval"
  | "payment"
  | "client"
  | "vendor"
  | "system";

export interface AdminDashboardMetrics {
  activeProjects: number;
  completedProjects: number;
  totalClients: number;
  activeVendors: number;
  newEnquiries: number;
  pendingApprovals: number;
  outstandingReceivables: number;
  overdueReceivables: number;
  pendingInvoices: number;
}

export interface AdminProjectSummary {
  id: string;
  reference: string;
  name: string;
  clientName: string;
  status:
    | "Planning"
    | "Under Design"
    | "Under Execution"
    | "On Hold"
    | "Completed";
  progressPercentage?: number;
  updatedAt: string;
}

export interface AdminApprovalSummary {
  id: string;
  reference: string;
  title: string;
  category: string;
  amount?: number;
  currency?: string;
  submittedBy: string;
  submittedAt: string;
  priority: "Normal" | "High" | "Urgent";
}

export interface AdminActivity {
  id: string;
  type: AdminActivityType;
  title: string;
  description: string;
  actorName: string;
  occurredAt: string;
}

export interface AdminDashboardData {
  metrics: AdminDashboardMetrics;
  projects: AdminProjectSummary[];
  approvals: AdminApprovalSummary[];
  activities: AdminActivity[];
  lastUpdatedAt?: string;
}

interface AdminDashboardOverviewProps {
  data: AdminDashboardData | null;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onOpenProjects?: () => void;
  onOpenApprovals?: () => void;
  onOpenEnquiries?: () => void;
  onOpenFinance?: () => void;
  onOpenProject?: (projectId: string) => void;
  onOpenApproval?: (approvalId: string) => void;
  onOpenActivity?: (activityId: string) => void;
}

function formatCurrency(
  amount: number,
  currency = "INR"
) {
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
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

function getProjectStatusStyle(status: AdminProjectSummary["status"]) {
  switch (status) {
    case "Completed":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Under Execution":
      return "bg-[#EAF0F5] text-[#58738C]";
    case "Under Design":
      return "bg-[#F4EFE2] text-[#94743F]";
    case "On Hold":
      return "bg-[#F8EAE7] text-[#9A5147]";
    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getPriorityStyle(priority: AdminApprovalSummary["priority"]) {
  switch (priority) {
    case "Urgent":
      return "bg-[#F8EAE7] text-[#9A5147]";
    case "High":
      return "bg-[#F4EFE2] text-[#94743F]";
    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getActivityIcon(type: AdminActivityType) {
  switch (type) {
    case "project":
      return FolderKanban;
    case "invoice":
      return FileText;
    case "approval":
      return CheckCircle2;
    case "payment":
      return Banknote;
    case "client":
      return Users;
    case "vendor":
      return Building2;
    default:
      return Activity;
  }
}

export function AdminDashboardOverview({
  data,
  loading = false,
  error,
  onRefresh,
  onOpenProjects,
  onOpenApprovals,
  onOpenEnquiries,
  onOpenFinance,
  onOpenProject,
  onOpenApproval,
  onOpenActivity,
}: AdminDashboardOverviewProps) {
  if (loading && !data) {
    return (
      <div className="flex min-h-[450px] items-center justify-center bg-[#F2F0EB]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
          Loading studio operations...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#F2F0EB] p-6 md:p-10">
        <div
          role="alert"
          className="border border-[#E3C9C5] bg-[#FAF3F1] p-6"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 text-[#9A5147]" size={20} />
            <div>
              <h2 className="font-serif text-2xl text-[#171717]">
                Dashboard unavailable
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#805B55]">
                {error || "Dashboard data could not be loaded."}
              </p>
            </div>
          </div>

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
      </div>
    );
  }

  const { metrics } = data;

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Heading */}
      <header className="flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Studio Operations / Dashboard
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Operations Overview
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Monitor projects, financial activity, enquiries and
            operational decisions across the studio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {data.lastUpdatedAt && (
            <p className="font-mono text-[9px] text-[#99958D]">
              Updated: {formatDate(data.lastUpdatedAt)}
            </p>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64] disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Data"}
            </button>
          )}
        </div>
      </header>

      {/* Partial refresh error */}
      {error && (
        <div
          role="alert"
          className="mt-6 border border-[#E3C9C5] bg-[#FAF3F1] px-5 py-4 text-xs leading-6 text-[#805B55]"
        >
          {error} Previously loaded dashboard data is still displayed.
        </div>
      )}

      {/* Main Metrics */}
      <section className="mt-9">
        <SectionLabel>Operational Summary</SectionLabel>

        <div className="mt-5 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active Projects"
            value={metrics.activeProjects}
            icon={<FolderKanban size={19} />}
            onClick={onOpenProjects}
          />

          <MetricCard
            label="Completed Projects"
            value={metrics.completedProjects}
            icon={<CheckCircle2 size={19} />}
            onClick={onOpenProjects}
          />

          <MetricCard
            label="Registered Clients"
            value={metrics.totalClients}
            icon={<Users size={19} />}
          />

          <MetricCard
            label="Active Vendors"
            value={metrics.activeVendors}
            icon={<Building2 size={19} />}
          />
        </div>
      </section>

      {/* Attention Required */}
      <section className="mt-11">
        <SectionLabel>Attention Required</SectionLabel>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AttentionCard
            label="Pending Approvals"
            value={metrics.pendingApprovals}
            description="Decisions awaiting authorised review"
            icon={<ClipboardIcon />}
            onClick={onOpenApprovals}
          />

          <AttentionCard
            label="New Enquiries"
            value={metrics.newEnquiries}
            description="Enquiries requiring follow-up"
            icon={<Users size={19} />}
            onClick={onOpenEnquiries}
          />

          <AttentionCard
            label="Pending Invoices"
            value={metrics.pendingInvoices}
            description="Invoices awaiting processing"
            icon={<FileText size={19} />}
            onClick={onOpenFinance}
          />

          <AttentionCard
            label="Overdue Receivables"
            value={formatCurrency(metrics.overdueReceivables)}
            description="Outstanding amounts past due"
            icon={<Clock3 size={19} />}
            onClick={onOpenFinance}
            monetary
          />
        </div>
      </section>

      {/* Finance */}
      <section className="mt-11">
        <SectionLabel>Financial Position</SectionLabel>

        <div className="mt-5 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] md:grid-cols-2">
          <div className="bg-white p-7 md:p-9">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                Outstanding Receivables
              </p>
              <IndianRupee size={19} className="text-[#A58A64]" />
            </div>

            <p className="mt-6 font-serif text-3xl text-[#171717] md:text-4xl">
              {formatCurrency(metrics.outstandingReceivables)}
            </p>

            <p className="mt-3 text-xs leading-6 text-[#77736C]">
              Total unpaid receivables recorded by the finance system.
            </p>

            {onOpenFinance && (
              <button
                type="button"
                onClick={onOpenFinance}
                className="mt-7 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
              >
                View Finance Records
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>

          <div className="bg-white p-7 md:p-9">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                Overdue Receivables
              </p>
              <Clock3 size={19} className="text-[#A58A64]" />
            </div>

            <p className="mt-6 font-serif text-3xl text-[#171717] md:text-4xl">
              {formatCurrency(metrics.overdueReceivables)}
            </p>

            <p className="mt-3 text-xs leading-6 text-[#77736C]">
              Unpaid receivables classified as overdue by the backend.
            </p>

            {onOpenFinance && (
              <button
                type="button"
                onClick={onOpenFinance}
                className="mt-7 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
              >
                Review Receivables
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Project and Approval Columns */}
      <section className="mt-12 grid grid-cols-1 gap-9 xl:grid-cols-2">

        {/* Projects */}
        <div>
          <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-5">
            <div>
              <SectionLabel>Project Activity</SectionLabel>
              <h2 className="mt-3 font-serif text-2xl text-[#171717]">
                Recent Projects
              </h2>
            </div>

            {onOpenProjects && (
              <button
                type="button"
                onClick={onOpenProjects}
                className="text-[9px] uppercase tracking-widest text-[#987543]"
              >
                View All
              </button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {data.projects.length === 0 ? (
              <EmptyState message="No project records available." />
            ) : (
              data.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onOpenProject?.(project.id)}
                  disabled={!onOpenProject}
                  className="w-full border border-[#D8D6D0] bg-white p-5 text-left transition-colors hover:border-[#A58A64] disabled:cursor-default"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                        {project.reference}
                      </p>

                      <h3 className="mt-2 truncate font-serif text-xl text-[#171717]">
                        {project.name}
                      </h3>

                      <p className="mt-2 text-xs text-[#77736C]">
                        Client: {project.clientName}
                      </p>
                    </div>

                    <span
                      className={`w-fit px-3 py-2 text-[9px] uppercase tracking-widest ${getProjectStatusStyle(project.status)}`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {typeof project.progressPercentage === "number" && (
                    <div className="mt-5">
                      <div className="flex justify-between font-mono text-[9px] text-[#99958D]">
                        <span>Reported Progress</span>
                        <span>
                          {project.progressPercentage}%
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 overflow-hidden bg-[#ECEAE5]">
                        <div
                          className="h-full bg-[#A58A64]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, project.progressPercentage)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="mt-4 font-mono text-[9px] text-[#99958D]">
                    Updated: {formatDate(project.updatedAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Approvals */}
        <div>
          <div className="flex items-end justify-between gap-4 border-b border-[#D8D6D0] pb-5">
            <div>
              <SectionLabel>Decision Queue</SectionLabel>
              <h2 className="mt-3 font-serif text-2xl text-[#171717]">
                Pending Approvals
              </h2>
            </div>

            {onOpenApprovals && (
              <button
                type="button"
                onClick={onOpenApprovals}
                className="text-[9px] uppercase tracking-widest text-[#987543]"
              >
                View All
              </button>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {data.approvals.length === 0 ? (
              <EmptyState message="No pending approval records available." />
            ) : (
              data.approvals.map((approval) => (
                <button
                  key={approval.id}
                  type="button"
                  onClick={() => onOpenApproval?.(approval.id)}
                  disabled={!onOpenApproval}
                  className="w-full border border-[#D8D6D0] bg-white p-5 text-left transition-colors hover:border-[#A58A64] disabled:cursor-default"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                      {approval.reference}
                    </p>

                    <span
                      className={`px-3 py-2 text-[9px] uppercase tracking-widest ${getPriorityStyle(approval.priority)}`}
                    >
                      {approval.priority}
                    </span>
                  </div>

                  <h3 className="mt-4 font-serif text-xl text-[#171717]">
                    {approval.title}
                  </h3>

                  <p className="mt-2 text-xs text-[#77736C]">
                    {approval.category}
                  </p>

                  {typeof approval.amount === "number" && (
                    <p className="mt-4 font-serif text-xl text-[#33312D]">
                      {formatCurrency(
                        approval.amount,
                        approval.currency || "INR"
                      )}
                    </p>
                  )}

                  <div className="mt-5 flex flex-col gap-2 border-t border-[#E5E2DC] pt-4">
                    <p className="text-[10px] text-[#77736C]">
                      Submitted by: {approval.submittedBy}
                    </p>

                    <p className="font-mono text-[9px] text-[#99958D]">
                      {formatDate(approval.submittedAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mt-12">
        <div className="border-b border-[#D8D6D0] pb-5">
          <SectionLabel>System Activity</SectionLabel>

          <h2 className="mt-3 font-serif text-2xl text-[#171717]">
            Recent Activity
          </h2>
        </div>

        <div className="mt-5 border border-[#D8D6D0] bg-white">
          {data.activities.length === 0 ? (
            <EmptyState message="No activity records available." />
          ) : (
            data.activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);

              return (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => onOpenActivity?.(activity.id)}
                  disabled={!onOpenActivity}
                  className={`flex w-full items-start gap-4 p-5 text-left hover:bg-[#FAF9F6] disabled:cursor-default md:p-6 ${
                    index !== data.activities.length - 1
                      ? "border-b border-[#E5E2DC]"
                      : ""
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
                    <Icon size={17} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-[#33312D]">
                      {activity.title}
                    </span>

                    <span className="mt-2 block text-xs leading-6 text-[#77736C]">
                      {activity.description}
                    </span>

                    <span className="mt-3 block font-mono text-[9px] text-[#99958D]">
                      {activity.actorName} · {formatDate(activity.occurredAt)}
                    </span>
                  </span>

                  <ArrowRight
                    size={15}
                    className="mt-2 shrink-0 text-[#A58A64]"
                  />
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Governance Notice */}
      <section className="mt-12 flex items-start gap-4 border border-[#D8D6D0] bg-white p-6">
        <ShieldCheck
          size={21}
          className="mt-0.5 shrink-0 text-[#A58A64]"
        />

        <div>
          <h3 className="text-sm font-medium text-[#33312D]">
            Administrative control and accountability
          </h3>

          <p className="mt-2 text-xs leading-7 text-[#77736C]">
            Dashboard figures are informational summaries. Financial
            approval, payment verification, vendor settlement and
            access-control decisions must be completed through their
            authorised workflows and recorded by the backend.
          </p>
        </div>
      </section>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
      {children}
    </p>
  );
}

function MetricCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 font-serif text-4xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
    </>
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="bg-white p-6 text-left transition-colors hover:bg-[#FAF9F6] md:p-7"
    >
      {content}
    </button>
  ) : (
    <div className="bg-white p-6 md:p-7">{content}</div>
  );
}

function AttentionCard({
  label,
  value,
  description,
  icon,
  onClick,
  monetary = false,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  onClick?: () => void;
  monetary?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p
        className={`mt-6 font-serif text-[#171717] ${
          monetary ? "text-2xl" : "text-4xl"
        }`}
      >
        {monetary ? value : Number(value).toLocaleString("en-IN")}
      </p>

      <p className="mt-3 text-[10px] leading-5 text-[#77736C]">
        {description}
      </p>
    </>
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className="border border-[#D8D6D0] bg-white p-6 text-left transition-colors hover:border-[#A58A64]"
    >
      {content}
    </button>
  ) : (
    <div className="border border-[#D8D6D0] bg-white p-6">
      {content}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-[#D8D6D0] bg-white px-5 py-12 text-center">
      <CalendarDays
        size={23}
        strokeWidth={1.4}
        className="mx-auto text-[#A58A64]"
      />

      <p className="mt-4 text-xs text-[#77736C]">{message}</p>
    </div>
  );
}

function ClipboardIcon() {
  return <FileText size={19} />;
}
