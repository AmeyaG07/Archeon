
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  GitBranch,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export type ChangeStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "IMPLEMENTED"
  | "ROLLED_BACK";

export type ChangeRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ChangeRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  requestedBy: string;
  reviewedBy?: string;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
  status: ChangeStatus;
  risk: ChangeRisk;
  affectedSystems: string[];
  approvalRequired: boolean;
  rollbackAvailable: boolean;
  version?: string;
};

export type ReleaseRecord = {
  id: string;
  version: string;
  title: string;
  environment: string;
  deployedAt: string;
  deployedBy: string;
  status: "SUCCESS" | "FAILED" | "IN_PROGRESS" | "UNKNOWN";
  changeIds: string[];
};

type Props = {
  changes: ChangeRecord[];
  releases: ReleaseRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenChange?: (change: ChangeRecord) => void;
  onReviewChange?: (
    change: ChangeRecord,
    decision: "APPROVE" | "REJECT"
  ) => void;
  onRequestRollback?: (change: ChangeRecord) => void;
  onOpenRelease?: (release: ReleaseRecord) => void;
};

const statusStyles: Record<ChangeStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-600",
  PENDING_REVIEW: "bg-amber-50 text-amber-800",
  APPROVED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-red-50 text-red-700",
  IMPLEMENTED: "bg-emerald-50 text-emerald-700",
  ROLLED_BACK: "bg-slate-200 text-slate-700",
};

const riskStyles: Record<ChangeRisk, string> = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-800",
  HIGH: "bg-orange-50 text-orange-800",
  CRITICAL: "bg-red-50 text-red-700",
};

const releaseStyles: Record<ReleaseRecord["status"], string> = {
  SUCCESS: "text-emerald-700 bg-emerald-50",
  FAILED: "text-red-700 bg-red-50",
  IN_PROGRESS: "text-blue-700 bg-blue-50",
  UNKNOWN: "text-stone-600 bg-stone-100",
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <span className="text-stone-400">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-500">{description}</p>
    </div>
  );
}

