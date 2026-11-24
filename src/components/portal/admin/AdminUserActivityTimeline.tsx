
"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  KeyRound,
  LogIn,
  LogOut,
  Search,
  ShieldAlert,
  User,
} from "lucide-react";

export type UserActivityType =
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PROFILE_UPDATE"
  | "ROLE_CHANGE"
  | "PERMISSION_CHANGE"
  | "SESSION_REVOKED"
  | "FAILED_LOGIN"
  | "ACCOUNT_LOCKED"
  | "OTHER";

export type UserActivityOutcome =
  | "SUCCESS"
  | "FAILED"
  | "BLOCKED"
  | "PENDING";

export interface UserActivityRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  role?: string;
  activityType: UserActivityType;
  outcome: UserActivityOutcome;
  description: string;
  occurredAt: string;
  source?: string;
  ipAddress?: string;
  correlationId?: string;
}

interface AdminUserActivityTimelineProps {
  activities: UserActivityRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewUser?: (userId: string) => void;
  onExport?: (records: UserActivityRecord[]) => void;
}

const activityLabels: Record<UserActivityType, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  PASSWORD_CHANGE: "Password change",
  PROFILE_UPDATE: "Profile update",
  ROLE_CHANGE: "Role change",
  PERMISSION_CHANGE: "Permission change",
  SESSION_REVOKED: "Session revoked",
  FAILED_LOGIN: "Failed login",
  ACCOUNT_LOCKED: "Account locked",
  OTHER: "Other activity",
};

const outcomeStyles: Record<
  UserActivityOutcome,
  string
> = {
  SUCCESS: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  BLOCKED: "bg-amber-50 text-amber-700",
  PENDING: "bg-blue-50 text-blue-700",
};

const activityIcons: Record<
  UserActivityType,
  typeof Activity
> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  PASSWORD_CHANGE: KeyRound,
  PROFILE_UPDATE: User,
  ROLE_CHANGE: ShieldAlert,
  PERMISSION_CHANGE: ShieldAlert,
  SESSION_REVOKED: LogOut,
  FAILED_LOGIN: AlertCircle,
  ACCOUNT_LOCKED: ShieldAlert,
  OTHER: Activity,
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function getDayKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
  }).format(date);
}

function MetricCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  description: string;
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

