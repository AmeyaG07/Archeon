
"use client";

import { useMemo, useState } from "react";
import {
  BellRing,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  AlertTriangle,
  Mail,
  MessageSquare,
} from "lucide-react";

export type NotificationDeliveryStatus =
  | "DELIVERED"
  | "SENT"
  | "FAILED"
  | "SUPPRESSED"
  | "PENDING"
  | "BOUNCED";

export type NotificationDeliveryChannel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "IN_APP";

export interface NotificationDeliveryRecord {
  id: string;
  notificationId: string;
  recipientId: string;
  recipientName: string;
  recipientAddress?: string;
  channel: NotificationDeliveryChannel;
  purpose: string;
  templateName?: string;
  status: NotificationDeliveryStatus;
  attemptedAt: string;
  completedAt?: string;
  provider?: string;
  providerMessageId?: string;
  failureCode?: string;
  failureReason?: string;
  suppressionReason?: string;
  correlationId?: string;
}

interface AdminNotificationDeliveryAuditCenterProps {
  records: NotificationDeliveryRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewNotification?: (notificationId: string) => void;
  onViewRecipient?: (recipientId: string) => void;
}

const statusStyles: Record<
  NotificationDeliveryStatus,
  { label: string; className: string }
> = {
  DELIVERED: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700",
  },
  SENT: {
    label: "Sent",
    className: "bg-blue-50 text-blue-700",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
  },
  SUPPRESSED: {
    label: "Suppressed",
    className: "bg-amber-50 text-amber-800",
  },
  PENDING: {
    label: "Pending",
    className: "bg-slate-100 text-slate-700",
  },
  BOUNCED: {
    label: "Bounced",
    className: "bg-orange-50 text-orange-700",
  },
};

const channelStyles: Record<
  NotificationDeliveryChannel,
  string