export default function AdminChangeManagementCenter({
  changes,
  releases,
  loading = false,
  error,
  onRefresh,
  onOpenChange,
  onReviewChange,
  onRequestRollback,
  onOpenRelease,
}: Props) {
  const [activeTab, setActiveTab] = useState<"changes" | "releases">(
    "changes"
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const metrics = useMemo(
    () => ({
      total: changes.length,
      pending: changes.filter((item) => item.status === "PENDING_REVIEW")
        .length,
      highRisk: changes.filter(
        (item) => item.risk === "HIGH" || item.risk === "CRITICAL"
      ).length,
      implemented: changes.filter((item) => item.status === "IMPLEMENTED")
        .length,
    }),
    [changes]
  );

  const filteredChanges = useMemo(() => {
    const query = search.trim().toLowerCase();

    return changes.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.id,
          item.title,
          item.description,
          item.requestedBy,
          item.category,
          ...item.affectedSystems,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      const matchesRisk = riskFilter === "ALL" || item.risk === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [changes, search, statusFilter, riskFilter]);

  const filteredReleases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return releases.filter((release) =>
      [
        release.id,
        release.version,
        release.title,
        release.environment,
        release.deployedBy,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [releases, search]);

  const pendingReviewCount = changes.filter(
    (item) => item.status === "PENDING_REVIEW"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-stone-500">
              <GitBranch size={14} />
              <span>Administration</span>
              <span>/</span>
              <span>Change Management</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Change Management
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Review system changes, track release history, and monitor
              approval workflows.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Changes"
            value={metrics.total}
            description="Records currently supplied"
            icon={<History size={18} />}
          />
          <MetricCard
            label="Awaiting Review"
            value={metrics.pending}
            description="Require review"
            icon={<Clock3 size={18} />}
          />
          <MetricCard
            label="High / Critical Risk"
            value={metrics.highRisk}
            description="Changes requiring attention"
            icon={<AlertTriangle size={18} />}
          />
          <MetricCard
            label="Implemented"
            value={metrics.implemented}
            description="Marked as implemented"
            icon={<CheckCircle2 size={18} />}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("changes")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "changes"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Change Requests
                {pendingReviewCount > 0 && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">
                    {pendingReviewCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("releases")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "releases"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Release History
              </button>
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search records..."
                className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {activeTab === "changes" ? (
            <>
              <div className="flex flex-col gap-3 border-b border-stone-100 bg-stone-50/60 p-4 sm:flex-row">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                  aria-label="Filter by change status"
                >
                  <option value="ALL">All statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_REVIEW">Pending review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="IMPLEMENTED">Implemented</option>
                  <option value="ROLLED_BACK">Rolled back</option>
                </select>

                <select
                  value={riskFilter}
                  onChange={(event) => setRiskFilter(event.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                  aria-label="Filter by risk"
                >
                  <option value="ALL">All risk levels</option>
                  <option value="LOW">Low risk</option>
                  <option value="MEDIUM">Medium risk</option>
                  <option value="HIGH">High risk</option>
                  <option value="CRITICAL">Critical risk</option>
                </select>

                <p className="self-center text-xs text-stone-500 sm:ml-auto">
                  {filteredChanges.length} of {changes.length} records
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading change records...
                </div>
              ) : filteredChanges.length === 0 ? (
                <div className="p-12 text-center">
                  <History
                    size={26}
                    className="mx-auto text-stone-300"
                  />
                  <p className="mt-3 text-sm font-medium text-stone-700">
                    No change records found
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    Try changing your search or filters.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredChanges.map((change) => (
                    <article
                      key={change.id}
                      className="p-4 transition hover:bg-stone-50/70 sm:p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">
                              {change.id}
                            </span>
                            <Badge className={statusStyles[change.status]}>
                              {change.status.replaceAll("_", " ")}
                            </Badge>
                            <Badge className={riskStyles[change.risk]}>
                              {change.risk} RISK
                            </Badge>
                          </div>

                          <h3 className="mt-2 text-sm font-semibold">
                            {change.title}
                          </h3>
                          <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-500">
                            {change.description}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500">
                            <span>Category: {change.category}</span>
                            <span>Requested by: {change.requestedBy}</span>
                            <span>Created: {formatDate(change.createdAt)}</span>
                            {change.version && (
                              <span>Version: {change.version}</span>
                            )}
                          </div>

                          {change.affectedSystems.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {change.affectedSystems.map((system) => (
                                <span
                                  key={system}
                                  className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] text-stone-600"
                                >
                                  {system}
                                </span>
                              ))}
                            </div>
                          )}

                          {change.reviewedBy && (
                            <p className="mt-3 text-xs text-stone-500">
                              Reviewed by: {change.reviewedBy}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          {change.status === "PENDING_REVIEW" &&
                            change.approvalRequired && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewChange?.(change, "REJECT")
                                  }
                                  disabled={!onReviewChange}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewChange?.(change, "APPROVE")
                                  }
                                  disabled={!onReviewChange}
                                  className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              </>
                            )}

                          {change.status === "IMPLEMENTED" &&
                            change.rollbackAvailable && (
                              <button
                                type="button"
                                onClick={() => onRequestRollback?.(change)}
                                disabled={!onRequestRollback}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                              >
                                <ArrowDownLeft size={14} />
                                Request rollback
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => onOpenChange?.(change)}
                            disabled={!onOpenChange}
                            className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading release history...
                </div>
              ) : filteredReleases.length === 0 ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  No release records found.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredReleases.map((release) => (
                    <article
                      key={release.id}
                      className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-stone-400">
                            {release.id}
                          </span>
                          <Badge className={releaseStyles[release.status]}>
                            {release.status.replaceAll("_", " ")}
                          </Badge>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold">
                          {release.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-500">
                          <span>Version: {release.version}</span>
                          <span>Environment: {release.environment}</span>
                          <span>Deployed by: {release.deployedBy}</span>
                          <span>Deployed: {formatDate(release.deployedAt)}</span>
                        </div>
                        <p className="mt-2 text-xs text-stone-500">
                          {release.changeIds.length} linked change record(s)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenRelease?.(release)}
                        disabled={!onOpenRelease}
                        className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-50 disabled:opacity-50 sm:self-center"
                      >
                        View release
                        <ArrowUpRight size={14} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-amber-800"
            />
            <div>
              <h2 className="text-sm font-semibold text-stone-900">
                Change control safeguards
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                Approval in this interface must not automatically deploy a
                change. Production deployment and rollback require separate
                authorization, audit records, and verified execution results.
                High-risk changes should follow the approved review process.
              </p>
            </div>
          </div>
        </section>

        <p className="flex items-center gap-2 text-xs text-stone-400">
          <XCircle size={13} />
          This interface does not execute deployments, alter configurations,
          or perform rollbacks.
        </p>
      </div>
    </main>
  );
}
