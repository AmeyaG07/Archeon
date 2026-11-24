
"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  ShieldAlert,
  Webhook,
} from "lucide-react";

export type ProviderWebhookStatus =
  | "RECEIVED"
  | "PROCESSED"
  | "DUPLICATE"
  | "FAILED"
  | "REJECTED"
  | "PENDING";

export type ProviderWebhookEventType =
  | "MESSAGE_ACCEPTED"
  | "MESSAGE_SENT"
  | "MESSAGE_DELIVERED"
  | "MESSAGE_READ"
  | "MESSAGE_FAILED"
  | "UNKNOWN";

export interface ProviderWebhookEvent {
  id: string;
  provider: string;
  providerEventId: string;
  eventType: ProviderWebhookEventType;
  status: ProviderWebhookStatus;
  notificationId?: string;
  receivedAt: string;
  processedAt?: string;
  signatureValid: boolean;
  duplicate: boolean;
  failureReason?: string;
  correlationId?: string;
  processingDurationMs?: number;
}

interface AdminNotificationProviderWebhookMonitorProps {
  events: ProviderWebhookEvent[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewNotification?: (notificationId: string) => void;
  onInspectEvent?: (event: ProviderWebhookEvent) => void;
  onRetryProcessing?: (event: ProviderWebhookEvent) => void;
}

const statusStyles: Record<ProviderWebhookStatus, string> = {
  RECEIVED: "bg-blue-50 text-blue-700",
  PROCESSED: "bg-emerald-50 text-emerald-700",
  DUPLICATE: "bg-slate-100 text-slate-600",
  FAILED: "bg-red-50 text-red-700",
  REJECTED: "bg-red-50 text-red-700",
  PENDING: "bg-amber-50 text-amber-800",
};

const eventLabels: Record<ProviderWebhookEventType, string> = {
  MESSAGE_ACCEPTED: "Message accepted",
  MESSAGE_SENT: "Message sent",
  MESSAGE_DELIVERED: "Message delivered",
  MESSAGE_READ: "Message read",
  MESSAGE_FAILED: "Message failed",
  UNKNOWN: "Unknown event",
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

export default function AdminNotificationProviderWebhookMonitor({
  events,
  loading = false,
  error,
  onRefresh,
  onViewNotification,
  onInspectEvent,
  onRetryProcessing,
}: AdminNotificationProviderWebhookMonitorProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ProviderWebhookStatus | "ALL"
  >("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");

  const providers = useMemo(
    () =>
      Array.from(
        new Set(events.map((event) => event.provider))
      ).sort(),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events
      .filter((event) => {
        const searchable = [
          event.id,
          event.provider,
          event.providerEventId,
          event.notificationId ?? "",
          event.eventType,
          event.status,
          event.failureReason ?? "",
          event.correlationId ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || searchable.includes(query)) &&
          (statusFilter === "ALL" ||
            event.status === statusFilter) &&
          (providerFilter === "ALL" ||
            event.provider === providerFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.receivedAt).getTime() -
          new Date(a.receivedAt).getTime()
      );
  }, [events, search, statusFilter, providerFilter]);

  const summary = useMemo(
    () => ({
      total: events.length,
      processed: events.filter(
        (event) => event.status === "PROCESSED"
      ).length,
      failed: events.filter(
        (event) => event.status === "FAILED"
      ).length,
      rejected: events.filter(
        (event) => event.status === "REJECTED"
      ).length,
      duplicates: events.filter(
        (event) =>
          event.duplicate || event.status === "DUPLICATE"
      ).length,
      invalidSignatures: events.filter(
        (event) => !event.signatureValid
      ).length,
      pending: events.filter(
        (event) => event.status === "PENDING"
      ).length,
    }),
    [events]
  );

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Webhook size={15} />
            Notification infrastructure
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Provider Webhook Monitor
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Monitor external delivery events and identify
            processing, verification, and reconciliation failures.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || loading}
          className="flex items-center gap-2 self-start rounded-lg border border-[#ded9cf] px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh events
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total events",
            value: summary.total,
            icon: Activity,
            color: "text-[#292821]",
          },
          {
            label: "Processed",
            value: summary.processed,
            icon: CheckCircle2,
            color: "text-emerald-700",
          },
          {
            label: "Processing failures",
            value: summary.failed,
            icon: AlertTriangle,
            color: "text-red-700",
          },
          {
            label: "Invalid signatures",
            value: summary.invalidSignatures,
            icon: ShieldAlert,
            color: "text-amber-700",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-[#e9e5dd] bg-white p-5"
            >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#77736c]">
                    {item.label}
                  </p>
                  <Icon size={18} className={item.color} />
                </div>

                <p className={`mt-3 text-3xl font-semibold ${item.color}`}>
                  {item.value.toLocaleString("en-IN")}
                </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: summary.pending },
          { label: "Rejected", value: summary.rejected },
          { label: "Duplicate events", value: summary.duplicates },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#e9e5dd] bg-[#faf9f6] p-4"
          >
            <p className="text-xs text-[#918c83]">{item.label}</p>
            <p className="mt-2 text-xl font-semibold text-[#34322c]">
              {item.value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div>
            <h2 className="font-semibold text-[#292821]">
              Incoming provider events
            </h2>
            <p className="mt-1 text-xs text-[#918c83]">
              Events supplied by the backend webhook-processing service.
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
                placeholder="Search event or notification ID..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as ProviderWebhookStatus | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All processing statuses</option>
              <option value="RECEIVED">Received</option>
              <option value="PROCESSED">Processed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REJECTED">Rejected</option>
              <option value="DUPLICATE">Duplicate</option>
            </select>

            <select
              value={providerFilter}
              onChange={(event) => setProviderFilter(event.target.value)}
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading provider events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <Webhook
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No matching webhook events
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing the filters or refreshing the event list.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {filteredEvents.map((event) => (
              <article key={event.id} className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#34322c]">
                        {event.provider}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[event.status]}`}
                      >
                        {event.status.replaceAll("_", " ")}
                      </span>

                      {event.duplicate && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                          Duplicate detected
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-[#77736c]">
                      {eventLabels[event.eventType]}
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-[#918c83]">
                      Provider event: {event.providerEventId}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {event.notificationId && (
                      <button
                        type="button"
                        onClick={() =>
                          onViewNotification?.(event.notificationId!)
                        }
                        disabled={!onViewNotification}
                        className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                      >
                        View notification
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onInspectEvent?.(event)}
                      disabled={!onInspectEvent}
                      className="rounded-lg bg-[#292821] px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                    >
                      Inspect event
                    </button>

                    {event.status === "FAILED" &&
                      event.signatureValid &&
                      !event.duplicate && (
                        <button
                          type="button"
                          onClick={() => onRetryProcessing?.(event)}
                          disabled={!onRetryProcessing}
                          className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-40"
                        >
                          Retry processing
                        </button>
                      )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Signature verification
                    </p>
                    <p
                      className={`mt-1 text-sm font-medium ${
                        event.signatureValid
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {event.signatureValid ? "Valid" : "Invalid"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Received at
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(event.receivedAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Processed at
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(event.processedAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Processing duration
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {event.processingDurationMs == null
                        ? "Not available"
                        : `${event.processingDurationMs.toLocaleString("en-IN")} ms`}
                    </p>
                  </div>
                </div>

                {event.failureReason && (
                  <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <AlertTriangle
                      size={17}
                      className="mt-0.5 shrink-0 text-red-700"
                    />
                    <div>
                      <p className="text-xs font-semibold text-red-800">
                        Processing failure
                      </p>
                      <p className="mt-1 text-xs leading-5 text-red-800">
                        {event.failureReason}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0ede7] pt-3 text-xs text-[#918c83]">
                  <span>Internal event ID: {event.id}</span>
                  {event.correlationId && (
                    <span className="break-all font-mono">
                      Correlation: {event.correlationId}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="border-t border-[#eeeae3] bg-[#faf9f6] px-5 py-3 text-xs text-[#918c83]">
          Showing {filteredEvents.length.toLocaleString("en-IN")} of{" "}
          {events.length.toLocaleString("en-IN")} supplied events.
        </footer>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
        />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Webhook security requirements
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Verify provider signatures against the raw request body,
            enforce timestamp and replay protection, deduplicate using
            provider event IDs, and validate event-to-notification
            ownership. Never treat an unverified webhook as proof that
            an invoice has been paid.
          </p>
        </div>
      </section>
    </main>
  );
}
