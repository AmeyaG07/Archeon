
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  RefreshCw,
  Search,
  Server,
  XCircle,
} from "lucide-react";

export type BackgroundJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING"
  | "CANCELLED";

export interface BackgroundJob {
  id: string;
  name: string;
  category: string;
  status: BackgroundJobStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  attemptCount: number;
  maxAttempts: number;
  workerName?: string;
  correlationId?: string;
  failureSummary?: string;
}

interface AdminBackgroundJobMonitorProps {
  jobs: BackgroundJob[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (job: BackgroundJob) => void;
}

const statusConfig: Record<
  BackgroundJobStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  QUEUED: {
    label: "Queued",
    className: "bg-amber-50 text-amber-700",
    icon: <Clock3 size={14} />,
  },
  RUNNING: {
    label: "Running",
    className: "bg-blue-50 text-blue-700",
    icon: <RefreshCw size={14} />,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
  RETRYING: {
    label: "Retrying",
    className: "bg-indigo-50 text-indigo-700",
    icon: <RefreshCw size={14} />,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600",
    icon: <XCircle size={14} />,
  },
};

const filters = [
  "ALL",
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "RETRYING",
  "CANCELLED",
] as const;

type JobFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined || durationMs === null) return "—";
  if (!Number.isFinite(durationMs) || durationMs < 0) return "—";

  if (durationMs < 1000) return `${durationMs} ms`;

  const seconds = durationMs / 1000;

  if (seconds < 60) return `${seconds.toFixed(1)} sec`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  return `${minutes}m ${remainingSeconds}s`;
}

function StatusBadge({ status }: { status: BackgroundJobStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
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
    <div className="rounded-xl border border-[#e9e5dd] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#77736c]">{label}</p>
        <span className="text-[#9b8358]">{icon}</span>
      </div>

      <p className="mt-3 text-3xl font-semibold text-[#292821]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#918c83]">{description}</p>
    </div>
  );
}

export default function AdminBackgroundJobMonitor({
  jobs,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
}: AdminBackgroundJobMonitorProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<JobFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: jobs.length,
      running: jobs.filter((job) => job.status === "RUNNING").length,
      queued: jobs.filter((job) => job.status === "QUEUED").length,
      completed: jobs.filter((job) => job.status === "COMPLETED").length,
      failed: jobs.filter((job) => job.status === "FAILED").length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesFilter =
        activeFilter === "ALL" || job.status === activeFilter;

      const searchable = [
        job.id,
        job.name,
        job.category,
        job.workerName ?? "",
        job.correlationId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [jobs, search, activeFilter]);

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Server size={15} />
            Platform operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Background Job Monitor
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Monitor asynchronous processing, worker activity, job execution,
            and failures.
          </p>
        </div>

        </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total jobs"
          value={metrics.total}
          description="Jobs in supplied dataset"
          icon={<Activity size={19} />}
        />
        <MetricCard
          label="Running"
          value={metrics.running}
          description="Currently executing"
          icon={<RefreshCw size={19} />}
        />
        <MetricCard
          label="Queued"
          value={metrics.queued}
          description="Waiting for execution"
          icon={<Clock3 size={19} />}
        />
        <MetricCard
          label="Completed"
          value={metrics.completed}
          description="Successfully completed"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="Failed"
          value={metrics.failed}
          description="Marked as failed"
          icon={<XCircle size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Execution records
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredJobs.length} matching jobs
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job, worker, correlation ID..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="mr-1 text-[#918c83]" />

            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activeFilter === filter
                    ? "bg-[#292821] text-white"
                    : "border border-[#e8e3da] text-[#77736c] hover:bg-[#f7f5f0]"
                }`}
              >
                {filter === "ALL"
                  ? "All jobs"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading background jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <Server size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No background jobs found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Job</th>
                  <th className="px-5 py-3 font-medium">Worker</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Attempts</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#fcfbf9]">
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#34322c]">
                        {job.name}
                      </p>
                      <p className="mt-1 text-xs text-[#918c83]">
                        {job.category}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {job.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {job.workerName || "Unassigned"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={job.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {job.attemptCount} / {job.maxAttempts}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDuration(job.durationMs)}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDate(job.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewDetails?.(job)}
                        disabled={!onViewDetails}
                        title="View job details"
                        className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#e9e5dd] bg-[#faf9f6] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Operational safeguards
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Enforce job ownership and authorization on the server.
              </li>
              <li>
                • Use idempotency keys to prevent duplicate business operations.
              </li>
              <li>
                • Apply bounded retries and backoff for transient failures.
              </li>
              <li>
                • Keep sensitive payloads, credentials, and personal data out
                of general-purpose logs.
              </li>
              <li>
                • Track job execution with correlation IDs and audit relevant
                administrative actions.
              </li>
              <li>
                • A displayed job status is only as reliable as the backend
                worker and queue telemetry supplying it.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

function ShieldCheckIcon() {
  return <Activity size={19} className="mt-0.5 shrink-0 text-[#9b8358]" />;
}
