
"use client";

import { useMemo, useState } from "react";
import {
  ArchiveX,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileSearch,
} from "lucide-react";

export type DeadLetterStatus =
  | "UNREVIEWED"
  | "UNDER_INVESTIGATION"
  | "RESOLVED"
  | "DISCARDED";

export type DeadLetterFailureCategory =
  | "PROVIDER_REJECTION"
  | "INVALID_RECIPIENT"
  | "AUTHENTICATION"
  | "TEMPLATE_ERROR"
  | "RETRY_EXHAUSTED"
  | "POLICY_BLOCK"
  | "UNKNOWN";

export interface DeadLetterRecord {
  id: string;
  notificationId: string;
  recipientId: string;
  recipientName: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "IN_APP";
  purpose: string;
  failureCategory: DeadLetterFailureCategory;
  failureCode?: string;
  failureReason: string;
  status: DeadLetterStatus;
  attemptCount: number;
  maximumAttempts: number;
  firstFailedAt: string;
  lastFailedAt: string;
  provider?: string;
  correlationId?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionNote?: string;
}

interface AdminNotificationDeadLetterQueueCenterProps {
  records: DeadLetterRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewNotification?: (notificationId: string) => void;
  onViewRecipient?: (recipientId: string) => void;
  onReview?: (record: DeadLetterRecord) => void;
  onResolve?: (record: DeadLetterRecord) => void;
  onDiscard?: (record: DeadLetterRecord) => void;
}

const statusStyles: Record<DeadLetterStatus, string> = {
  UNREVIEWED: "bg-red-50 text-red-700",
  UNDER_INVESTIGATION: "bg-amber-50 text-amber-800",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  DISCARDED: "bg-slate-100 text-slate-600",
};

