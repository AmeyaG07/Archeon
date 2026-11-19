
"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Search,
  Mail,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "IN_APP";

export type ConsentStatus =
  | "OPTED_IN"
  | "OPTED_OUT"
  | "PENDING"
  | "NOT_RECORDED";

export interface NotificationConsentRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userType: "CLIENT" | "VENDOR" | "STAFF";
  channel: NotificationChannel;
  consentStatus: ConsentStatus;
  consentSource?: string;
  consentRecordedAt?: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  purpose: string;
}

interface AdminConsentNotificationPreferenceCenterProps {
  records: NotificationConsentRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewUser?: (userId: string) => void;
  onViewConsentEvidence?: (recordId: string) => void;
}

const channelStyles: Record<
  NotificationChannel,
  { label: string; className: string }
> = {
  EMAIL: {
    label: "Email",
    className: "bg-blue-50 text-blue-700",
  },
  SMS: {
    label: "SMS",
    className: "bg-violet-50 text-violet-700",
  },
  WHATSAPP: {
    label: "WhatsApp",
    className: "bg-emerald-50 text-emerald-700",
  },
  IN_APP: {
    label: "In-app",
    className: "bg-slate-100 text-slate-700",
  },
};

const consentStyles: Record<
  ConsentStatus,
  { label: string; className: string }
