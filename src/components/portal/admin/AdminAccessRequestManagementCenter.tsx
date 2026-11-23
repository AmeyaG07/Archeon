
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

export type AccessRequestStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "REVOKED";

export type AccessRequestType =
  | "ROLE_ELEVATION"
  | "RESOURCE_ACCESS"
  | "TEMPORARY_ACCESS"
  | "PROJECT_ACCESS"
  | "FINANCIAL_ACCESS"
  | "ADMIN_ACCESS"
  | "OTHER";

export type AccessRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  requestType: AccessRequestType;
  requestedRole?: string;
  resourceName: string;
  reason: string;
  status: AccessRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  requestedDuration?: string;
  expiresAt?: string;
  grantedPermissions: string[];
};

export type AccessReviewRecord = {
  id: string;
  subjectName: string;
  subjectId: string;
  resourceName: string;
  reviewer: string;
  reviewedAt: string;
  outcome: "RETAINED" | "REVOKED" | "MODIFIED";
  notes?: string;
};

type Props = {
  requests: AccessRequest[];
  reviews: AccessReviewRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenRequest?: (request: AccessRequest) => void;
  onReviewRequest?: (
    request: AccessRequest,
    decision: "APPROVE" | "REJECT"
  ) => void;
  onOpenReview?: (review: AccessReviewRecord) => void;
  onRequestRevocation?: (request: AccessRequest) => void;
};

const statusStyles: Record<AccessRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-stone-100 text-stone-600",
  REVOKED: "bg-orange-50 text-orange-800",
};

const typeLabels: Record<AccessRequestType, string> = {
  ROLE_ELEVATION: "Role elevation",
  RESOURCE_ACCESS: "Resource access",
  TEMPORARY_ACCESS: "Temporary access",
  PROJECT_ACCESS: "Project access",
  FINANCIAL_ACCESS: "Financial access",
  ADMIN_ACCESS: "Administrative access",
  OTHER: "Other",
};