export default function AdminUserActivityTimeline({
  activities,
  loading = false,
  error,
  onRefresh,
  onViewUser,
  onExport,
}: AdminUserActivityTimelineProps) {
  const [search, setSearch] = useState("");
  const [activityFilter, setActivityFilter] =
    useState<UserActivityType | "ALL">("ALL");
  const [outcomeFilter, setOutcomeFilter] =
    useState<UserActivityOutcome | "ALL">("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const sortedActivities = useMemo(
    () =>
      [...activities].sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() -
          new Date(a.occurredAt).getTime()
      ),
    [activities]
  );

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortedActivities.filter((record) => {
      const matchesActivity =
        activityFilter === "ALL" ||
        record.activityType === activityFilter;

      const matchesOutcome =
        outcomeFilter === "ALL" ||
        record.outcome === outcomeFilter;

      const searchable = [
        record.userName,
        record.userEmail ?? "",
        record.userId,
        record.description,
        record.source ?? "",
        record.correlationId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const date = new Date(record.occurredAt);

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesFrom =
        !dateFrom ||
        (!Number.isNaN(date.getTime()) &&
          date >= new Date(`${dateFrom}T00:00:00`));

      const matchesTo =
        !dateTo ||
        (!Number.isNaN(date.getTime()) &&
          date < new Date(`${dateTo}T00:00:00` + "Z") &&
          date < new Date(`${dateTo}T00:00:00`));

      return (
        matchesActivity &&
        matchesOutcome &&
        matchesSearch &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    sortedActivities,
    search,
    activityFilter,
    outcomeFilter,
    dateFrom,
    dateTo,
  ]);

  const metrics = useMemo(
    () => ({
      total: filteredActivities.length,
      successful: filteredActivities.filter(
        (record) => record.outcome === "SUCCESS"
      ).length,
      failed: filteredActivities.filter(
        (record) => record.outcome === "FAILED"
      ).length,
      blocked: filteredActivities.filter(
        (record) => record.outcome === "BLOCKED"
      ).length,
    }),
    [filteredActivities]
  );

  const groupedActivities = useMemo(() => {
    const groups = new Map<string, UserActivityRecord[]>();

    filteredActivities.forEach((record) => {
      const key = getDayKey(record.occurredAt);
      const existing = groups.get(key) ?? [];

      existing.push(record);
      groups.set(key, existing);
    });

    return Array.from(groups.entries());
  }, [filteredActivities]);

  function clearFilters() {
    setSearch("");
    setActivityFilter("ALL");
    setOutcomeFilter("ALL");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Activity size={15} />
            Security and user governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            User Activity Timeline
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review chronological account activity, authentication
            outcomes, and security-related changes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || loading}
            className="rounded-lg border border-[#ded9cf] bg-white px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:opacity-50"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => onExport?.(filteredActivities)}
            disabled={!onExport || filteredActivities.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#403e35] disabled:opacity-50"
          >
            <Download size={15} />
            Export filtered records
          </button>
        </div>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total activities"
          value={metrics.total}
          description="Records matching current filters"
          icon={<Activity size={19} />}
        />
        <MetricCard
          label="Successful"
          value={metrics.successful}
          description="Successful recorded outcomes"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="Failed"
          value={metrics.failed}
          description="Failed recorded outcomes"
          icon={<AlertCircle size={19} />}
        />
        <MetricCard
          label="Blocked"
          value={metrics.blocked}
          description="Blocked recorded outcomes"
          icon={<ShieldAlert size={19} />}
        />
      </section>

      <section className="rounded-xl border border-[#e9e5dd] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={16} className="text-[#9b8358]" />
          <h2 className="font-semibold text-[#292821]">
            Filter activity
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search user or activity..."
              className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
            />
          </div>

          <select
            value={activityFilter}
            onChange={(event) =>
              setActivityFilter(
                event.target.value as UserActivityType | "ALL"
              )
            }
            className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
          >
            <option value="ALL">All activity types</option>
            {Object.entries(activityLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={outcomeFilter}
            onChange={(event) =>
              setOutcomeFilter(
                event.target.value as UserActivityOutcome | "ALL"
              )
            }
            className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
          >
            <option value="ALL">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="BLOCKED">Blocked</option>
            <option value="PENDING">Pending</option>
          </select>

          <input
            type="date"
            aria-label="Activity from date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
          />

          <input
            type="date"
            aria-label="Activity to date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            min={dateFrom || undefined}
            className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
          />
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-[#9b8358] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[#e9e5dd] bg-white p-5">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#292821]">
              Activity history
            </h2>
            <p className="mt-1 text-xs text-[#918c83]">
              Newest recorded events appear first
            </p>
          </div>
          <span className="rounded-full bg-[#f3f1ec] px-3 py-1 text-xs text-[#68645c]">
            {filteredActivities.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#77736c]">
            Loading activity history...
          </div>
        ) : groupedActivities.length === 0 ? (
          <div className="py-12 text-center">
            <Activity size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No activity records found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Change the filters or check again later.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedActivities.map(([day, records]) => (
              <div key={day}>
                <div className="mb-4 flex items-center gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                    {day}
                  </h3>
                  <div className="h-px flex-1 bg-[#eeeae3]" />
                  <span className="text-xs text-[#aaa397]">
                    {records.length} events
                  </span>
                </div>

                <div className="space-y-3">
                  {records.map((record) => {
                    const Icon =
                      activityIcons[record.activityType];

                    return (
                      <article
                        key={record.id}
                        className="rounded-xl border border-[#eeeae3] p-4 transition hover:bg-[#fcfbf9]"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f3f1ec] text-[#9b8358]">
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold text-[#34322c]">
                                {activityLabels[record.activityType]}
                              </h4>

                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${outcomeStyles[record.outcome]}`}
                              >
                                {record.outcome}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-[#68645c]">
                              {record.description}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#918c83]">
                              <span>
                                User:{" "}
                                <button
                                  type="button"
                                  onClick={() =>
                                    onViewUser?.(record.userId)
                                  }
                                  disabled={!onViewUser}
                                  className="font-medium text-[#8a7148] hover:underline disabled:cursor-default disabled:no-underline"
                                >
                                  {record.userName}
                                </button>
                              </span>

                              {record.role && (
                                <span>Role: {record.role}</span>
                              )}

                              {record.source && (
                                <span>Source: {record.source}</span>
                              )}

                              {record.ipAddress && (
                                <span>
                                  IP: {record.ipAddress}
                                </span>
                              )}
                            </div>

                            {record.correlationId && (
                              <p className="mt-2 break-all font-mono text-[11px] text-[#aaa397]">
                                Correlation ID: {record.correlationId}
                              </p>
                            )}
                          </div>

                          <time
                            dateTime={record.occurredAt}
                            className="shrink-0 text-xs text-[#918c83]"
                          >
                            {formatDate(record.occurredAt)}
                          </time>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
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
              Audit and privacy requirements
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Activity records should be generated by trusted
                backend services, not by browser events alone.
              </li>
              <li>
                • Keep audit records append-only and protect them from
                unauthorized modification.
              </li>
              <li>
                • Restrict access to IP addresses and other potentially
                sensitive metadata.
              </li>
              <li>
                • Apply server-side pagination, date filtering, and
                export authorization for large datasets.
              </li>
              <li>
                • Do not store passwords, access tokens, session cookies,
                or other secrets in activity descriptions.
              </li>
              <li>
                • Use server timestamps and stable event IDs to support
                reliable investigation and correlation.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
