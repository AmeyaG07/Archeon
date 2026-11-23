
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownUp,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Gauge,
  Search,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

export type RateLimitStatus =
  | "NORMAL"
  | "WARNING"
  | "LIMIT_REACHED"
  | "THROTTLED"
  | "DISABLED";

export interface ApiRateLimitRecord {
  id: string;
  clientName: string;
  clientType: "USER" | "SERVICE" | "INTEGRATION";
  endpointGroup: string;
  environment: "PRODUCTION" | "STAGING" | "DEVELOPMENT";
  requestsUsed: number;
  requestLimit: number;
  windowLabel: string;
  windowResetsAt?: string;
  throttledRequests: number;
  status: RateLimitStatus;
  lastRequestAt?: string;
}

interface AdminApiRateLimitMonitorProps {
  records: ApiRateLimitRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (record: ApiRateLimitRecord) => void;
}

const statusConfig: Record<
  RateLimitStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  NORMAL: {
    label: "Normal",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  WARNING: {
    label: "Approaching limit",
    className: "bg-amber-50 text-amber-700",
    icon: <AlertCircle size={14} />,
  },
  LIMIT_REACHED: {
    label: "Limit reached",
    className: "bg-orange-50 text-orange-700",
    icon: <Gauge size={14} />,
  },
  THROTTLED: {
    label: "Throttled",
    className: "bg-red-50 text-red-700",
    icon: <ShieldAlert size={14} />,
  },
  DISABLED: {
    label: "Policy disabled",
    className: "bg-slate-100 text-slate-600",
    icon: <Clock3 size={14} />,
  },
};

const filters = [
  "ALL",
  "NORMAL",
  "WARNING",
  "LIMIT_REACHED",
  "THROTTLED",
  "DISABLED",
] as const;

type RateLimitFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getUsagePercentage(record: ApiRateLimitRecord) {
  if (
    record.requestLimit <= 0 ||
    !Number.isFinite(record.requestLimit)
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, (record.requestsUsed / record.requestLimit) * 100)
  );
}

function StatusBadge({ status }: { status: RateLimitStatus }) {
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

export default function AdminApiRateLimitMonitor({
  records,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
}: AdminApiRateLimitMonitorProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<RateLimitFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: records.length,
      warning: records.filter((r) => r.status === "WARNING").length,
      reached: records.filter(
        (r) => r.status === "LIMIT_REACHED"
      ).length,
      throttled: records.filter(
        (r) => r.status === "THROTTLED"
      ).length,
      throttledRequests: records.reduce(
        (sum, r) => sum + Math.max(0, r.throttledRequests),
        0
      ),
    }),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesFilter =
        activeFilter === "ALL" ||
        record.status === activeFilter;

      const searchable = [
        record.id,
        record.clientName,
        record.clientType,
        record.endpointGroup,
        record.environment,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [records, search, activeFilter]);

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Gauge size={15} />
            Security operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            API Rate Limit Monitor
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Monitor API consumption, request quotas, throttling activity,
            and client usage patterns.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ded9cf] bg-white px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Activity
            size={15}
            className={loading ? "animate-pulse" : ""}
          />
          Refresh usage
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
          label="Tracked policies"
          value={metrics.total}
          description="Records in supplied dataset"
          icon={<Gauge size={19} />}
        />
        <MetricCard
          label="Warnings"
          value={metrics.warning}
          description="Approaching configured limits"
          icon={<AlertCircle size={19} />}
        />
        <MetricCard
          label="Limits reached"
          value={metrics.reached}
          description="Usage has reached the quota"
          icon={<TrendingUp size={19} />}
        />
        <MetricCard
          label="Throttled clients"
          value={metrics.throttled}
          description="Records marked as throttled"
          icon={<ShieldAlert size={19} />}
        />
        <MetricCard
          label="Throttled requests"
          value={metrics.throttledRequests}
          description="Reported throttled request count"
          icon={<ArrowDownUp size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                API consumption records
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client, endpoint, environment..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
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
                  ? "All policies"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading API usage...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <Gauge size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No rate-limit records found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try another search term or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Endpoint group</th>
                  <th className="px-5 py-3 font-medium">Usage</th>
                  <th className="px-5 py-3 font-medium">Window</th>
                  <th className="px-5 py-3 font-medium">Throttled</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredRecords.map((record) => {
                  const percentage = getUsagePercentage(record);

                  return (
                    <tr key={record.id} className="hover:bg-[#fcfbf9]">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-[#34322c]">
                          {record.clientName}
                        </p>
                        <p className="mt-1 text-xs text-[#918c83]">
                          {record.clientType} · {record.environment}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {record.endpointGroup}
                      </td>

                      <td className="px-5 py-4">
                        <div className="min-w-[170px]">
                          <div className="flex justify-between gap-3 text-xs">
                            <span className="font-medium text-[#34322c]">
                              {record.requestsUsed.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[#918c83]">
                              {record.requestLimit.toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div
                            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eeeae3]"
                            role="progressbar"
                            aria-label={`${record.clientName} API quota usage`}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={percentage}
                          >
                            <div
                              className="h-full rounded-full bg-[#a58c5d]"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <p className="mt-1 text-xs text-[#918c83]">
                            {percentage.toFixed(1)}% consumed
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-[#77736c]">
                          {record.windowLabel}
                        </p>
                        <p className="mt-1 text-xs text-[#aaa397]">
                          Resets: {formatDate(record.windowResetsAt)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {record.throttledRequests.toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={record.status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(record)}
                          disabled={!onViewDetails}
                          title="View rate-limit details"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>
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
          <ShieldAlert
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Rate-limit enforcement safeguards
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Enforce quotas at the API gateway or trusted backend layer,
                not in the browser.
              </li>
              <li>
                • Define limits by authenticated identity, service, endpoint,
                and environment where appropriate.
              </li>
              <li>
                • Use distributed counters or another consistent strategy
                when the backend runs multiple instances.
              </li>
              <li>
                • Return appropriate throttling responses and retry guidance
                to API consumers.
              </li>
              <li>
                • Do not expose raw IP addresses, access tokens, or sensitive
                request details in general monitoring views.
              </li>
              <li>
                • Keep usage windows and status classifications consistent
                with the authoritative gateway policy.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

