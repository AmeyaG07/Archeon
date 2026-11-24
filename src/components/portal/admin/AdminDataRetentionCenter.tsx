
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  Archive,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Lock,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

export type RetentionRecordStatus =
  | "ACTIVE"
  | "REVIEW_DUE"
  | "DISPOSAL_SCHEDULED"
  | "LEGAL_HOLD"
  | "DISPOSAL_PENDING"
  | "DISPOSED"
  | "EXCEPTION";

export type RetentionDataCategory =
  | "PROJECT_DOCUMENTS"
  | "FINANCIAL_RECORDS"
  | "CLIENT_RECORDS"
  | "VENDOR_RECORDS"
  | "AUDIT_LOGS"
  | "ENQUIRIES"
  | "SYSTEM_EXPORTS"
  | "OTHER";

export interface DataRetentionRecord {
  id: string;
  category: RetentionDataCategory;
  description: string;
  retentionPolicyName: string;
  retentionPeriodLabel: string;
  createdAt: string;
  retentionEndsAt?: string;
  status: RetentionRecordStatus;
  legalHoldReference?: string;
  disposalJobId?: string;
  lastReviewedAt?: string;
  ownerName: string;
}

export interface DisposalHistoryRecord {
  id: string;
  category: RetentionDataCategory;
  completedAt: string;
  recordCount: number;
  method: string;
  approvedBy: string;
  executionReference: string;
  outcome: "SUCCESS" | "PARTIAL" | "FAILED";
}

interface AdminDataRetentionCenterProps {
  records: DataRetentionRecord[];
  disposalHistory: DisposalHistoryRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewRecord?: (record: DataRetentionRecord) => void;
  onRequestReview?: (recordId: string) => void;
  onViewDisposalDetails?: (record: DisposalHistoryRecord) => void;
}

const statusConfig: Record<
  RetentionRecordStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  ACTIVE: {
    label: "Active retention",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  REVIEW_DUE: {
    label: "Review due",
    className: "bg-amber-50 text-amber-700",
    icon: <CalendarClock size={14} />,
  },
  DISPOSAL_SCHEDULED: {
    label: "Disposal scheduled",
    className: "bg-blue-50 text-blue-700",
    icon: <Clock3 size={14} />,
  },
  LEGAL_HOLD: {
    label: "Legal hold",
    className: "bg-purple-50 text-purple-700",
    icon: <Lock size={14} />,
  },
  DISPOSAL_PENDING: {
    label: "Disposal pending",
    className: "bg-orange-50 text-orange-700",
    icon: <Trash2 size={14} />,
  },
  DISPOSED: {
    label: "Disposed",
    className: "bg-slate-100 text-slate-600",
    icon: <Archive size={14} />,
  },
  EXCEPTION: {
    label: "Exception",
    className: "bg-red-50 text-red-700",
    icon: <AlertCircle size={14} />,
  },
};

const statusFilters = [
  "ALL",
  "ACTIVE",
  "REVIEW_DUE",
  "DISPOSAL_SCHEDULED",
  "LEGAL_HOLD",
  "DISPOSAL_PENDING",
  "DISPOSED",
  "EXCEPTION",
] as const;

