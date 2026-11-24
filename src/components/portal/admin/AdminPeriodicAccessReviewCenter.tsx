
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";

export type AccessReviewStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "RETAINED"
  | "MODIFICATION_REQUIRED"
  | "REVOCATION_REQUIRED"
  | "COMPLETED";

export interface AccessReviewRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  department?: string;
  accessSummary: string;
  permissionScopes: string[];
  reviewerId?: string;
  reviewerName?: string;
  status: AccessReviewStatus;
  reviewPeriod: string;
  dueAt: string;
  reviewedAt?: string;
  lastAccessAt?: string;
  justification?: string;
}

interface AdminPeriodicAccessReviewCenterProps {
  records: AccessReviewRecord[];
  loading?: boolean;
  error?: string | null;
  currentUserId?: string;
  onRefresh?: () => void;
  onViewDetails?: (record: AccessReviewRecord) => void;
  onSubmitDecision?: (
    record: AccessReviewRecord,
    decision: "RETAIN" | "MODIFY" | "REVOKE",
    reason: string
  ) => void;
}

const statusConfig: Record<
  AccessReviewStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
  },
  IN_REVIEW: {
    label: "In review",
    className: "bg-blue-50 text-blue-700",
  },
  RETAINED: {
    label: "Retained",
    className: "bg-emerald-50 text-emerald-700",
  },
  MODIFICATION_REQUIRED: {
    label: "Modification required",
    className: "bg-orange-50 text-orange-700",
  },
  REVOCATION_REQUIRED: {
    label: "Revocation required",
    className: "bg-red-50 text-red-700",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-slate-100 text-slate-600",
  },
};

const filters = [
  "ALL",
  "PENDING",
  "IN_REVIEW",
  "RETAINED",
  "MODIFICATION_REQUIRED",
  "REVOCATION_REQUIRED",
  "COMPLETED",
] as const;

type ReviewFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
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

