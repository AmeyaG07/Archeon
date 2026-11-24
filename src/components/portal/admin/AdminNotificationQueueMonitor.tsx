
"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  Layers3,
} from "lucide-react";

export type NotificationQueueStatus =
  | "QUEUED"
  | "SCHEDULED"
  | "PROCESSING"
  | "RETRY_PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface NotificationQueueRecord {
  id: string;
  notificationId: string;
  recipientId: string;
  recipientName: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP" | "IN_APP";
  purpose: string;
  status: NotificationQueueStatus;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  scheduledAt?: string;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  attemptCount: number;
  maximumAttempts: number;
  nextRetryAt?: string;
  lastError?: string;
  correlationId?: string;
}

interface AdminNotificationQueueMonitorProps {
  records: NotificationQueueRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewNotification?: (notificationId: string) => void;
  onViewRecipient?: (recipientId: string) => void;
}

const statusStyles: Record<NotificationQueueStatus, string> = {
  QUEUED: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-violet-50 text-violet-700",
  PROCESSING: "bg-amber-50 text-amber-800",
  RETRY_PENDING: "bg-orange-50 text-orange-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const priorityStyles: Record<
  NotificationQueueRecord["priority"],
  string
> = {
  LOW: "text-slate-600",
  NORMAL: "text-blue-700",
  HIGH: "text-orange-700",
  CRITICAL: "text-red-700",
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

export default function AdminNotificationQueueMonitor({
  records,
  loading = false,
  error,
  onRefresh,
  onViewNotification,
  onViewRecipient,
}: AdminNotificationQueueMonitorProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    NotificationQueueStatus | "ALL"
  >("ALL");
  const [priorityFilter, setPriorityFilter] = useState<
    NotificationQueueRecord["priority"] | "ALL"
  >("ALL");
  const [channelFilter, setChannelFilter] = useState<
    NotificationQueueRecord["channel"] | "ALL"
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
          record.purpose,
          record.correlationId ?? "",
          record.lastError ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || searchable.includes(query)) &&
          (statusFilter === "ALL" ||
            record.status === statusFilter) &&
          (priorityFilter === "ALL" ||
            record.priority === priorityFilter) &&
          (channelFilter === "ALL" ||
            record.channel === channelFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.queuedAt).getTime() -
          new Date(a.queuedAt).getTime()
      );
  }, [
    records,
    search,
    statusFilter,
    priorityFilter,
    channelFilter,
  ]);

  const counts = useMemo(
    () => ({
      queued: records.filter(
        (item) => item.status === "QUEUED"
      ).length,
      scheduled: records.filter(
        (item) => item.status === "SCHEDULED"
      ).length,
      processing: records.filter(
        (item) => item.status === "PROCESSING"
      ).length,
      retryPending: records.filter(
        (item) => item.status === "RETRY_PENDING"
      ).length,
      failed: records.filter(
        (item) => item.status === "FAILED"
      ).length,
      completed: records.filter(
        (item) => item.status === "COMPLETED"
      ).length,
    }),
    [records]
  );

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Activity size={15} />
            Communication operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Notification Queue Monitor
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Monitor queued notifications, scheduled jobs,
            processing activity, retries, and failed deliveries.
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            label: "Queued",
            value: counts.queued,
            icon: Layers3,
            color: "text-blue-700",
          },
          {
            label: "Scheduled",
            value: counts.scheduled,
            icon: Clock,
            color: "text-violet-700",
          },
          {
            label: "Processing",
            value: counts.processing,
            icon: Activity,
            color: "text-amber-700",
          },
          {
            label: "Retry pending",
            value: counts.retryPending,
            icon: RefreshCw,
            color: "text-orange-700",
          },
          {
            label: "Completed",
            value: counts.completed,
            icon: CheckCircle2,
            color: "text-emerald-700",
          },
          {
            label: "Failed",
            value: counts.failed,
            icon: AlertTriangle,
            color: "text-red-700",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-[#e9e5dd] bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#77736c]">{item.label}</p>
                <Icon size={17} className={item.color} />
              </div>

              <p className={`mt-3 text-3xl font-semibold ${item.color}`}>
                {item.value.toLocaleString("en-IN")}
              </p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div>
            <h2 className="font-semibold text-[#292821]">
              Queue records
            </h2>

            <p className="mt-1 text-xs text-[#918c83]">
              This view displays the records returned by the backend.
              It is not a live queue connection.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notification or recipient..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | NotificationQueueStatus
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="QUEUED">Queued</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PROCESSING">Processing</option>
              <option value="RETRY_PENDING">Retry pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value as
                    | NotificationQueueRecord["priority"]
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All priorities</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(
                  event.target.value as
                    | NotificationQueueRecord["channel"]
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All channels</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="IN_APP">In-app</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading notification queue...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <PauseCircle
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />

            <p className="mt-3 font-medium text-[#34322c]">
              No matching queue records
            </p>

            <p className="mt-1 text-sm text-[#918c83]">
              Adjust your filters or refresh the queue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-4 font-medium">Notification</th>
                  <th className="px-5 py-4 font-medium">Recipient</th>
                  <th className="px-5 py-4 font-medium">Channel</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Priority</th>
                  <th className="px-5 py-4 font-medium">Queued / Scheduled</th>
                  <th className="px-5 py-4 font-medium">Attempts</th>
                  <th className="px-5 py-4 font-medium">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="align-top hover:bg-[#fcfbf9]"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          onViewNotification?.(record.notificationId)
                        }
                        disabled={!onViewNotification}
                        className="text-left disabled:cursor-default"
                      >
                        <p className="text-sm font-medium text-[#34322c]">
                          {record.notificationId}
                        </p>
                      </button>

                      <p className="mt-1 text-xs text-[#918c83]">
                        Queue ID: {record.id}
                      </p>

                      <p className="mt-1 text-xs text-[#918c83]">
                        {record.purpose}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          onViewRecipient?.(record.recipientId)
                        }
                        disabled={!onViewRecipient}
                        className="text-left disabled:cursor-default"
                      >
                        <p className="text-sm font-medium text-[#34322c]">
                          {record.recipientName}
                        </p>
                        <p className="mt-1 text-xs text-[#918c83]">
                          {record.recipientId}
                        </p>
                      </button>
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-[#555148]">
                      {record.channel}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[record.status]}`}
                      >
                        {record.status.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-semibold ${priorityStyles[record.priority]}`}
                      >
                        {record.priority}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-[#77736c]">
                      <p>Queued: {formatDate(record.queuedAt)}</p>

                      {record.scheduledAt && (
                        <p className="mt-1">
                          Scheduled: {formatDate(record.scheduledAt)}
                        </p>
                      )}

                      {record.nextRetryAt && (
                        <p className="mt-1 text-orange-700">
                          Retry: {formatDate(record.nextRetryAt)}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {record.attemptCount} / {record.maximumAttempts}
                      </p>

                      <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-[#eeeae3]">
                        <div
                          className="h-full rounded-full bg-[#9b8358]"
                          style={{
                            width: `${
                              record.maximumAttempts > 0
                                ? Math.min(
                                    100,
                                    (record.attemptCount /
                                      record.maximumAttempts) *
                                      100
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="max-w-[220px] px-5 py-4">
                      {record.lastError ? (
                        <p className="text-xs leading-5 text-red-700">
                          {record.lastError}
                        </p>
                      ) : (
                        <span className="text-xs text-[#918c83]">
                          No recorded error
                        </span>
                      )}

                      {record.correlationId && (
                        <p className="mt-2 break-all font-mono text-[10px] text-[#aaa397]">
                          {record.correlationId}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="border-t border-[#eeeae3] bg-[#faf9f6] px-5 py-3 text-xs text-[#918c83]">
          Showing {filteredRecords.length.toLocaleString("en-IN")} of{" "}
          {records.length.toLocaleString("en-IN")} supplied records.
        </footer>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
        />

        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Queue monitoring is not queue control
          </h3>

          <p className="mt-1 text-xs leading-5 text-amber-800">
            Retry, cancellation, and priority changes should not be
            implemented as unrestricted frontend actions. The
            backend must enforce idempotency, retry limits,
            authorization, suppression checks, and audit logging.
            Queue metrics should also be paginated and time-bounded
            in production.
          </p>
        </div>
      </section>
    </main>
  );
}