type StatusFilter = (typeof statusFilters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({
  status,
}: {
  status: RetentionRecordStatus;
}) {
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

export default function AdminDataRetentionCenter({
  records,
  disposalHistory,
  loading = false,
  error,
  onRefresh,
  onViewRecord,
  onRequestReview,
  onViewDisposalDetails,
}: AdminDataRetentionCenterProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<StatusFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: records.length,
      reviewDue: records.filter(
        (record) => record.status === "REVIEW_DUE"
      ).length,
      legalHolds: records.filter(
        (record) => record.status === "LEGAL_HOLD"
      ).length,
      pendingDisposal: records.filter(
        (record) =>
          record.status === "DISPOSAL_PENDING" ||
          record.status === "DISPOSAL_SCHEDULED"
      ).length,
      exceptions: records.filter(
        (record) => record.status === "EXCEPTION"
      ).length,
    }),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesStatus =
        activeFilter === "ALL" ||
        record.status === activeFilter;

      const searchable = [
        record.id,
        record.description,
        record.category,
        record.retentionPolicyName,
        record.ownerName,
        record.legalHoldReference ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [records, search, activeFilter]);

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Archive size={15} />
            Governance operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Data Retention & Disposal
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Monitor retention obligations, review deadlines, legal holds,
            and authorized disposal records.
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
          label="Tracked records"
          value={metrics.total}
          description="Records in supplied dataset"
          icon={<Archive size={19} />}
        />
        <MetricCard
          label="Review due"
          value={metrics.reviewDue}
          description="Require retention review"
          icon={<CalendarClock size={19} />}
        />
        <MetricCard
          label="Legal holds"
          value={metrics.legalHolds}
          description="Protected from ordinary disposal"
          icon={<Lock size={19} />}
        />
        <MetricCard
          label="Pending disposal"
          value={metrics.pendingDisposal}
          description="Scheduled or awaiting execution"
          icon={<Trash2 size={19} />}
        />
        <MetricCard
          label="Exceptions"
          value={metrics.exceptions}
          description="Require investigation"
          icon={<AlertCircle size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Retention register
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredRecords.length} matching records
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
                placeholder="Search category, policy, owner..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="mr-1 text-[#918c83]" />

            {statusFilters.map((filter) => (
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
                  ? "All records"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading retention records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Archive
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No retention records found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing the search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Data category</th>
                  <th className="px-5 py-3 font-medium">Policy</th>
                  <th className="px-5 py-3 font-medium">Retention period</th>
                  <th className="px-5 py-3 font-medium">Retention end</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-[#fcfbf9]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {record.category.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 max-w-[230px] text-xs text-[#918c83]">
                        {record.description}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {record.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {record.retentionPolicyName}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {record.retentionPeriodLabel}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDate(record.retentionEndsAt)}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {record.ownerName}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={record.status} />
                      {record.status === "LEGAL_HOLD" &&
                        record.legalHoldReference && (
                          <p className="mt-1 text-xs text-purple-700">
                            Ref: {record.legalHoldReference}
                          </p>
                        )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewRecord?.(record)}
                          disabled={!onViewRecord}
                          title="View retention details"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>

                        {(record.status === "REVIEW_DUE" ||
                          record.status === "EXCEPTION") && (
                          <button
                            type="button"
                            onClick={() => onRequestReview?.(record.id)}
                            disabled={!onRequestReview}
                            title="Request retention review"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <ShieldCheck size={15} />
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

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="border-b border-[#eeeae3] p-5">
          <h2 className="font-semibold text-[#292821]">
            Disposal history
          </h2>
          <p className="mt-1 text-xs text-[#918c83]">
            Historical execution records supplied by the backend
          </p>
        </div>

        {disposalHistory.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#918c83]">
            No disposal history records available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Records</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Approved by</th>
                  <th className="px-5 py-3 font-medium">Outcome</th>
                  <th className="px-5 py-3 font-medium">Completed</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {disposalHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-sm text-[#34322c]">
                      {item.category.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {item.recordCount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {item.method}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {item.approvedBy}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.outcome === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.outcome === "PARTIAL"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {item.outcome}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDate(item.completedAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewDisposalDetails?.(item)}
                        disabled={!onViewDisposalDetails}
                        title="View disposal details"
                        className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
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
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Retention and disposal safeguards
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Retention periods must come from approved legal and
                business policies, not frontend assumptions.
              </li>
              <li>
                • Legal holds must prevent ordinary disposal until formally
                released by an authorized process.
              </li>
              <li>
                • Disposal requires authorization, execution evidence, and
                an auditable record.
              </li>
              <li>
                • Consider backups, exports, replicas, and third-party
                processors when defining disposal completion.
              </li>
              <li>
                • Preserve financial, contractual, and audit records where
                applicable retention obligations require it.
              </li>
              <li>
                • A disposal history entry is not independent proof that
                every copy of the data was erased.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