const categoryLabels: Record<DeadLetterFailureCategory, string> = {
  PROVIDER_REJECTION: "Provider rejection",
  INVALID_RECIPIENT: "Invalid recipient",
  AUTHENTICATION: "Authentication failure",
  TEMPLATE_ERROR: "Template error",
  RETRY_EXHAUSTED: "Retry limit reached",
  POLICY_BLOCK: "Policy block",
  UNKNOWN: "Unknown failure",
};

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminNotificationDeadLetterQueueCenter({
  records,
  loading = false,
  error,
  onRefresh,
  onViewNotification,
  onViewRecipient,
  onReview,
  onResolve,
  onDiscard,
}: AdminNotificationDeadLetterQueueCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    DeadLetterStatus | "ALL"
  >("ALL");
  const [categoryFilter, setCategoryFilter] = useState<
    DeadLetterFailureCategory | "ALL"
  >("ALL");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const searchable = [
          record.id,
          record.notificationId,
          record.recipientId,
          record.recipientName,
          record.channel,
          record.purpose,
          record.failureCode ?? "",
          record.failureReason,
          record.provider ?? "",
          record.correlationId ?? "",
          record.resolutionNote ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || searchable.includes(query)) &&
          (statusFilter === "ALL" ||
            record.status === statusFilter) &&
          (categoryFilter === "ALL" ||
            record.failureCategory === categoryFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.lastFailedAt).getTime() -
          new Date(a.lastFailedAt).getTime()
      );
  }, [records, search, statusFilter, categoryFilter]);

  const counts = useMemo(
    () => ({
      total: records.length,
      unreviewed: records.filter(
        (item) => item.status === "UNREVIEWED"
      ).length,
      investigating: records.filter(
        (item) => item.status === "UNDER_INVESTIGATION"
      ).length,
      resolved: records.filter(
        (item) => item.status === "RESOLVED"
      ).length,
      discarded: records.filter(
        (item) => item.status === "DISCARDED"
      ).length,
    }),
    [records]
  );

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <ArchiveX size={15} />
            Communication reliability
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Dead-Letter Queue
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Investigate notifications that could not be delivered
            after their permitted processing attempts.
          </p>
        </div>

        </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Total records",
            value: counts.total,
            color: "text-[#292821]",
          },
          {
            label: "Unreviewed",
            value: counts.unreviewed,
            color: "text-red-700",
          },
          {
            label: "Under investigation",
            value: counts.investigating,
            color: "text-amber-700",
          },
          {
            label: "Resolved",
            value: counts.resolved,
            color: "text-emerald-700",
          },
          {
            label: "Discarded",
            value: counts.discarded,
            color: "text-slate-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#e9e5dd] bg-white p-5"
          >
            <p className="text-sm text-[#77736c]">{item.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${item.color}`}>
              {item.value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div>
            <h2 className="font-semibold text-[#292821]">
              Failed notification records
            </h2>
            <p className="mt-1 text-xs text-[#918c83]">
              Historical failures returned by the notification backend.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notification, recipient, error..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as DeadLetterStatus | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All review statuses</option>
              <option value="UNREVIEWED">Unreviewed</option>
              <option value="UNDER_INVESTIGATION">
                Under investigation
              </option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISCARDED">Discarded</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as
                    | DeadLetterFailureCategory
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All failure categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading dead-letter records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <ArchiveX
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No matching failure records
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Adjust the filters or refresh the records.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {filteredRecords.map((record) => (
              <article key={record.id} className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#34322c]">
                        {record.notificationId}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[record.status]}`}
                      >
                        {record.status.replaceAll("_", " ")}
                      </span>

                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700">
                        {categoryLabels[record.failureCategory]}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[#77736c]">
                      {record.failureReason}
                    </p>

                    <p className="mt-2 text-xs text-[#918c83]">
                      Dead-letter ID: {record.id}
                      {" · "}
                      Channel: {record.channel}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onViewNotification?.(record.notificationId)
                      }
                      disabled={!onViewNotification}
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      View notification
                    </button>

                    {record.status === "UNREVIEWED" && (
                      <button
                        type="button"
                        onClick={() => onReview?.(record)}
                        disabled={!onReview}
                        className="rounded-lg bg-[#292821] px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                      >
                        Start review
                      </button>
                    )}

                    {record.status === "UNDER_INVESTIGATION" && (
                      <button
                        type="button"
                        onClick={() => onResolve?.(record)}
                        disabled={!onResolve}
                        className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                      >
                        Record resolution
                      </button>
                    )}

                    {record.status === "UNREVIEWED" && (
                      <button
                        type="button"
                        onClick={() => onDiscard?.(record)}
                        disabled={!onDiscard}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        Discard
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Recipient
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onViewRecipient?.(record.recipientId)
                      }
                      disabled={!onViewRecipient}
                      className="mt-1 text-left text-sm font-medium text-[#34322c] disabled:cursor-default"
                    >
                      {record.recipientName}
                    </button>
                    <p className="mt-1 text-xs text-[#918c83]">
                      {record.recipientId}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Attempts
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {record.attemptCount} / {record.maximumAttempts}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      First failure
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(record.firstFailedAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Latest failure
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(record.lastFailedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0ede7] pt-3">
                  <div className="text-xs text-[#918c83]">
                    <p>
                      Provider: {record.provider || "Not available"}
                    </p>
                    {record.failureCode && (
                      <p className="mt-1">
                        Error code: {record.failureCode}
                      </p>
                    )}
                    {record.correlationId && (
                      <p className="mt-1 break-all font-mono text-[10px]">
                        Correlation ID: {record.correlationId}
                      </p>
                    )}
                  </div>

                  {record.reviewedAt && (
                    <div className="text-right text-xs text-[#918c83]">
                      <p>Reviewed by {record.reviewedBy || "Unknown"}</p>
                      <p className="mt-1">
                        {formatDate(record.reviewedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {record.resolutionNote && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold text-emerald-800">
                      Resolution note
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-800">
                      {record.resolutionNote}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <footer className="border-t border-[#eeeae3] bg-[#faf9f6] px-5 py-3 text-xs text-[#918c83]">
          Showing {filteredRecords.length.toLocaleString("en-IN")} of{" "}
          {records.length.toLocaleString("en-IN")} supplied records.
        </footer>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex gap-3 rounded-xl border border-[#e9e5dd] bg-white p-4">
          <FileSearch
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />
          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Investigate before retrying
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#77736c]">
              Resolve invalid recipients, provider configuration,
              and template errors before considering a controlled
              resend operation.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-[#e9e5dd] bg-white p-4">
          <Clock
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />
          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Preserve failure history
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#77736c]">
              Keep original attempts, provider responses, timestamps,
              and investigation decisions available for audit.
            </p>
          </div>
        </div>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
        />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            A failed notification must not be blindly resent
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Before any resend, the backend must recheck consent,
            opt-out status, recipient validity, invoice and dispute
            state, template approval, and idempotency. A resolved
            investigation does not automatically authorize delivery.
          </p>
        </div>
      </section>
    </main>
  );
}