const outcomeStyles: Record<AccessReviewRecord["outcome"], string> = {
  RETAINED: "bg-emerald-50 text-emerald-700",
  REVOKED: "bg-red-50 text-red-700",
  MODIFIED: "bg-blue-50 text-blue-700",
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
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500">{label}</span>
        <span className="text-stone-400">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminAccessRequestManagementCenter({
  requests,
  reviews,
  loading = false,
  error,
  onRefresh,
  onOpenRequest,
  onReviewRequest,
  onOpenReview,
  onRequestRevocation,
}: Props) {
  const [activeTab, setActiveTab] = useState<"requests" | "reviews">(
    "requests"
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const metrics = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter(
        (item) =>
          item.status === "PENDING" ||
          item.status === "UNDER_REVIEW"
      ).length,
      approved: requests.filter(
        (item) => item.status === "APPROVED"
      ).length,
      revoked: requests.filter(
        (item) => item.status === "REVOKED"
      ).length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const searchable = [
        request.id,
        request.requesterId,
        request.requesterName,
        request.requesterEmail ?? "",
        request.resourceName,
        request.requestedRole ?? "",
        request.reason,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "ALL" || request.status === statusFilter) &&
        (typeFilter === "ALL" || request.requestType === typeFilter)
      );
    });
  }, [requests, search, statusFilter, typeFilter]);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reviews.filter((review) =>
      [
        review.id,
        review.subjectName,
        review.subjectId,
        review.resourceName,
        review.reviewer,
        review.outcome,
        review.notes ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [reviews, search]);

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs text-stone-500">
              <LockKeyhole size={14} />
              Administration / Access Requests
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Access Request Management
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Review permission requests, monitor access decisions, and
              maintain an auditable access-review history.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Total requests"
            value={metrics.total}
            icon={<KeyRound size={18} />}
          />
          <Metric
            label="Awaiting review"
            value={metrics.pending}
            icon={<Clock3 size={18} />}
          />
          <Metric
            label="Approved requests"
            value={metrics.approved}
            icon={<CheckCircle2 size={18} />}
          />
          <Metric
            label="Revoked requests"
            value={metrics.revoked}
            icon={<XCircle size={18} />}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("requests")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "requests"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Access requests
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "reviews"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Review history
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
                placeholder="Search access records..."
                className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {activeTab === "requests" ? (
            <>
              <div className="flex flex-wrap gap-3 border-b border-stone-100 bg-stone-50/60 p-4">
                <select
                  aria-label="Filter by request status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All statuses</option>
                  {Object.keys(statusStyles).map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by request type"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All request types</option>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading access requests...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <KeyRound size={28} className="mx-auto text-stone-300" />
                  <p className="mt-3 text-sm font-medium">
                    No access requests found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredRequests.map((request) => (
                    <article key={request.id} className="p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">
                              {request.id}
                            </span>
                            <Badge className={statusStyles[request.status]}>
                              {request.status.replaceAll("_", " ")}
                            </Badge>
                            <Badge className="bg-stone-100 text-stone-600">
                              {typeLabels[request.requestType]}
                            </Badge>
                          </div>

                          <h2 className="mt-2 text-sm font-semibold">
                            {request.requesterName}
                          </h2>

                          <p className="mt-1 text-sm text-stone-500">
                            Requested access to{" "}
                            <span className="font-medium text-stone-700">
                              {request.resourceName}
                            </span>
                          </p>

                          <p className="mt-2 text-sm leading-6 text-stone-500">
                            {request.reason}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                            <p>Requester ID: {request.requesterId}</p>
                            <p>
                              Requested role: {request.requestedRole || "Not specified"}
                            </p>
                            <p>Requested: {formatDate(request.requestedAt)}</p>
                            <p>
                              Requested duration:{" "}
                              {request.requestedDuration || "Not specified"}
                            </p>
                            <p>Reviewed by: {request.reviewedBy || "Not reviewed"}</p>
                            <p>Expires: {formatDate(request.expiresAt)}</p>
                          </div>

                          {request.grantedPermissions.length > 0 && (
                            <div className="mt-3">
                              <p className="mb-2 text-xs font-medium text-stone-600">
                                Recorded permissions
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {request.grantedPermissions.map((permission) => (
                                  <span
                                    key={permission}
                                    className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] text-stone-600"
                                  >
                                    {permission}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(request.status === "PENDING" ||
                            request.status === "UNDER_REVIEW") &&
                            onReviewRequest && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewRequest(request, "REJECT")
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewRequest(request, "APPROVE")
                                  }
                                  className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700"
                                >
                                  Approve
                                </button>
                              </>
                            )}

                          {request.status === "APPROVED" &&
                            onRequestRevocation && (
                              <button
                                type="button"
                                onClick={() => onRequestRevocation(request)}
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                              >
                                Request revocation
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => onOpenRequest?.(request)}
                            disabled={!onOpenRequest}
                            className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100 disabled:opacity-50"
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
                  Loading review history...
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  No access review records found.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredReviews.map((review) => (
                    <article
                      key={review.id}
                      className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-start sm:p-5"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-stone-400">
                            {review.id}
                          </span>
                          <Badge className={outcomeStyles[review.outcome]}>
                            {review.outcome}
                          </Badge>
                        </div>

                        <h3 className="mt-2 text-sm font-semibold">
                          {review.subjectName}
                        </h3>
                        <p className="mt-1 text-sm text-stone-500">
                          {review.resourceName}
                        </p>
                        <p className="mt-2 text-xs text-stone-400">
                          Subject ID: {review.subjectId} · Reviewer:{" "}
                          {review.reviewer} · {formatDate(review.reviewedAt)}
                        </p>
                        {review.notes && (
                          <p className="mt-2 text-xs leading-5 text-stone-500">
                            {review.notes}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenReview?.(review)}
                        disabled={!onOpenReview}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100 disabled:opacity-50"
                      >
                        View review
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
              <h2 className="text-sm font-semibold">
                Access governance safeguards
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                Apply least privilege, verify requester identity, enforce
                separation of duties, and require stronger approval for
                sensitive permissions. Temporary access must have an enforced
                expiry. Approval records must not be treated as proof that
                permissions were successfully provisioned.
              </p>
            </div>
          </div>
        </section>

        <p className="flex items-center gap-2 text-xs text-stone-400">
          <UserCheck size={13} />
          Permission provisioning and revocation must be verified by the
          authoritative backend.
        </p>
      </div>
    </main>
  );
}
