
"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FolderKanban,
  Gauge,
  RefreshCw,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";

export type OperationalQueueStatus =
  | "pending"
  | "in_progress"
  | "blocked"
  | "completed";

export type OperationalQueue = {
  id: string;
  title: string;
  description?: string;
  count: number;
  status: OperationalQueueStatus;
  href?: string;
};

export type OperationalAlertSeverity =
  | "critical"
  | "warning"
  | "information";

export type OperationalAlert = {
  id: string;
  title: string;
  description: string;
  severity: OperationalAlertSeverity;
  occurredAt: string;
  acknowledged?: boolean;
  source?: string;
};

export type OperationalActivity = {
  id: string;
  title: string;
  description?: string;
  actor: string;
  occurredAt: string;
  category:
    | "project"
    | "finance"
    | "client"
    | "vendor"
    | "system"
    | "security";
};

export type OperationalMetric = {
  id: string;
  label: string;
  value: number | string;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
    context: string;
  };
};

export type OperationalMonitoringData = {
  metrics: OperationalMetric[];
  queues: OperationalQueue[];
  alerts: OperationalAlert[];
  activities: OperationalActivity[];
  updatedAt?: string;
};

type Props = {
  data: OperationalMonitoringData;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenQueue?: (queue: OperationalQueue) => void;
  onOpenAlert?: (alert: OperationalAlert) => void;
  onOpenActivity?: (activity: OperationalActivity) => void;
  onViewAllAlerts?: () => void;
  onViewAllActivity?: () => void;
};

const severityStyles: Record<
  OperationalAlertSeverity,
  {
    label: string;
    icon: ReactNode;
    className: string;
  }
> = {
  critical: {
    label: "Critical",
    icon: <ShieldAlert size={16} />,
    className: "border-red-200 bg-red-50 text-red-800",
  },
  warning: {
    label: "Warning",
    icon: <AlertTriangle size={16} />,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  information: {
    label: "Information",
    icon: <AlertCircle size={16} />,
    className: "border-[#D8D6D0] bg-[#F2F0EB] text-[#55534F]",
  },
};

const queueStyles: Record<
  OperationalQueueStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-[#F2F0EB] text-[#55534F]",
  },
  in_progress: {
    label: "In progress",
    className: "bg-blue-50 text-blue-800",
  },
  blocked: {
    label: "Blocked",
    className: "bg-red-50 text-red-800",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-800",
  },
};

const activityIcons: Record<
  OperationalActivity["category"],
  ReactNode
> = {
  project: <FolderKanban size={16} />,
  finance: <Activity size={16} />,
  client: <CheckCircle2 size={16} />,
  vendor: <Workflow size={16} />,
  system: <Gauge size={16} />,
  security: <ShieldAlert size={16} />,
};

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9A7848]">
          {eyebrow}
        </p>
        <h2 className="text-lg font-medium tracking-tight text-[#171717]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-[#D8D6D0] px-5 py-8 text-center">
      <div className="mb-3 text-[#99958D]">{icon}</div>
      <p className="text-sm font-medium text-[#33312E]">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-[#77736D]">
        {description}
      </p>
    </div>
  );
}