> = {
  OPTED_IN: {
    label: "Opted in",
    className: "bg-emerald-50 text-emerald-700",
  },
  OPTED_OUT: {
    label: "Opted out",
    className: "bg-red-50 text-red-700",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-50 text-amber-800",
  },
  NOT_RECORDED: {
    label: "Not recorded",
    className: "bg-slate-100 text-slate-600",
  },
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

export default function AdminConsentNotificationPreferenceCenter({
  records,
  loading = false,
  error,
  onRefresh,
  onViewUser,
  onViewConsentEvidence,
}: AdminConsentNotificationPreferenceCenterProps) {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<
    NotificationChannel | "ALL"
  >("ALL");
  const [consentFilter, setConsentFilter] = useState<
    ConsentStatus | "ALL"
  >("ALL");
  const [userTypeFilter, setUserTypeFilter] = useState<
    NotificationConsentRecord["userType"] | "ALL"
  >("ALL");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records
      .filter((record) => {
        const searchable = [
          record.userId,
          record.userName,
          record.userEmail ?? "",
          record.purpose,
          record.consentSource ?? "",
          record.lastUpdatedBy,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || searchable.includes(query)) &&
          (channelFilter === "ALL" ||
            record.channel === channelFilter) &&
          (consentFilter === "ALL" ||
            record.consentStatus === consentFilter) &&
          (userTypeFilter === "ALL" ||
            record.userType === userTypeFilter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.lastUpdatedAt).getTime() -
          new Date(a.lastUpdatedAt).getTime()
      );
  }, [
    records,
    search,
    channelFilter,
    consentFilter,
    userTypeFilter,
  ]);

  const counts = useMemo(() => {
    return {
      optedIn: records.filter(
        (record) => record.consentStatus === "OPTED_IN"
      ).length,
      optedOut: records.filter(
        (record) => record.consentStatus === "OPTED_OUT"
      ).length,
      pending: records.filter(
        (record) => record.consentStatus === "PENDING"
      ).length,
      notRecorded: records.filter(
        (record) => record.consentStatus === "NOT_RECORDED"
      ).length,
    };
  }, [records]);

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Bell size={15} />
            Communication governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Consent & Notification Preferences
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review communication preferences and consent records
            across client, vendor, and staff accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || loading}
          className="flex items-center justify-center gap-2 self-start rounded-lg border border-[#ded9cf] px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:opacity-50"
        >
          <RefreshCw size={15} />
          Refresh records
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
            label: "Opted in",
            value: counts.optedIn,
            className: "text-emerald-700",
          },
          {
            label: "Opted out",
            value: counts.optedOut,
            className: "text-red-700",
          },
          {
            label: "Pending consent",
            value: counts.pending,
            className: "text-amber-700",
          },
          {
            label: "Not recorded",
            value: counts.notRecorded,
            className: "text-slate-600",
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
              Preference registry
            </h2>
            <p className="mt-1 text-xs text-[#918c83]">
              One record represents one user&apos;s preference for one
              communication channel and purpose.
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
                placeholder="Search user or purpose..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(
                  event.target.value as NotificationChannel | "ALL"
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

            <select
              value={consentFilter}
              onChange={(event) =>
                setConsentFilter(
                  event.target.value as ConsentStatus | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All consent states</option>
              <option value="OPTED_IN">Opted in</option>
              <option value="OPTED_OUT">Opted out</option>
              <option value="PENDING">Pending</option>
              <option value="NOT_RECORDED">Not recorded</option>
            </select>

            <select
              value={userTypeFilter}
              onChange={(event) =>
                setUserTypeFilter(
                  event.target.value as
                    | NotificationConsentRecord["userType"]
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All account types</option>
              <option value="CLIENT">Client</option>
              <option value="VENDOR">Vendor</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading communication preferences...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Bell
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No preference records found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Change the filters or search terms.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-4 font-medium">User</th>
                  <th className="px-5 py-4 font-medium">Channel</th>
                  <th className="px-5 py-4 font-medium">Consent</th>
                  <th className="px-5 py-4 font-medium">Purpose</th>
                  <th className="px-5 py-4 font-medium">Recorded</th>
                  <th className="px-5 py-4 font-medium">Updated by</th>
                  <th className="px-5 py-4 font-medium">Evidence</th>
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
                        onClick={() => onViewUser?.(record.userId)}
                        disabled={!onViewUser}
                        className="text-left disabled:cursor-default"
                      >
                        <p className="text-sm font-medium text-[#34322c]">
                          {record.userName}
                        </p>
                        <p className="mt-1 text-xs text-[#918c83]">
                          {record.userId}
                        </p>
                        {record.userEmail && (
                          <p className="mt-1 text-xs text-[#918c83]">
                            {record.userEmail}
                          </p>
                        )}
                      </button>
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-[#aaa397]">
                        {record.userType}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${channelStyles[record.channel].className}`}
                      >
                        {record.channel === "EMAIL" ? (
                          <Mail size={12} />
                        ) : record.channel === "WHATSAPP" ||
                          record.channel === "SMS" ? (
                          <MessageSquare size={12} />
                        ) : (
                          <Bell size={12} />
                        )}
                        {channelStyles[record.channel].label}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${consentStyles[record.consentStatus].className}`}
                      >
                        {consentStyles[record.consentStatus].label}
                      </span>
                      {record.consentSource && (
                        <p className="mt-2 text-xs text-[#918c83]">
                          Source: {record.consentSource}
                        </p>
                      )}
                    </td>

                    <td className="max-w-[220px] px-5 py-4 text-sm text-[#666157]">
                      {record.purpose}
                    </td>

                    <td className="px-5 py-4 text-xs text-[#77736c]">
                      {formatDate(record.consentRecordedAt)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs text-[#555148]">
                        {record.lastUpdatedBy}
                      </p>
                      <p className="mt-1 text-xs text-[#918c83]">
                        {formatDate(record.lastUpdatedAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          onViewConsentEvidence?.(record.id)
                        }
                        disabled={!onViewConsentEvidence}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8a7147] hover:text-[#5e4b2e] disabled:opacity-40"
                      >
                        <ShieldCheck size={14} />
                        View evidence
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
            Consent is not the same as account preference
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            A user&apos;s channel preference must not be treated as proof
            of consent. Store the purpose, source, timestamp, and
            evidence of consent where required. Opt-outs must be
            respected by the notification service, not merely hidden
            in this interface.
          </p>
        </div>
      </section>
    </main>
  );
}
