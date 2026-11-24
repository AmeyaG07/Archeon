
"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  FileClock,
  Filter,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export type SecurityExceptionEventType =
  | "REQUESTED"
  | "SUBMITTED_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVATED"
  | "REVOKED"
  | "EXPIRED"
  | "RENEWED"
  | "UPDATED";

export interface SecurityExceptionHistoryRecord {
  id: string;
  exceptionId: string;
  exceptionTitle: string;
  policyReference: string;
  eventType: SecurityExceptionEventType;
  actorId: string;
  actorName: string;
  actorRole: string;
  reason: string;
  occurredAt: string;
  correlationId?: string;
}

interface AdminSecurityExceptionHistoryProps {
  records: SecurityExceptionHistoryRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenException?: (exceptionId: string) => void;
  onExport?: (
    records: SecurityExceptionHistoryRecord[]
  ) => void;
}

const eventStyles: Record<
  SecurityExceptionEventType,
  { label: string; className: string }
> = {
  REQUESTED: {
    label: "Requested",
    className: "bg-slate-100 text-slate-700",
  },
  SUBMITTED_FOR_REVIEW: {
    label: "Submitted for review",
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
  ACTIVATED: {
    label: "Activated",
    className: "bg-emerald-50 text-emerald-700",
  },
  REVOKED: {
    label: "Revoked",
    className: "bg-orange-50 text-orange-700",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-600",
  },
  RENEWED: {
    label: "Renewed",
    className: "bg-amber-50 text-amber-700",
  },
  UPDATED: {
    label: "Updated",
    className: "bg-violet-50 text-violet-700",
  },
};

const eventTypes = [
  "ALL",
  "REQUESTED",
  "SUBMITTED_FOR_REVIEW",
  "APPROVED",
  "REJECTED",
  "ACTIVATED",
  "REVOKED",
  "EXPIRED",
  "RENEWED",
  "UPDATED",
] as const;

type EventFilter = (typeof eventTypes)[number];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function isWithinDateRange(
  value: string,
  from: string,
  to: string
) {
  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) return false;

  if (from) {
    const start = new Date(`${from}T00:00:00`).getTime();
    if (timestamp < start) return false;
  }

  if (to) {
    const end = new Date(`${to}T23:59:59.999`).getTime();
    if (timestamp > end) return false;
  }

  return true;
}

