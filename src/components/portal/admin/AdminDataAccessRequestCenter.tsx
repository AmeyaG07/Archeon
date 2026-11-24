
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export type DataAccessRequestStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED"
  | "EXPIRED";

export type DataAccessCategory =
  | "CLIENT_DATA"
  | "PROJECT_DATA"
  | "FINANCIAL_DATA"
  | "VENDOR_DATA"
  | "DOCUMENTS"
  | "AUDIT_RECORDS"
  | "OTHER";

export interface DataAccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  category: DataAccessCategory;
  resourceName: string;
  requestedPermissions: string[];
  justification: string;
  status: DataAccessRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  expiresAt?: string;
  accessGranted?: boolean;
}

interface AdminDataAccessRequestCenterProps {
  requests: DataAccessRequest[];
  loading?: boolean;
  error?: string | null;
  currentUserId?: string;
  onRefresh?: () => void;
  onViewDetails?: (request: DataAccessRequest) => void;
  onReviewRequest?: (
    request: DataAccessRequest,
    decision: "APPROVE" | "REJECT"
  ) => void;
}

const statusConfig: Record<
  DataAccessRequestStatus,
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
  REVOKED: {
    label: "Revoked",
    className: "bg-slate-100 text-slate-600",
    icon: <LockKeyhole size={14} />,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-600",
    icon: <AlertCircle size={14} />,
  },
};

const categoryLabels: Record<DataAccessCategory, string> = {
  CLIENT_DATA: "Client data",
  PROJECT_DATA: "Project data",
  FINANCIAL_DATA: "Financial data",
  VENDOR_DATA: "Vendor data",
  DOCUMENTS: "Documents",
  AUDIT_RECORDS: "Audit records",
  OTHER: "Other",
};

const filters = [
  "ALL",
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REVOKED",
  "EXPIRED",
] as const;

type RequestFilter = (typeof filters)[number];

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
  status: DataAccessRequestStatus;
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

export default function AdminDataAccessRequestCenter({
  requests,
  loading = false,
  error,
  currentUserId,
  onRefresh,
  onViewDetails,
  onReviewRequest,
}: AdminDataAccessRequestCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<RequestFilter>("ALL");
  const [categoryFilter, setCategoryFilter] =
    useState<DataAccessCategory | "ALL">("ALL");

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
          request.requesterName,
          request.requesterId,
          request.requesterRole,
          request.resourceName,
          request.justification,
          request.requestedPermissions.join(" "),
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

  function canReview(request: DataAccessRequest) {
    const isPending =
      request.status === "PENDING" ||
      request.status === "UNDER_REVIEW";

    const isRequester =
      Boolean(currentUserId) &&
      request.requesterId === currentUserId;

    const isPreviousReviewer =
      Boolean(currentUserId) &&
      request.reviewedBy === currentUserId;

    return isPending && !isRequester && !isPreviousReviewer;
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <ShieldCheck size={15} />
            Data governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Data Access Requests
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review requests for restricted client, project, financial,
            vendor, document, and audit information.
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
          description="All supplied request records"
          icon={<FileText size={19} />}
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
          description="Review in progress"
          icon={<Eye size={19} />}
        />
        <MetricCard
          label="Approved"
          value={metrics.approved}
          description="Marked approved"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="Rejected"
          value={metrics.rejected}
          description="Marked rejected"
          icon={<XCircle size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Request register
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
                placeholder="Search requester or resource..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as RequestFilter)
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
                  event.target.value as DataAccessCategory | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
            >
              <option value="ALL">All data categories</option>
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
            Loading access requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <LockKeyhole size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No access requests found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing the search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Requester</th>
                  <th className="px-5 py-3 font-medium">Resource</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Permissions</th>
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
                        {request.requesterId}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-[#34322c]">
                        {request.resourceName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {request.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {categoryLabels[request.category]}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[230px] flex-wrap gap-1.5">
                        {request.requestedPermissions
                          .slice(0, 3)
                          .map((permission) => (
                            <span
                              key={permission}
                              className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]"
                            >
                              {permission}
                            </span>
                          ))}
                        {request.requestedPermissions.length > 3 && (
                          <span className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]">
                            +{request.requestedPermissions.length - 3}
                          </span>
                        )}
                      </div>
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
                          title="View request details"
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
                            title="Open approval review"
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

      <section className="rounded-xl border border-[#e9e5dd] bg-[#faf9f6] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Access approval safeguards
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Require a clear business justification and specific
                resource scope for every request.
              </li>
              <li>
                • Enforce least-privilege permissions and time-bound
                access grants.
              </li>
              <li>
                • The requester must not approve their own request.
              </li>
              <li>
                • Enforce maker-checker separation and approval authority
                on the backend.
              </li>
              <li>
                • Approval must not automatically grant access until
                the backend completes the authorization workflow.
              </li>
              <li>
                • Record reviewer identity, decision reason, timestamps,
                and access revocation history.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
