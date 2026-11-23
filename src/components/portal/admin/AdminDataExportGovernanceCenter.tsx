
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export type DataExportStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PROCESSING"
  | "READY"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type DataExportFormat = "CSV" | "XLSX" | "PDF" | "JSON";

export type DataExportCategory =
  | "PROJECTS"
  | "CLIENTS"
  | "VENDORS"
  | "FINANCIAL"
  | "INVOICES"
  | "AUDIT_LOGS"
  | "DOCUMENT_METADATA"
  | "OTHER";

export interface DataExportRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  category: DataExportCategory;
  datasetDescription: string;
  format: DataExportFormat;
  recordCount?: number;
  containsSensitiveData: boolean;
  maskingRequired: boolean;
  status: DataExportStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  expiresAt?: string;
  fileSizeBytes?: number;
  downloadAvailable: boolean;
}

interface AdminDataExportGovernanceCenterProps {
  requests: DataExportRequest[];
  loading?: boolean;
  error?: string | null;
  currentUserId?: string;
  onRefresh?: () => void;
  onViewDetails?: (request: DataExportRequest) => void;
  onReviewRequest?: (
    request: DataExportRequest,
    decision: "APPROVE" | "REJECT"
  ) => void;
  onDownload?: (request: DataExportRequest) => void;
}

const statusConfig: Record<
  DataExportStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
    icon: <Clock3 size={14} />,
  },
  UNDER_REVIEW: {
    label: "Under review",
    className: "bg-blue-50 text-blue-700",
    icon: <Eye size={14} />,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-50 text-blue-700",
    icon: <Clock3 size={14} />,
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-50 text-emerald-700",
    icon: <Download size={14} />,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-600",
    icon: <Archive size={14} />,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600",
    icon: <XCircle size={14} />,
  },
};

const categoryLabels: Record<DataExportCategory, string> = {
  PROJECTS: "Projects",
  CLIENTS: "Clients",
  VENDORS: "Vendors",
  FINANCIAL: "Financial records",
  INVOICES: "Invoices",
  AUDIT_LOGS: "Audit logs",
  DOCUMENT_METADATA: "Document metadata",
  OTHER: "Other",
};

const filters = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "PROCESSING",
  "READY",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

type ExportFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFileSize(bytes?: number) {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }

  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function StatusBadge({ status }: { status: DataExportStatus }) {
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
        {value.toLocaleString("en-IN")}
      </p>

      <p className="mt-1 text-xs text-[#918c83]">{description}</p>
    </div>
  );
}

