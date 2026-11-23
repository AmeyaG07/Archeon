
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flag,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

export type FeatureFlagEnvironment =
  | "PRODUCTION"
  | "STAGING"
  | "DEVELOPMENT";

export type FeatureFlagStatus =
  | "ENABLED"
  | "DISABLED"
  | "SCHEDULED"
  | "PENDING_APPROVAL"
  | "UNKNOWN";

export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  status: FeatureFlagStatus;
  environment: FeatureFlagEnvironment;
  rolloutPercentage?: number;
  owner: string;
  updatedAt: string;
  updatedBy?: string;
  scheduledAt?: string;
  approvalRequired: boolean;
};

export type FeatureFlagEvent = {
  id: string;
  flagId: string;
  flagName: string;
  action:
    | "CREATED"
    | "ENABLE_REQUESTED"
    | "DISABLE_REQUESTED"
    | "APPROVED"
    | "REJECTED"
    | "ROLLOUT_CHANGED"
    | "SCHEDULED";
  actor: string;
  occurredAt: string;
  description: string;
};

type Props = {
  flags: FeatureFlag[];
  events: FeatureFlagEvent[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenFlag?: (flag: FeatureFlag) => void;
  onRequestChange?: (
    flag: FeatureFlag,
    action: "ENABLE" | "DISABLE"
  ) => void;
  onRequestRolloutChange?: (
    flag: FeatureFlag,
    percentage: number
  ) => void;
  onReviewRequest?: (
    flag: FeatureFlag,
    decision: "APPROVE" | "REJECT"
  ) => void;
};

const statusStyles: Record<FeatureFlagStatus, string> = {
  ENABLED: "bg-emerald-50 text-emerald-700",
  DISABLED: "bg-stone-100 text-stone-600",
  SCHEDULED: "bg-blue-50 text-blue-700",
  PENDING_APPROVAL: "bg-amber-50 text-amber-800",
  UNKNOWN: "bg-red-50 text-red-700",
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500">{label}</span>
        <span className="text-stone-400">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminFeatureFlagManagementCenter({
  flags,
  events,
  loading = false,
  error,
  onRefresh,
  onOpenFlag,
  onRequestChange,
  onRequestRolloutChange,
  onReviewRequest,
}: Props) {
  const [activeTab, setActiveTab] = useState<"flags" | "history">("flags");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [environmentFilter, setEnvironmentFilter] = useState("ALL");
  const [rolloutDrafts, setRolloutDrafts] = useState<Record<string, number>>(
    {}
  );

  const metrics = useMemo(
    () => ({
      total: flags.length,
      enabled: flags.filter((item) => item.status === "ENABLED").length,
      disabled: flags.filter((item) => item.status === "DISABLED").length,
      pending: flags.filter(
        (item) => item.status === "PENDING_APPROVAL"
      ).length,
    }),
    [flags]
  );

  const filteredFlags = useMemo(() => {
    const query = search.trim().toLowerCase();

    return flags.filter((flag) => {
      const searchable = [
        flag.id,
        flag.key,
        flag.name,
        flag.description,
        flag.owner,
        flag.updatedBy ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "ALL" || flag.status === statusFilter) &&
        (environmentFilter === "ALL" ||
          flag.environment === environmentFilter)
      );
    });
  }, [flags, search, statusFilter, environmentFilter]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) =>
      [
        event.id,
        event.flagId,
        event.flagName,
        event.action,
        event.actor,
        event.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [events, search]);

  function getRolloutValue(flag: FeatureFlag) {
    return rolloutDrafts[flag.id] ?? flag.rolloutPercentage ?? 0;
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs text-stone-500">
              <Flag size={14} />
              Administration / Feature Flags
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Feature Flag Management
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Review feature availability, environment settings, rollout
              percentages, and change history.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Total flags"
            value={metrics.total}
            icon={<Flag size={18} />}
          />
          <Metric
            label="Enabled"
            value={metrics.enabled}
            icon={<CheckCircle2 size={18} />}
          />
          <Metric
            label="Disabled"
            value={metrics.disabled}
            icon={<SlidersHorizontal size={18} />}
          />
          <Metric
            label="Pending approval"
            value={metrics.pending}
            icon={<Clock3 size={18} />}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("flags")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "flags"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Feature flags
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "history"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Change history
              </button>
            </div>

            <div className="relative w-full lg:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search flags or history..."
                className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {activeTab === "flags" ? (
            <>
              <div className="flex flex-wrap gap-3 border-b border-stone-100 bg-stone-50/60 p-4">
                <select
                  aria-label="Filter by flag status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All statuses</option>
                  {Object.keys(statusStyles).map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by environment"
                  value={environmentFilter}
                  onChange={(event) =>
                    setEnvironmentFilter(event.target.value)
                  }
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All environments</option>
                  <option value="PRODUCTION">Production</option>
                  <option value="STAGING">Staging</option>
                  <option value="DEVELOPMENT">Development</option>
                </select>

                <p className="self-center text-xs text-stone-500 sm:ml-auto">
                  {filteredFlags.length} of {flags.length} records
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading feature flags...
                </div>
              ) : filteredFlags.length === 0 ? (
                <div className="p-12 text-center">
                  <Flag size={28} className="mx-auto text-stone-300" />
                  <p className="mt-3 text-sm font-medium">
                    No feature flags found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredFlags.map((flag) => (
                    <article key={flag.id} className="p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">
                              {flag.id}
                            </span>
                            <Badge className={statusStyles[flag.status]}>
                              {flag.status.replaceAll("_", " ")}
                            </Badge>
                            <Badge className="bg-stone-100 text-stone-600">
                              {flag.environment}
                            </Badge>
                          </div>

                          <h2 className="mt-2 text-sm font-semibold">
                            {flag.name}
                          </h2>
                          <p className="mt-1 text-sm text-stone-500">
                            {flag.description}
                          </p>

                          <p className="mt-2 break-all font-mono text-xs text-stone-500">
                            {flag.key}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                            <p>Owner: {flag.owner}</p>
                            <p>Updated by: {flag.updatedBy || "Not recorded"}</p>
                            <p>Updated: {formatDate(flag.updatedAt)}</p>
                            <p>Scheduled: {formatDate(flag.scheduledAt)}</p>
                            <p>
                              Approval required:{" "}
                              {flag.approvalRequired ? "Yes" : "No"}
                            </p>
                          </div>

                          <div className="mt-4 max-w-md">
                            <div className="mb-2 flex items-center justify-between text-xs">
                              <span className="text-stone-500">
                                Rollout percentage
                              </span>
                              <span className="font-semibold tabular-nums">
                                {flag.rolloutPercentage === undefined
                                  ? "Not recorded"
                                  : `${flag.rolloutPercentage}%`}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                              <div
                                className="h-full rounded-full bg-stone-700"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, flag.rolloutPercentage ?? 0)
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                          {flag.status === "PENDING_APPROVAL" &&
                            onReviewRequest && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewRequest(flag, "REJECT")
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewRequest(flag, "APPROVE")
                                  }
                                  className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700"
                                >
                                  Approve
                                </button>
                              </>
                            )}

                          {onRequestChange &&
                            (flag.status === "ENABLED" ||
                              flag.status === "DISABLED") && (
                              <button
                                type="button"
                                onClick={() =>
                                  onRequestChange(
                                    flag,
                                    flag.status === "ENABLED"
                                      ? "DISABLE"
                                      : "ENABLE"
                                  )
                                }
                                className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-50"
                              >
                                Request{" "}
                                {flag.status === "ENABLED"
                                  ? "disable"
                                  : "enable"}
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => onOpenFlag?.(flag)}
                            disabled={!onOpenFlag}
                            className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100 disabled:opacity-50"
                          >
                            View details
                          </button>
                        </div>
                      </div>

                      {onRequestRolloutChange && (
                        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-stone-100 bg-stone-50 p-3 sm:flex-row sm:items-center">
                          <label
                            htmlFor={`rollout-${flag.id}`}
                            className="text-xs font-medium text-stone-600"
                          >
                            Proposed rollout
                          </label>

                          <input
                            id={`rollout-${flag.id}`}
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={getRolloutValue(flag)}
                            onChange={(event) =>
                              setRolloutDrafts((current) => ({
                                ...current,
                                [flag.id]: Number(event.target.value),
                              }))
                            }
                            className="flex-1 accent-stone-800"
                          />

                          <span className="w-12 text-right text-xs font-semibold tabular-nums">
                            {getRolloutValue(flag)}%
                          </span>

                          <button
                            type="button"
                            disabled={
                              flag.rolloutPercentage === undefined ||
                              getRolloutValue(flag) === flag.rolloutPercentage
                            }
                            onClick={() => {
                              const percentage = getRolloutValue(flag);
                              onRequestRolloutChange(flag, percentage);
                              setRolloutDrafts((current) => {
                                const next = { ...current };
                                delete next[flag.id];
                                return next;
                              });
                            }}
                            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Request change
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div>
              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading change history...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  No change history found.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredEvents.map((event) => (
                    <article key={event.id} className="p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">
                              {event.id}
                            </span>
                            <Badge className="bg-stone-100 text-stone-600">
                              {event.action.replaceAll("_", " ")}
                            </Badge>
                          </div>

                          <h3 className="mt-2 text-sm font-semibold">
                            {event.flagName}
                          </h3>
                          <p className="mt-1 text-sm text-stone-500">
                            {event.description}
                          </p>
                          <p className="mt-2 text-xs text-stone-400">
                            Flag: {event.flagId} · Actor: {event.actor} ·{" "}
                            {formatDate(event.occurredAt)}
                          </p>
                        </div>
                        <History
                          size={17}
                          className="shrink-0 text-stone-400"
                        />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-amber-800"
            />
            <div>
              <h2 className="text-sm font-semibold">
                Feature rollout safeguards
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                Feature flags must be enforced by the backend. A frontend
                visibility check is not an access-control boundary. Production
                changes should use authorised approvals, environment
                restrictions, audit logging, and a verified rollback plan.
              </p>
            </div>
          </div>
        </section>

        <p className="text-xs text-stone-400">
          All actions in this component request changes. They do not directly
          modify application configuration.
        </p>
      </div>
    </main>
  );
}