function MetricCard({ metric }: { metric: OperationalMetric }) {
  const trendIcon =
    metric.trend?.direction === "up" ? (
      <ArrowUpRight size={14} />
    ) : metric.trend?.direction === "down" ? (
      <ArrowDownRight size={14} />
    ) : null;

  return (
    <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
      <p className="text-xs text-[#77736D]">{metric.label}</p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-medium tracking-tight tabular-nums text-[#171717]">
          {metric.value}
        </p>

        {metric.trend && (
          <span className="flex items-center gap-1 text-xs text-[#77736D]">
            {trendIcon}
            {metric.trend.value}
          </span>
        )}
      </div>

      {metric.description && (
        <p className="mt-3 text-xs leading-5 text-[#77736D]">
          {metric.description}
        </p>
      )}

      {metric.trend?.context && (
        <p className="mt-1 text-[11px] text-[#99958D]">
          {metric.trend.context}
        </p>
      )}
    </article>
  );
}

export default function AdminOperationalMonitoring({
  data,
  loading = false,
  error = null,
  onRefresh,
  onOpenQueue,
  onOpenAlert,
  onOpenActivity,
  onViewAllAlerts,
  onViewAllActivity,
}: Props) {
  const metrics = data?.metrics ?? [];
  const queues = data?.queues ?? [];
  const alerts = data?.alerts ?? [];
  const activities = data?.activities ?? [];

  const criticalCount = alerts.filter(
    (alert) =>
      alert.severity === "critical" && !alert.acknowledged
  ).length;

  const blockedCount = queues.filter(
    (queue) => queue.status === "blocked"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        {/* Page heading */}
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9A7848]">
              Studio administration / Operations
            </p>

            <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
              Operational monitoring
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736D]">
              Monitor workflow activity, operational exceptions and
              administrative workload across the studio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {data?.updatedAt && (
              <span className="text-xs text-[#77736D]">
                Updated {formatTimestamp(data.updatedAt)}
              </span>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D8D6D0] bg-white px-4 py-2.5 text-xs font-medium text-[#33312E] transition hover:border-[#B68A4A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            )}
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Unable to load operational data</p>
              <p className="mt-1 text-xs leading-5">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-[#D8D6D0] bg-white px-4 py-3 text-xs text-[#77736D]"
          >
            Updating operational information…
          </div>
        )}

        {/* Operational metrics */}
        <section aria-label="Operational metrics" className="mb-9">
          <SectionHeader
            eyebrow="01 / Overview"
            title="Operational indicators"
          />

          {metrics.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Gauge size={22} />}
              title="No operational metrics available"
              description="Metrics will appear when the connected data source provides them."
            />
          )}
        </section>

        {/* Work queues */}
        <section aria-label="Workflow queues" className="mb-9">
          <SectionHeader
            eyebrow="02 / Workflows"
            title="Workflow queues"
          />

          {queues.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {queues.map((queue) => {
                const status = queueStyles[queue.status];

                return (
                  <button
                    key={queue.id}
                    type="button"
                    onClick={() => onOpenQueue?.(queue)}
                    disabled={!onOpenQueue}
                    className="group rounded-xl border border-[#E2E0DA] bg-white p-5 text-left transition hover:border-[#B68A4A] disabled:cursor-default"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-[#252421]">
                          {queue.title}
                        </h3>

                        {queue.description && (
                          <p className="mt-1 text-xs leading-5 text-[#77736D]">
                            {queue.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-5 flex items-end justify-between">
                      <span className="text-3xl font-medium tabular-nums text-[#171717]">
                        {queue.count}
                      </span>

                      {onOpenQueue && (
                        <span className="flex items-center gap-1 text-xs text-[#9A7848]">
                          Open queue
                          <ChevronRight
                            size={14}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Workflow size={22} />}
              title="No workflow queues available"
              description="Workflow counts will appear when queue data is connected."
            />
          )}
        </section>

        {/* Alerts and activity */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <section aria-label="Operational alerts">
            <SectionHeader
              eyebrow="03 / Exceptions"
              title="Operational alerts"
              action={
                onViewAllAlerts ? (
                  <button
                    type="button"
                    onClick={onViewAllAlerts}
                    className="text-xs font-medium text-[#9A7848] hover:underline"
                  >
                    View all
                  </button>
                ) : undefined
              }
            />

            <div className="mb-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#E2E0DA] bg-white px-3 py-2 text-xs">
                <AlertTriangle size={14} className="text-amber-700" />
                <span className="text-[#77736D]">Blocked workflows</span>
                <strong className="text-[#252421]">{blockedCount}</strong>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#E2E0DA] bg-white px-3 py-2 text-xs">
                <Bell size={14} className="text-red-700" />
                <span className="text-[#77736D]">Unacknowledged critical</span>
                <strong className="text-[#252421]">{criticalCount}</strong>
              </div>
            </div>

            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const style = severityStyles[alert.severity];

                  return (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => onOpenAlert?.(alert)}
                      disabled={!onOpenAlert}
                      className="w-full rounded-xl border border-[#E2E0DA] bg-white p-4 text-left transition hover:border-[#B68A4A] disabled:cursor-default"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 rounded-lg border p-2 ${style.className}`}
                        >
                          {style.icon}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-medium text-[#252421]">
                              {alert.title}
                            </h3>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${style.className}`}
                            >
                              {style.label}
                            </span>

                            {alert.acknowledged && (
                              <span className="text-[10px] text-[#77736D]">
                                Acknowledged
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-[#77736D]">
                            {alert.description}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-[#99958D]">
                            <span className="flex items-center gap-1">
                              <Clock3 size={12} />
                              {formatTimestamp(alert.occurredAt)}
                            </span>

                            {alert.source && <span>{alert.source}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<CheckCircle2 size={22} />}
                title="No alerts to display"
                description="No alert records were supplied by the connected data source."
              />
            )}
          </section>

          <section aria-label="Recent operational activity">
            <SectionHeader
              eyebrow="04 / Activity"
              title="Recent activity"
              action={
                onViewAllActivity ? (
                  <button
                    type="button"
                    onClick={onViewAllActivity}
                    className="text-xs font-medium text-[#9A7848] hover:underline"
                  >
                    View all
                  </button>
                ) : undefined
              }
            />

            {activities.length > 0 ? (
              <div className="rounded-xl border border-[#E2E0DA] bg-white">
                {activities.map((activity, index) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => onOpenActivity?.(activity)}
                    disabled={!onOpenActivity}
                    className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-[#FAF9F6] disabled:cursor-default ${
                      index !== activities.length - 1
                        ? "border-b border-[#EEECE7]"
                        : ""
                    }`}
                  >
                    <span className="mt-0.5 rounded-lg bg-[#F2F0EB] p-2 text-[#77736D]">
                      {activityIcons[activity.category]}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[#252421]">
                        {activity.title}
                      </span>

                      {activity.description && (
                        <span className="mt-1 block text-xs leading-5 text-[#77736D]">
                          {activity.description}
                        </span>
                      )}

                      <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#99958D]">
                        <span>{activity.actor}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatTimestamp(activity.occurredAt)}</span>
                      </span>
                    </span>

                    {onOpenActivity && (
                      <ChevronRight
                        size={15}
                        className="mt-1 shrink-0 text-[#AAA69E]"
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Activity size={22} />}
                title="No recent activity"
                description="Activity records will appear when the audit or activity feed is connected."
              />
            )}
          </section>
        </div>

        {/* Operational note */}
        <footer className="mt-9 border-t border-[#D8D6D0] pt-5">
          <p className="text-[11px] leading-5 text-[#8B877F]">
            Operational information is displayed from supplied records.
            Queue counts, alert severity and timestamps must be provided by
            the authoritative backend. This view does not independently
            determine overdue status, approve transactions or change workflow
            state.
          </p>
        </footer>
      </div>
    </main>
  );
}