> = {
  EMAIL: "bg-blue-50 text-blue-700",
  SMS: "bg-violet-50 text-violet-700",
  WHATSAPP: "bg-emerald-50 text-emerald-700",
  IN_APP: "bg-slate-100 text-slate-700",
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

export default function AdminNotificationDeliveryAuditCenter({
  records,
  loading = false,
  error,
  onRefresh,
  onViewNotification,
  onViewRecipient,
}: AdminNotificationDeliveryAuditCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    NotificationDeliveryStatus | "ALL"
  >("ALL");
  const [channelFilter, setChannelFilter] = useState<
    NotificationDeliveryChannel | "ALL"
  >("ALL");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const searchable = [
          record.notificationId,
          record.recipientId,
          record.recipientName,
          record.recipientAddress ?? "",
          record.purpose,
          record.templateName ?? "",
          record.provider ?? "",
          record.providerMessageId ?? "",
          record.failureCode ?? "",
          record.failureReason ?? "",
          record.suppressionReason ?? "",
          record.correlationId ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || searchable.includes(query)) &&
          (statusFilter === "ALL" ||
            record.status === statusFilter) &&
          (channelFilter === "ALL" ||
            record.channel === channelFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.attemptedAt).getTime() -
          new Date(a.attemptedAt).getTime()
      );
  }, [records, search, statusFilter, channelFilter]);

  const counts = useMemo(
    () => ({
      delivered: records.filter(
        (record) => record.status === "DELIVERED"
      ).length,
      failed: records.filter(
        (record) => record.status === "FAILED"
      ).length,
      suppressed: records.filter(
        (record) => record.status === "SUPPRESSED"
      ).length,
      pending: records.filter(
        (record) => record.status === "PENDING"
      ).length,
    }),
    [records]
  );

  function StatusIcon({
    status,
  }: {
    status: NotificationDeliveryStatus;
  }) {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle2 size={14} />;
      case "FAILED":
      case "BOUNCED":
        return <XCircle size={14} />;
      case "SUPPRESSED":
        return <Ban size={14} />;
      default:
        return <Clock size={14} />;
    }
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <BellRing size={15} />
            Communication operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Notification Delivery Audit
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Inspect delivery outcomes, provider responses, failed
            attempts, and messages suppressed by communication rules.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || loading}
          className="flex items-center gap-2 self-start rounded-lg border border-[#ded9cf] px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh
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
            label: "Delivered",
            value: counts.delivered,
            className: "text-emerald-700",
          },
          {
            label: "Failed",
            value: counts.failed,
            className: "text-red-700",
          },
          {
            label: "Suppressed",
            value: counts.suppressed,
            className: "text-amber-700",
          },
          {
            label: "Pending",
            value: counts.pending,
            className: "text-slate-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#e9e5dd] bg-white p-5"
          >
            <p className="text-sm text-[#77736c]">{item.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${item.className}`}>
              {item.value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div>
            <h2 className="font-semibold text-[#292821]">
              Delivery records
            </h2>
            <p className="mt-1 text-xs text-[#918c83]">
              Delivery events are historical records, not live
              provider status checks.
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
                placeholder="Search recipient, ID, provider..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | NotificationDeliveryStatus
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All delivery statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="SUPPRESSED">Suppressed</option>
              <option value="PENDING">Pending</option>
              <option value="BOUNCED">Bounced</option>
            </select>

            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(
                  event.target.value as
                    | NotificationDeliveryChannel
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
            Loading delivery records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <BellRing
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No matching delivery records
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-4 font-medium">Recipient</th>
                  <th className="px-5 py-4 font-medium">Channel</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Purpose</th>
                  <th className="px-5 py-4 font-medium">Attempted</th>
                  <th className="px-5 py-4 font-medium">Provider</th>
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
                      {record.recipientAddress && (
                        <p className="mt-1 max-w-[190px] truncate text-xs text-[#918c83]">
                          {record.recipientAddress}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${channelStyles[record.channel]}`}
                      >
                        {record.channel === "EMAIL" ? (
                          <Mail size={12} />
                        ) : record.channel === "IN_APP" ? (
                          <BellRing size={12} />
                        ) : (
                          <MessageSquare size={12} />
                        )}
                        {record.channel}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[record.status].className}`}
                      >
                        <StatusIcon status={record.status} />
                        {statusStyles[record.status].label}
                      </span>

                      {record.completedAt && (
                        <p className="mt-2 text-xs text-[#918c83]">
                          Completed: {formatDate(record.completedAt)}
                        </p>
                      )}
                    </td>

                    <td className="max-w-[190px] px-5 py-4 text-sm text-[#666157]">
                      {record.purpose}
                      {record.templateName && (
                        <p className="mt-1 text-xs text-[#918c83]">
                          Template: {record.templateName}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-[#77736c]">
                      {formatDate(record.attemptedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs text-[#555148]">
                        {record.provider || "Not available"}
                      </p>
                      {record.providerMessageId && (
                        <p className="mt-1 max-w-[160px] break-all font-mono text-[10px] text-[#918c83]">
                          {record.providerMessageId}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {record.status === "FAILED" ||
                      record.status === "BOUNCED" ? (
                        <div className="max-w-[220px]">
                          <p className="text-xs font-medium text-red-700">
                            {record.failureCode || "Delivery error"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[#77736c]">
                            {record.failureReason || "No reason supplied."}
                          </p>
                        </div>
                      ) : record.status === "SUPPRESSED" ? (
                        <p className="max-w-[220px] text-xs leading-5 text-amber-800">
                          {record.suppressionReason ||
                            "Suppression reason not supplied."}
                        </p>
                      ) : (
                        <span className="text-xs text-[#918c83]">
                          No additional details
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onViewNotification?.(record.notificationId)
                        }
                        disabled={!onViewNotification}
                        className="mt-2 block text-xs font-medium text-[#8a7147] hover:text-[#5e4b2e] disabled:opacity-40"
                      >
                        View notification
                      </button>
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
            Delivery status and message authorization are different
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            A successful provider response does not prove that a
            message was read or that its delivery was authorized.
            The backend must check consent and suppression rules
            before every send, validate provider callbacks, and
            preserve delivery events for audit.
          </p>
        </div>
      </section>
    </main>
  );
}
