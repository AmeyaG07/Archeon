
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileWarning,
  Filter,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export type SecurityExceptionStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "EXPIRED"
  | "REVOKED";

export type SecurityExceptionRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface SecurityExceptionRecord {
  id: string;
  title: string;
  policyReference: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  affectedResource: string;
  justification: string;
  compensatingControls: string[];
  riskLevel: SecurityExceptionRisk;
  status: SecurityExceptionStatus;
  requestedAt: string;
  startAt?: string;
  expiresAt: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
}

interface AdminSecurityExceptionManagementCenterProps {
  exceptions: SecurityExceptionRecord[];
  loading?: boolean;
  error?: string | null;
  currentUserId?: string;
  onRefresh?: () => void;
  onViewDetails?: (record: SecurityExceptionRecord) => void;
  onReview?: (
    record: SecurityExceptionRecord,
    decision: "APPROVE" | "REJECT",
    reason: string
  ) => void;
  onRevoke?: (
    record: SecurityExceptionRecord,
    reason: string
  ) => void;
}

const statusConfig: Record<
  SecurityExceptionStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
  },
  UNDER_REVIEW: {
    label: "Under review",
    className: "bg-blue-50 text-blue-700",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-600",
  },
  REVOKED: {
    label: "Revoked",
    className: "bg-slate-100 text-slate-600",
  },
};

const riskConfig: Record<
  SecurityExceptionRisk,
  string
> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

const filters = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "ACTIVE",
  "REJECTED",
  "EXPIRED",
  "REVOKED",
] as const;

type ExceptionFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

