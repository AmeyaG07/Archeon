
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Search,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

export type ImportJobStatus =
  | "QUEUED"
  | "VALIDATING"
  | "READY_FOR_REVIEW"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED"
  | "CANCELLED";

export interface ImportValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
}

export interface ImportJob {
  id: string;
  fileName: string;
  importType: string;
  uploadedBy: string;
  uploadedAt: string;
  status: ImportJobStatus;
  validation: ImportValidationSummary;
  processedRows: number;
  failedRows: number;
  completedAt?: string;
  failureReason?: string;
}

interface AdminDataImportCenterProps {
  jobs: ImportJob[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenJob?: (job: ImportJob) => void;
  onRequestReview?: (jobId: string) => void;
  onRequestDownloadErrors?: (jobId: string) => void;
  onRequestUpload?: () => void;
}

const statusConfig: Record<
  ImportJobStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  QUEUED: {
    label: "Queued",
    className: "bg-slate-100 text-slate-700",
    icon: <Clock3 size={14} />,
  },
  VALIDATING: {
    label: "Validating",
    className: "bg-blue-50 text-blue-700",
    icon: <ShieldCheck size={14} />,
  },
  READY_FOR_REVIEW: {
    label: "Ready for review",
    className: "bg-amber-50 text-amber-700",
    icon: <Eye size={14} />,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-indigo-50 text-indigo-700",
    icon: <Clock3 size={14} />,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  COMPLETED_WITH_ERRORS: {
    label: "Completed with errors",
    className: "bg-orange-50 text-orange-700",
    icon: <AlertCircle size={14} />,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600",
    icon: <XCircle size={14} />,
  },
};

const filterOptions = [
  "ALL",
  "QUEUED",
  "VALIDATING",
  "READY_FOR_REVIEW",
  "PROCESSING",
  "COMPLETED",
  "COMPLETED_WITH_ERRORS",
  "FAILED",
  "CANCELLED",
] as const;

type ImportFilter = (typeof filterOptions)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({ status }: { status: ImportJobStatus }) {
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

function SummaryCard({
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

export default function AdminDataImportCenter({
  jobs,
  loading = false,
  error,
  onRefresh,
  onOpenJob,
  onRequestReview,
  onRequestDownloadErrors,
  onRequestUpload,
}: AdminDataImportCenterProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<ImportFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: jobs.length,
      awaitingReview: jobs.filter(
        (job) => job.status === "READY_FOR_REVIEW"
      ).length,
      processing: jobs.filter(
        (job) =>
          job.status === "QUEUED" ||
          job.status === "VALIDATING" ||
          job.status === "PROCESSING"
      ).length,
      completed: jobs.filter(
        (job) =>
          job.status === "COMPLETED" ||
          job.status === "COMPLETED_WITH_ERRORS"
      ).length,
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
        job.fileName,
        job.importType,
        job.uploadedBy,
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
            <FileSpreadsheet size={15} />
            Platform operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Data Import Center
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review import jobs, validation summaries, processing outcomes,
            and rejected records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || loading}
            className="rounded-lg border border-[#ded9cf] bg-white px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={onRequestUpload}
            disabled={!onRequestUpload}
            className="inline-flex items-center gap-2 rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#403e35] disabled:opacity-50"
          >
            <Upload size={15} />
            Request import
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Import jobs"
          value={metrics.total}
          description="Jobs in the supplied dataset"
          icon={<FileSpreadsheet size={19} />}
        />
        <SummaryCard
          label="Awaiting review"
          value={metrics.awaitingReview}
          description="Validation review required"
          icon={<Eye size={19} />}
        />
        <SummaryCard
          label="In progress"
          value={metrics.processing}
          description="Queued, validating or processing"
          icon={<Clock3 size={19} />}
        />
        <SummaryCard
          label="Completed"
          value={metrics.completed}
          description="Includes completed jobs with errors"
          icon={<CheckCircle2 size={19} />}
        />
        <SummaryCard
          label="Failed"
          value={metrics.failed}
          description="Jobs marked as failed"
          icon={<XCircle size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Import history
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredJobs.length} matching import jobs
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
                placeholder="Search file, job ID, uploader..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="mr-1 text-[#918c83]" />

            {filterOptions.map((filter) => (
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
                  ? "All"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading import jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No import jobs found
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
                  <th className="px-5 py-3 font-medium">Import file</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Validation</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#fcfbf9]">
                    <td className="px-5 py-4">
                      <p className="max-w-[230px] truncate text-sm font-medium text-[#34322c]">
                        {job.fileName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#918c83]">
                        {job.id}
                      </p>
                      <p className="mt-1 text-xs text-[#aaa397]">
                        By {job.uploadedBy}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {job.importType}
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1 text-xs">
                        <p className="font-medium text-[#34322c]">
                          {job.validation.validRows} valid /{" "}
                          {job.validation.totalRows} total
                        </p>
                        <p className="text-[#918c83]">
                          {job.validation.invalidRows} invalid ·{" "}
                          {job.validation.duplicateRows} duplicates ·{" "}
                          {job.validation.warningRows} warnings
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={job.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDate(job.uploadedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenJob?.(job)}
                          disabled={!onOpenJob}
                          title="Open import details"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>

                        {job.status === "READY_FOR_REVIEW" && (
                          <button
                            type="button"
                            onClick={() => onRequestReview?.(job.id)}
                            disabled={!onRequestReview}
                            title="Request validation review"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <ShieldCheck size={15} />
                          </button>
                        )}

                        {(job.validation.invalidRows > 0 ||
                          job.failedRows > 0) && (
                          <button
                            type="button"
                            onClick={() =>
                              onRequestDownloadErrors?.(job.id)
                            }
                            disabled={!onRequestDownloadErrors}
                            title="Request rejected-row report"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <Download size={15} />
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
      </section>

      <section className="rounded-xl border border-[#e9e5dd] bg-[#faf9f6] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Import security and data integrity
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Validate file type, size, schema, and authorization on the
                server.
              </li>
              <li>
                • Use a staging area before committing imported records.
              </li>
              <li>
                • Detect duplicates and enforce idempotency to prevent
                accidental repeated imports.
              </li>
              <li>
                • Keep original files, validation reports, and import actions
                under controlled access and retention policies.
              </li>
              <li>
                • Record who uploaded, reviewed, approved, and executed each
                import.
              </li>
              <li>
                • Never treat a successful upload as proof that database
                records were successfully imported.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
