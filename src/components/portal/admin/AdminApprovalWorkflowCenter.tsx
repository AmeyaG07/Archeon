
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export type ApprovalStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export type ApprovalCategory =
  | "INVOICE"
  | "VENDOR_SETTLEMENT"
  | "FINANCIAL_ADJUSTMENT"
  | "USER_ACCESS"
  | "ROLE_CHANGE"
  | "PROJECT_CHANGE"
  | "OTHER";

export interface ApprovalRequest {
  id: string;
  reference: string;
  title: string;
  category: ApprovalCategory;
  description: string;
  requestedBy: string;
  requestedAt: string;
  amount?: number;
  currency?: string;
  status: ApprovalStatus;
  assignedApprover?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  requiresIndependentApprover: boolean;
  version: number;
}

interface AdminApprovalWorkflowCenterProps {
  requests: ApprovalRequest[];
  currentUserId: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (request: ApprovalRequest) => void;
  onApprove?: (requestId: string, version: number) => void;
  onReject?: (requestId: string, version: number) => void;
}

const statusConfig: Record<
  ApprovalStatus,
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
  REJECTED: {
    label: "Rejected",
    className: "bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-slate-100 text-slate-600",
    icon: <XCircle size={14} />,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-600",
    icon: <Clock3 size={14} />,
  },
};

const filters = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
] as const;

type ApprovalFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatAmount(amount?: number, currency = "INR") {
  if (amount === undefined || !Number.isFinite(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-IN")} ${currency}`;
  }
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
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

export default function AdminApprovalWorkflowCenter({
  requests,
  currentUserId,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
  onApprove,
  onReject,
}: AdminApprovalWorkflowCenterProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<ApprovalFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter(
        (request) => request.status === "PENDING"
      ).length,
      underReview: requests.filter(
        (request) => request.status === "UNDER_REVIEW"
      ).length,
      approved: requests.filter(
        (request) => request.status === "APPROVED"
      ).length,
      rejected: requests.filter(
        (request) => request.status === "REJECTED"
      ).length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        activeFilter === "ALL" ||
        request.status === activeFilter;

      const searchable = [
        request.id,
        request.reference,
        request.title,
        request.category,
        request.requestedBy,
        request.assignedApprover ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [requests, search, activeFilter]);

  function canReview(request: ApprovalRequest) {
    const isAwaitingDecision =
      request.status === "PENDING" ||
      request.status === "UNDER_REVIEW";

    const isIndependent =
      !request.requiresIndependentApprover ||
      request.requestedBy !== currentUserId;

    return isAwaitingDecision && isIndependent;
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <ShieldCheck size={15} />
            Governance operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Approval Workflow Center
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review sensitive administrative requests and monitor approval
            decisions with separation-of-duties controls.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || loading}
          className="rounded-lg border border-[#ded9cf] bg-white px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh requests
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
          description="Requests in supplied dataset"
          icon={<LockKeyhole size={19} />}
        />
        <MetricCard
          label="Pending"
          value={metrics.pending}
          description="Awaiting review"
          icon={<Clock3 size={19} />}
        />
        <MetricCard
          label="Under review"
          value={metrics.underReview}
          description="Review currently in progress"
          icon={<Eye size={19} />}
        />
        <MetricCard
          label="Approved"
          value={metrics.approved}
          description="Approved requests"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="Rejected"
          value={metrics.rejected}
          description="Rejected requests"
          icon={<XCircle size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Approval requests
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
                placeholder="Search request, reference, requester..."
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
                  ? "All requests"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading approval requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No approval requests found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Request</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Requested by</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Approver</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredRequests.map((request) => {
                  const reviewAllowed = canReview(request);

                  return (
                    <tr
                      key={request.id}
                      className="hover:bg-[#fcfbf9]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-[#34322c]">
                          {request.title}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#918c83]">
                          {request.reference}
                        </p>
                        <p className="mt-1 text-xs text-[#aaa397]">
                          {formatDate(request.requestedAt)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {request.category.replaceAll("_", " ")}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {request.requestedBy}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {formatAmount(
                          request.amount,
                          request.currency
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {request.assignedApprover || "Unassigned"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={request.status} />
                        {request.requiresIndependentApprover &&
                          request.requestedBy === currentUserId &&
                          reviewAllowed === false && (
                            <p className="mt-1 text-xs text-amber-700">
                              Cannot self-approve
                            </p>
                          )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails?.(request)}
                            disabled={!onViewDetails}
                            title="View request details"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onApprove?.(request.id, request.version)
                            }
                            disabled={!reviewAllowed || !onApprove}
                            title="Request approval decision"
                            className="rounded-lg border border-[#e8e3da] p-2 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <CheckCircle2 size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onReject?.(request.id, request.version)
                            }
                            disabled={!reviewAllowed || !onReject}
                            title="Request rejection decision"
                            className="rounded-lg border border-[#e8e3da] p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <XCircle size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              Approval and separation-of-duties safeguards
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • The backend must independently enforce approver
                authorization and prohibit self-approval where required.
              </li>
              <li>
                • Use optimistic concurrency or equivalent protection to
                prevent decisions against outdated request versions.
              </li>
              <li>
                • Require a recorded reason for rejection and other
                policy-sensitive decisions.
              </li>
              <li>
                • Approval must not automatically imply payment execution,
                account provisioning, or another downstream action.
              </li>
              <li>
                • Record the requester, reviewer, timestamp, decision,
                reason, and resulting action in the audit trail.
              </li>
              <li>
                • Configure approval thresholds and required reviewers
                through approved business policy, not frontend constants.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