export default function AdminSecurityExceptionHistory({
  records,
  loading = false,
  error,
  onRefresh,
  onOpenException,
  onExport,
}: AdminSecurityExceptionHistoryProps) {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] =
    useState<EventFilter>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const matchesEvent =
          eventFilter === "ALL" ||
          record.eventType === eventFilter;

        const searchable = [
          record.exceptionId,
          record.exceptionTitle,
          record.policyReference,
          record.actorName,
          record.actorId,
          record.actorRole,
          record.reason,
          record.correlationId ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesEvent &&
          (!query || searchable.includes(query)) &&
          isWithinDateRange(record.occurredAt, dateFrom, dateTo)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() -
          new Date(a.occurredAt).getTime()
      );
  }, [records, search, eventFilter, dateFrom, dateTo]);

  const eventCounts = useMemo(() => {
    return records.reduce<Record<string, number>>(
      (counts, record) => {
        counts[record.eventType] =
          (counts[record.eventType] ?? 0) + 1;

        return counts;
      },
      {}
    );
  }, [records]);

  const hasInvalidRange =
    Boolean(dateFrom && dateTo && dateFrom > dateTo);

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <FileClock size={15} />
            Security governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Security Exception History
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review the recorded lifecycle events for security
            exceptions, including decisions and administrative actions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onExport?.(filteredRecords)}
            disabled={!onExport || filteredRecords.length === 0}
            className="flex items-center gap-2 rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            <Download size={15} />
            Export filtered records
          </button>
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#e9e5dd] bg-white p-5">
          <p className="text-sm text-[#77736c]">Total events</p>
          <p className="mt-3 text-3xl font-semibold text-[#292821]">
            {records.length.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-[#918c83]">
            Records supplied to this view
          </p>
        </div>

        <div className="rounded-xl border border-[#e9e5dd] bg-white p-5">
          <p className="text-sm text-[#77736c]">Approvals</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-700">
            {(eventCounts.APPROVED ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-[#918c83]">
            Recorded approval events
          </p>
        </div>

        <div className="rounded-xl border border-[#e9e5dd] bg-white p-5">
          <p className="text-sm text-[#77736c]">Rejections</p>
          <p className="mt-3 text-3xl font-semibold text-red-700">
            {(eventCounts.REJECTED ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-[#918c83]">
            Recorded rejection events
          </p>
        </div>

        <div className="rounded-xl border border-[#e9e5dd] bg-white p-5">
          <p className="text-sm text-[#77736c]">Revocations</p>
          <p className="mt-3 text-3xl font-semibold text-orange-700">
            {(eventCounts.REVOKED ?? 0).toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-xs text-[#918c83]">
            Recorded revocation events
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#9b8358]" />
            <h2 className="font-semibold text-[#292821]">
              History filters
            </h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ID, policy, actor, reason..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <label className="text-xs text-[#77736c]">
              Event type
              <select
                value={eventFilter}
                onChange={(event) =>
                  setEventFilter(event.target.value as EventFilter)
                }
                className="mt-1.5 w-full rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm text-[#34322c] outline-none"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "ALL"
                      ? "All events"
                      : eventStyles[type].label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-[#77736c]">
                From
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#e5e0d7] px-2 py-2.5 text-sm"
                />
              </label>

              <label className="text-xs text-[#77736c]">
                To
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#e5e0d7] px-2 py-2.5 text-sm"
                />
              </label>
            </div>
          </div>

          {hasInvalidRange && (
            <p className="text-xs text-red-600" role="alert">
              The start date cannot be later than the end date.
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading event history...
          </div>
        ) : hasInvalidRange ? (
          <div className="p-10 text-center text-sm text-[#77736c]">
            Correct the date range to view records.
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No matching history records
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Change the filters or search terms.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {filteredRecords.map((record) => (
              <article
                key={record.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f5f2eb] text-[#9b8358]">
                    {record.eventType === "APPROVED" ||
                    record.eventType === "ACTIVATED" ? (
                      <ShieldCheck size={17} />
                    ) : (
                      <FileClock size={17} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#34322c]">
                        {record.exceptionTitle}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${eventStyles[record.eventType].className}`}
                      >
                        {eventStyles[record.eventType].label}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[#918c83]">
                      Exception: {record.exceptionId}
                      {" · "}
                      Policy: {record.policyReference}
                    </p>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#77736c]">
                      {record.reason || "No reason supplied."}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#918c83]">
                      <span className="flex items-center gap-1.5">
                        <UserRound size={13} />
                        {record.actorName} · {record.actorRole}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={13} />
                        {formatDate(record.occurredAt)}
                      </span>
                    </div>

                    {record.correlationId && (
                      <p className="mt-2 break-all font-mono text-[11px] text-[#aaa397]">
                        Correlation ID: {record.correlationId}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenException?.(record.exceptionId)
                  }
                  disabled={!onOpenException}
                  className="shrink-0 self-start rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                >
                  View exception
                </button>
              </article>
            ))}
          </div>
        )}

        <footer className="border-t border-[#eeeae3] bg-[#faf9f6] px-5 py-3 text-xs text-[#918c83]">
          Showing {filteredRecords.length.toLocaleString("en-IN")} of{" "}
          {records.length.toLocaleString("en-IN")} supplied records.
        </footer>
      </section>

      <section className="rounded-xl border border-[#e9e5dd] bg-[#faf9f6] p-5">
        <h3 className="text-sm font-semibold text-[#34322c]">
          Audit history integrity
        </h3>

        <p className="mt-2 text-xs leading-5 text-[#77736c]">
          This screen is a read-only presentation of supplied event
          records. The backend must provide trustworthy event
          timestamps, stable actor identifiers, immutable event
          storage, authorization checks, and tamper-evident audit
          controls. Exported records should preserve their source
          identifiers and timestamps.
        </p>
      </section>
    </main>
  );
}