export default function AdminDataExportGovernanceCenter({
  requests,
  loading = false,
  error,
  currentUserId,
  onRefresh,
  onViewDetails,
  onReviewRequest,
  onDownload,
}: AdminDataExportGovernanceCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ExportFilter>("ALL");
  const [categoryFilter, setCategoryFilter] =
    useState<DataExportCategory | "ALL">("ALL");

  const metrics = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter(
        (request) =>
          request.status === "PENDING" ||
          request.status === "UNDER_REVIEW"
      ).length,
      processing: requests.filter(
        (request) => request.status === "PROCESSING"
      ).length,
      ready: requests.filter(
        (request) => request.status === "READY"
      ).length,
      sensitive: requests.filter(
        (request) => request.containsSensitiveData
      ).length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests
      .filter((request) => {
        const matchesStatus =
          statusFilter === "ALL" ||
          request.status === statusFilter;

        const matchesCategory =
          categoryFilter === "ALL" ||
          request.category === categoryFilter;

        const searchable = [
          request.id,
          request.requesterId,
          request.requesterName,
          request.requesterRole,
          request.datasetDescription,
          request.format,
          request.category,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesStatus &&
          matchesCategory &&
          (!query || searchable.includes(query))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() -
          new Date(a.requestedAt).getTime()
      );
  }, [requests, search, statusFilter, categoryFilter]);

  function canReview(request: DataExportRequest) {
    const awaitingReview =
      request.status === "PENDING" ||
      request.status === "UNDER_REVIEW";

    const isRequester =
      Boolean(currentUserId) &&
      request.requesterId === currentUserId;

    const isPreviousReviewer =
      Boolean(currentUserId) &&
      request.reviewedBy === currentUserId;

    return awaitingReview && !isRequester && !isPreviousReviewer;
  }

  function canDownload(request: DataExportRequest) {
    return (
      request.status === "READY" &&
      request.downloadAvailable
    );
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Archive size={15} />
            Data governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Data Export Governance
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review export requests, data sensitivity, approval status,
            and controlled download availability.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || loading}
          className="rounded-lg border border-[#ded9cf] bg-white px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:opacity-50"
        >
          Refresh
        </button>
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
          label="Total requests"
          value={metrics.total}
          description="All supplied export records"
          icon={<FileText size={19} />}
        />
        <MetricCard
          label="Awaiting review"
          value={metrics.pending}
          description="Pending or under review"
          icon={<Clock3 size={19} />}
        />
        <MetricCard
          label="Processing"
          value={metrics.processing}
          description="Export jobs in progress"
          icon={<FileSpreadsheet size={19} />}
        />
        <MetricCard
          label="Ready"
          value={metrics.ready}
          description="Marked ready for download"
          icon={<Download size={19} />}
        />
        <MetricCard
          label="Sensitive datasets"
          value={metrics.sensitive}
          description="Requests flagged as sensitive"
          icon={<LockKeyhole size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Export request register
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredRequests.length} matching requests
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requester or dataset..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ExportFilter)
              }
              className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
            >
              {filters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter === "ALL"
                    ? "All statuses"
                    : statusConfig[filter].label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as DataExportCategory | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
            >
              <option value="ALL">All datasets</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading export requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <Archive size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No export requests found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing the search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Requester</th>
                  <th className="px-5 py-3 font-medium">Dataset</th>
                  <th className="px-5 py-3 font-medium">Format</th>
                  <th className="px-5 py-3 font-medium">Records</th>
                  <th className="px-5 py-3 font-medium">Data sensitivity</th>
                  <th className="px-5 py-3 font-medium">Requested</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-[#fcfbf9]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {request.requesterName}
                      </p>
                      <p className="mt-1 text-xs text-[#918c83]">
                        {request.requesterRole}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {request.id}
                      </p>
                    </td>

                    <td className="max-w-[260px] px-5 py-4">
                      <p className="text-sm text-[#34322c]">
                        {categoryLabels[request.category]}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#918c83]">
                        {request.datasetDescription}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs font-medium text-[#68645c]">
                        {request.format}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {request.recordCount === undefined
                        ? "—"
                        : request.recordCount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      {request.containsSensitiveData ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                            <LockKeyhole size={13} />
                            Sensitive
                          </span>
                          <p className="text-xs text-[#918c83]">
                            {request.maskingRequired
                              ? "Masking required"
                              : "Masking not flagged"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#77736c]">
                          Not flagged
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-[#77736c]">
                      {formatDate(request.requestedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={request.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(request)}
                          disabled={!onViewDetails}
                          title="View export details"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>

                        {canReview(request) && (
                          <button
                            type="button"
                            onClick={() =>
                              onReviewRequest?.(request, "APPROVE")
                            }
                            disabled={!onReviewRequest}
                            title="Open export approval review"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <ShieldCheck size={15} />
                          </button>
                        )}

                        {canDownload(request) && (
                          <button
                            type="button"
                            onClick={() => onDownload?.(request)}
                            disabled={!onDownload}
                            title="Request secure download"
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
              Export security requirements
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Enforce role-based export permissions and dataset-level
                access checks on the backend.
              </li>
              <li>
                • Require explicit approval for sensitive financial,
                client, and audit datasets.
              </li>
              <li>
                • Apply and verify masking before generating sensitive
                exports.
              </li>
              <li>
                • Use short-lived, authorized download links rather than
                permanent public file URLs.
              </li>
              <li>
                • Record export scope, requester, reviewer, generation
                time, and download activity.
              </li>
              <li>
                • Enforce expiry, retention, and secure deletion policies
                for generated export files.
              </li>
              <li>
                • Do not treat the frontend&apos;s downloadAvailable flag as
                proof of authorization.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