export default function AdminSecurityExceptionManagementCenter({
  exceptions,
  loading = false,
  error,
  currentUserId,
  onRefresh,
  onViewDetails,
  onReview,
  onRevoke,
}: AdminSecurityExceptionManagementCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ExceptionFilter>("ALL");

  const [selectedRecord, setSelectedRecord] =
    useState<SecurityExceptionRecord | null>(null);

  const [decision, setDecision] = useState<
    "APPROVE" | "REJECT" | "REVOKE"
  >("APPROVE");

  const [reason, setReason] = useState("");

  const metrics = useMemo(
    () => ({
      total: exceptions.length,
      pending: exceptions.filter(
        (item) =>
          item.status === "PENDING" ||
          item.status === "UNDER_REVIEW"
      ).length,
      active: exceptions.filter(
        (item) => item.status === "ACTIVE"
      ).length,
      highRisk: exceptions.filter(
        (item) =>
          item.riskLevel === "HIGH" ||
          item.riskLevel === "CRITICAL"
      ).length,
      expired: exceptions.filter(
        (item) => item.status === "EXPIRED"
      ).length,
    }),
    [exceptions]
  );

  const filteredExceptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exceptions
      .filter((item) => {
        const matchesStatus =
          statusFilter === "ALL" ||
          item.status === statusFilter;

        const searchable = [
          item.id,
          item.title,
          item.policyReference,
          item.requesterName,
          item.requesterId,
          item.affectedResource,
          item.justification,
          item.riskLevel,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesStatus &&
          (!query || searchable.includes(query))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() -
          new Date(a.requestedAt).getTime()
      );
  }, [exceptions, search, statusFilter]);

  function canReview(item: SecurityExceptionRecord) {
    const awaitingReview =
      item.status === "PENDING" ||
      item.status === "UNDER_REVIEW";

    const isRequester =
      Boolean(currentUserId) &&
      item.requesterId === currentUserId;

    const isPreviousReviewer =
      Boolean(currentUserId) &&
      item.reviewedById === currentUserId;

    return awaitingReview && !isRequester && !isPreviousReviewer;
  }

  function openDecision(
    item: SecurityExceptionRecord,
    nextDecision: "APPROVE" | "REJECT" | "REVOKE"
  ) {
    setSelectedRecord(item);
    setDecision(nextDecision);
    setReason("");
  }

  function submitDecision() {
    if (!selectedRecord || !reason.trim()) return;

    if (decision === "REVOKE") {
      onRevoke?.(selectedRecord, reason.trim());
    } else {
      onReview?.(
        selectedRecord,
        decision,
        reason.trim()
      );
    }

    setSelectedRecord(null);
    setReason("");
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <ShieldAlert size={15} />
            Security governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Security Exceptions
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review temporary deviations from approved security
            policies, their risk levels, compensating controls,
            and expiration dates.
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
          label="Total exceptions"
          value={metrics.total}
          description="All supplied records"
          icon={<FileWarning size={19} />}
        />
        <MetricCard
          label="Awaiting review"
          value={metrics.pending}
          description="Pending or under review"
          icon={<Clock3 size={19} />}
        />
        <MetricCard
          label="Active exceptions"
          value={metrics.active}
          description="Currently marked active"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="High-risk records"
          value={metrics.highRisk}
          description="High or critical risk labels"
          icon={<ShieldAlert size={19} />}
        />
        <MetricCard
          label="Expired"
          value={metrics.expired}
          description="Marked expired"
          icon={<XCircle size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Exception register
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredExceptions.length} matching records
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
                placeholder="Search exception or requester..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="text-[#918c83]" />

            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  statusFilter === filter
                    ? "bg-[#292821] text-white"
                    : "border border-[#e8e3da] text-[#77736c]"
                }`}
              >
                {filter === "ALL"
                  ? "All statuses"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading security exceptions...
          </div>
        ) : filteredExceptions.length === 0 ? (
          <div className="p-12 text-center">
            <FileWarning
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No security exceptions found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing the search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Exception</th>
                  <th className="px-5 py-3 font-medium">Requester</th>
                  <th className="px-5 py-3 font-medium">Policy</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Expires</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredExceptions.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fcfbf9]">
                    <td className="max-w-[260px] px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[#918c83]">
                        {item.affectedResource}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {item.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-[#34322c]">
                        {item.requesterName}
                      </p>
                      <p className="mt-1 text-xs text-[#918c83]">
                        {item.requesterRole}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {item.policyReference}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${riskConfig[item.riskLevel]}`}
                      >
                        {item.riskLevel}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-[#77736c]">
                      {formatDate(item.expiresAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[item.status].className}`}
                      >
                        {statusConfig[item.status].label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(item)}
                          disabled={!onViewDetails}
                          title="View exception details"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>

                        {canReview(item) && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openDecision(item, "APPROVE")
                              }
                              disabled={!onReview}
                              title="Review approval"
                              className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] disabled:opacity-40"
                            >
                              <ShieldCheck size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDecision(item, "REJECT")
                              }
                              disabled={!onReview}
                              title="Review rejection"
                              className="rounded-lg border border-[#e8e3da] p-2 text-red-600 disabled:opacity-40"
                            >
                              <XCircle size={15} />
                            </button>
                          </>
                        )}

                        {item.status === "ACTIVE" && (
                          <button
                            type="button"
                            onClick={() =>
                              openDecision(item, "REVOKE")
                            }
                            disabled={!onRevoke}
                            title="Request revocation"
                            className="rounded-lg border border-[#e8e3da] p-2 text-red-600 disabled:opacity-40"
                          >
                            <LockKeyhole size={15} />
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

      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRecord(null);
              setReason("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="exception-review-title"
            className="w-full max-w-lg rounded-2xl border border-[#e9e5dd] bg-white p-6 shadow-xl"
          >
            <h2
              id="exception-review-title"
              className="text-lg font-semibold text-[#292821]"
            >
              {decision === "APPROVE"
                ? "Review exception approval"
                : decision === "REJECT"
                  ? "Review exception rejection"
                  : "Revoke active exception"}
            </h2>

            <p className="mt-1 text-sm text-[#77736c]">
              {selectedRecord.title}
            </p>

            <div className="mt-4 rounded-lg bg-[#faf9f6] p-4">
              <p className="text-xs text-[#918c83]">
                Policy reference
              </p>
              <p className="mt-1 text-sm text-[#34322c]">
                {selectedRecord.policyReference}
              </p>
              <p className="mt-3 text-xs text-[#918c83]">
                Expiration
              </p>
              <p className="mt-1 text-sm text-[#34322c]">
                {formatDate(selectedRecord.expiresAt)}
              </p>
            </div>

            <label className="mt-5 block text-sm font-medium text-[#34322c]">
              Decision reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Provide the reason for this decision..."
                className="mt-2 w-full resize-y rounded-lg border border-[#e5e0d7] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
              />
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecord(null);
                  setReason("");
                }}
                className="rounded-lg border border-[#ded9cf] px-4 py-2.5 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitDecision}
                disabled={!reason.trim()}
                className="rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Submit decision
              </button>
            </div>
          </section>
        </div>
      )}

      <section className="rounded-xl border border-[#e9e5dd] bg-[#faf9f6] p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Security exception safeguards
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Every exception must reference an existing approved
                security policy.
              </li>
              <li>
                • Require documented business justification and
                compensating controls.
              </li>
              <li>
                • Exceptions must have a defined start and expiration
                time; indefinite exceptions should not be allowed.
              </li>
              <li>
                • Enforce independent approval and separation of duties.
              </li>
              <li>
                • Automatically expire exceptions through backend
                enforcement, not frontend display logic.
              </li>
              <li>
                • Record approval, rejection, renewal, and revocation
                decisions in an immutable audit trail.
              </li>
              <li>
                • A high-risk exception should trigger the appropriate
                additional authorization workflow.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
