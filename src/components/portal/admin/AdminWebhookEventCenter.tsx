
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  Filter,
  RotateCcw,
  Search,
  Webhook,
  XCircle,
} from "lucide-react";

export type WebhookDeliveryStatus =
  | "DELIVERED"
  | "FAILED"
  | "PENDING"
  | "RETRYING"
  | "EXHAUSTED";

export interface WebhookAttempt {
  id: string;
  attemptedAt: string;
  responseCode?: number;
  durationMs?: number;
  outcome: "SUCCESS" | "FAILURE" | "TIMEOUT";
  responseSummary?: string;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  destinationName: string;
  destinationUrl: string;
  status: WebhookDeliveryStatus;
  createdAt: string;
  lastAttemptAt?: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string;
  correlationId?: string;
  payloadSummary: string;
  attempts: WebhookAttempt[];
}

interface AdminWebhookEventCenterProps {
  events: WebhookEvent[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRequestRetry?: (eventId: string) => void;
  onViewDetails?: (event: WebhookEvent) => void;
  onCopyEventId?: (eventId: string) => void;
  onCopyCorrelationId?: (correlationId: string) => void;
}

const statusConfig: Record<
  WebhookDeliveryStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
    icon: <Clock3 size={14} />,
  },
  RETRYING: {
    label: "Retrying",
    className: "bg-blue-50 text-blue-700",
    icon: <RotateCcw size={14} />,
  },
  EXHAUSTED: {
    label: "Retries exhausted",
    className: "bg-rose-50 text-rose-700",
    icon: <AlertCircle size={14} />,
  },
};

const filters = [
  "ALL",
  "DELIVERED",
  "FAILED",
  "PENDING",
  "RETRYING",
  "EXHAUSTED",
] as const;

type FilterValue = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({ status }: { status: WebhookDeliveryStatus }) {
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
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[#e9e5dd] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#77736c]">{label}</p>
        <span className="text-[#9b8358]">{icon}</span>
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#25241f]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#918c83]">{description}</p>
    </div>
  );
}

export default function AdminWebhookEventCenter({
  events,
  loading = false,
  error,
  onRefresh,
  onRequestRetry,
  onViewDetails,
  onCopyEventId,
  onCopyCorrelationId,
}: AdminWebhookEventCenterProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<FilterValue>("ALL");

  const metrics = useMemo(
    () => ({
      total: events.length,
      delivered: events.filter((e) => e.status === "DELIVERED").length,
      failed: events.filter((e) => e.status === "FAILED").length,
      pending: events.filter(
        (e) => e.status === "PENDING" || e.status === "RETRYING"
      ).length,
      exhausted: events.filter((e) => e.status === "EXHAUSTED").length,
    }),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesFilter =
        activeFilter === "ALL" || event.status === activeFilter;

      const searchable = [
        event.id,
        event.eventType,
        event.destinationName,
        event.destinationUrl,
        event.correlationId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [events, search, activeFilter]);

  const handleRetry = (event: WebhookEvent) => {
    if (!onRequestRetry) return;

    const retryAllowed =
      event.status === "FAILED" &&
      event.attemptCount < event.maxAttempts;

    if (!retryAllowed) return;

    onRequestRetry(event.id);
  };

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Webhook size={15} />
            Platform operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Webhook Event Center
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Monitor outbound event delivery, inspect failures, and request
            controlled retries.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ded9cf] bg-white px-4 py-2.5 text-sm font-medium text-[#34322c] transition hover:bg-[#f8f6f1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={15} className={loading ? "animate-spin" : ""} />
          Refresh events
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total events"
          value={metrics.total}
          icon={<Activity size={19} />}
          description="Events in the supplied dataset"
        />
        <MetricCard
          label="Delivered"
          value={metrics.delivered}
          icon={<CheckCircle2 size={19} />}
          description="Marked as successfully delivered"
        />
        <MetricCard
          label="Failed"
          value={metrics.failed}
          icon={<XCircle size={19} />}
          description="Failed delivery records"
        />
        <MetricCard
          label="Pending / retrying"
          value={metrics.pending}
          icon={<Clock3 size={19} />}
          description="Awaiting delivery or another attempt"
        />
        <MetricCard
          label="Exhausted"
          value={metrics.exhausted}
          icon={<AlertCircle size={19} />}
          description="Maximum attempts recorded"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Delivery records
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredEvents.length} matching records
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
                placeholder="Search event, destination, correlation ID..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-[#a58c5d]"
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
                  ? "All events"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading webhook events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Webhook size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No webhook events found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try another search term or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Destination</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Attempts</th>
                  <th className="px-5 py-3 font-medium">Last attempt</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredEvents.map((event) => {
                  const canRetry =
                    event.status === "FAILED" &&
                    event.attemptCount < event.maxAttempts;

                  return (
                    <tr key={event.id} className="hover:bg-[#fcfbf9]">
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#34322c]">
                          {event.eventType}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#918c83]">
                          {event.id}
                        </p>
                        <p className="mt-1 text-xs text-[#aaa397]">
                          {formatDate(event.createdAt)}
                        </p>
                      </td>

                      <td className="max-w-[240px] px-5 py-4">
                        <p className="truncate text-sm font-medium text-[#34322c]">
                          {event.destinationName}
                        </p>
                        <p className="mt-1 truncate text-xs text-[#918c83]">
                          {event.destinationUrl}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={event.status} />
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-[#34322c]">
                          {event.attemptCount}
                        </span>
                        <span className="text-xs text-[#918c83]">
                          {" "}/ {event.maxAttempts}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {formatDate(event.lastAttemptAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails?.(event)}
                            disabled={!onViewDetails}
                            title="View event details"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRetry(event)}
                            disabled={!canRetry || !onRequestRetry}
                            title={
                              canRetry
                                ? "Request delivery retry"
                                : "Retry unavailable"
                            }
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <RotateCcw size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onCopyEventId?.(event.id)}
                            disabled={!onCopyEventId}
                            title="Copy event ID"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <Copy size={15} />
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
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#9b8358]" />
          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Delivery and retry safeguards
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Retry requests must be validated and executed by the backend.
              </li>
              <li>
                • Enforce retry limits, backoff, idempotency, and destination
                authorization server-side.
              </li>
              <li>
                • Never expose signing secrets, authentication headers, or
                complete sensitive payloads in this interface.
              </li>
              <li>
                • Record the requesting administrator and outcome in an
                immutable audit trail.
              </li>
              <li>
                • Treat delivery status as backend-authoritative, not as proof
                that a downstream business action was completed.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