export default function AdminPeriodicAccessReviewCenter({
  records,
  loading = false,
  error,
  currentUserId,
  onRefresh,
  onViewDetails,
  onSubmitDecision,
}: AdminPeriodicAccessReviewCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ReviewFilter>("ALL");

  const [selectedRecord, setSelectedRecord] =
    useState<AccessReviewRecord | null>(null);

  const [decision, setDecision] = useState<
    "RETAIN" | "MODIFY" | "REVOKE"
  >("RETAIN");

  const [reason, setReason] = useState("");

  const metrics = useMemo(
    () => ({
      total: records.length,
      pending: records.filter(
        (record) =>
          record.status === "PENDING" ||
          record.status === "IN_REVIEW"
      ).length,
      retained: records.filter(
        (record) => record.status === "RETAINED"
      ).length,
      modification: records.filter(
        (record) =>
          record.status === "MODIFICATION_REQUIRED"
      ).length,
      revocation: records.filter(
        (record) => record.status === "REVOCATION_REQUIRED"
      ).length,
    }),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const matchesStatus =
          statusFilter === "ALL" ||
          record.status === statusFilter;

        const searchable = [
          record.id,
          record.userId,
          record.userName,
          record.userRole,
          record.department ?? "",
          record.accessSummary,
          record.permissionScopes.join(" "),
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
          new Date(a.dueAt).getTime() -
          new Date(b.dueAt).getTime()
      );
  }, [records, search, statusFilter]);

  function canReview(record: AccessReviewRecord) {
    const awaitingReview =
      record.status === "PENDING" ||
      record.status === "IN_REVIEW";

    const isSubject =
      Boolean(currentUserId) &&
      record.userId === currentUserId;

    const isPreviousReviewer =
      Boolean(currentUserId) &&
      record.reviewerId === currentUserId;

    return awaitingReview && !isSubject && !isPreviousReviewer;
  }

  function submitDecision() {
    if (!selectedRecord || !reason.trim()) return;

    onSubmitDecision?.(
      selectedRecord,
      decision,
      reason.trim()
    );

    setSelectedRecord(null);
    setReason("");
    setDecision("RETAIN");
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <UserCheck size={15} />
            Access governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Periodic Access Reviews
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review existing user permissions and determine whether
            access should be retained, modified, or revoked.
          </p>
        </div>

        </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total records"
          value={metrics.total}
          description="Supplied review records"
          icon={<UserCheck size={19} />}
        />
        <MetricCard
          label="Awaiting review"
          value={metrics.pending}
          description="Pending or in review"
          icon={<Clock3 size={19} />}
        />
        <MetricCard
          label="Retained"
          value={metrics.retained}
          description="Access marked for retention"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="Modification required"
          value={metrics.modification}
          description="Permission changes identified"
          icon={<ShieldCheck size={19} />}
        />
        <MetricCard
          label="Revocation required"
          value={metrics.revocation}
          description="Access removal identified"
          icon={<UserX size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Access review register
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
                placeholder="Search user, role, permission..."
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
                  ? "All records"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading access reviews...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No access review records found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Current access</th>
                  <th className="px-5 py-3 font-medium">Scopes</th>
                  <th className="px-5 py-3 font-medium">Reviewer</th>
                  <th className="px-5 py-3 font-medium">Due date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-[#fcfbf9]">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {record.userName}
                      </p>
                      <p className="mt-1 text-xs text-[#918c83]">
                        {record.userRole}
                        {record.department
                          ? ` · ${record.department}`
                          : ""}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {record.userId}
                      </p>
                    </td>

                    <td className="max-w-[220px] px-5 py-4 text-sm text-[#68645c]">
                      {record.accessSummary}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[230px] flex-wrap gap-1.5">
                        {record.permissionScopes
                          .slice(0, 3)
                          .map((scope) => (
                            <span
                              key={scope}
                              className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]"
                            >
                              {scope}
                            </span>
                          ))}
                        {record.permissionScopes.length > 3 && (
                          <span className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]">
                            +{record.permissionScopes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {record.reviewerName || "Unassigned"}
                    </td>

                    <td className="px-5 py-4 text-xs text-[#77736c]">
                      {formatDate(record.dueAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig[record.status].className}`}
                      >
                        {statusConfig[record.status].label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(record)}
                          disabled={!onViewDetails}
                          title="View review details"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>

                        {canReview(record) && (
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(record)}
                            disabled={!onSubmitDecision}
                            title="Review access"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] disabled:opacity-40"
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

      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRecord(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="access-review-title"
            className="w-full max-w-lg rounded-2xl border border-[#e9e5dd] bg-white p-6 shadow-xl"
          >
            <h2
              id="access-review-title"
              className="text-lg font-semibold text-[#292821]"
            >
              Review existing access
            </h2>

            <p className="mt-1 text-sm text-[#77736c]">
              {selectedRecord.userName} · {selectedRecord.userRole}
            </p>

            <div className="mt-5 rounded-lg bg-[#faf9f6] p-4">
              <p className="text-xs text-[#918c83]">
                Current access
              </p>
              <p className="mt-1 text-sm text-[#34322c]">
                {selectedRecord.accessSummary}
              </p>
            </div>

            <label className="mt-5 block text-sm font-medium text-[#34322c]">
              Review decision
              <select
                value={decision}
                onChange={(event) =>
                  setDecision(
                    event.target.value as
                      | "RETAIN"
                      | "MODIFY"
                      | "REVOKE"
                  )
                }
                className="mt-2 w-full rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
              >
                <option value="RETAIN">Retain current access</option>
                <option value="MODIFY">Modification required</option>
                <option value="REVOKE">Recommend revocation</option>
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium text-[#34322c]">
              Review justification
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Explain the reason for this review decision..."
                className="mt-2 w-full resize-y rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
              />
              <span className="mt-1 block text-right text-xs text-[#918c83]">
                {reason.length}/1000
              </span>
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecord(null);
                  setReason("");
                  setDecision("RETAIN");
                }}
                className="rounded-lg border border-[#ded9cf] px-4 py-2.5 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitDecision}
                disabled={!reason.trim() || !onSubmitDecision}
                className="rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                Submit review
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
