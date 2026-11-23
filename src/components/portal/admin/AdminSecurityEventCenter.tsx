
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  LockKeyhole,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react";

export type SecurityEventSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SecurityEventCategory =
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "ACCOUNT_SECURITY"
  | "ADMIN_ACTION"
  | "API_SECURITY"
  | "SESSION_SECURITY"
  | "OTHER";

export type SecurityEventStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "FALSE_POSITIVE";

export interface SecurityEvent {
  id: string;
  eventType: string;
  category: SecurityEventCategory;
  severity: SecurityEventSeverity;
  status: SecurityEventStatus;
  summary: string;
  actorLabel?: string;
  affectedResource?: string;
  sourceLabel?: string;
  correlationId?: string;
  occurredAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  resolutionSummary?: string;
}

interface AdminSecurityEventCenterProps {
  events: SecurityEvent[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (event: SecurityEvent) => void;
  onRequestReview?: (eventId: string) => void;
}

const severityConfig: Record<
  SecurityEventSeverity,
  { label: string; className: string; icon: ReactNode }
> = {
  INFO: {
    label: "Informational",
    className: "bg-slate-100 text-slate-700",
    icon: <CheckCircle2 size={14} />,
  },
  LOW: {
    label: "Low",
    className: "bg-blue-50 text-blue-700",
    icon: <AlertCircle size={14} />,
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-amber-50 text-amber-700",
    icon: <AlertTriangle size={14} />,
  },
  HIGH: {
    label: "High",
    className: "bg-orange-50 text-orange-700",
    icon: <ShieldAlert size={14} />,
  },
  CRITICAL: {
    label: "Critical",
    className: "bg-red-50 text-red-700",
    icon: <AlertTriangle size={14} />,
  },
};

const statusConfig: Record<
  SecurityEventStatus,
  { label: string; className: string }
> = {
  OPEN: {
    label: "Open",
    className: "bg-red-50 text-red-700",
  },
  UNDER_REVIEW: {
    label: "Under review",
    className: "bg-amber-50 text-amber-700",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700",
  },
  FALSE_POSITIVE: {
    label: "False positive",
    className: "bg-slate-100 text-slate-600",
  },
};

const severityFilters = [
  "ALL",
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

type SeverityFilter = (typeof severityFilters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SeverityBadge({
  severity,
}: {
  severity: SecurityEventSeverity;
}) {
  const config = severityConfig[severity];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: SecurityEventStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
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

export default function AdminSecurityEventCenter({
  events,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
  onRequestReview,
}: AdminSecurityEventCenterProps) {
  const [search, setSearch] = useState("");
  const [activeSeverity, setActiveSeverity] =
    useState<SeverityFilter>("ALL");
  const [activeStatus, setActiveStatus] =
    useState<"ALL" | SecurityEventStatus>("ALL");

  const metrics = useMemo(
    () => ({
      total: events.length,
      critical: events.filter(
        (event) => event.severity === "CRITICAL"
      ).length,
      high: events.filter(
        (event) => event.severity === "HIGH"
      ).length,
      open: events.filter(
        (event) => event.status === "OPEN"
      ).length,
      underReview: events.filter(
        (event) => event.status === "UNDER_REVIEW"
      ).length,
    }),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSeverity =
        activeSeverity === "ALL" ||
        event.severity === activeSeverity;

      const matchesStatus =
        activeStatus === "ALL" ||
        event.status === activeStatus;

      const searchable = [
        event.id,
        event.eventType,
        event.category,
        event.summary,
        event.actorLabel ?? "",
        event.affectedResource ?? "",
        event.correlationId ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesSeverity &&
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [events, search, activeSeverity, activeStatus]);

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <ShieldAlert size={15} />
            Security operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Security Event Center
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Monitor security events, review alerts, and track investigation
            outcomes across the platform.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={!onRefresh || loading}
          className="rounded-lg border border-[#ded9cf] bg-white px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Refresh events
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
          label="Total events"
          value={metrics.total}
          description="Events in supplied dataset"
          icon={<LockKeyhole size={19} />}
        />
        <MetricCard
          label="Critical"
          value={metrics.critical}
          description="Critical severity records"
          icon={<ShieldAlert size={19} />}
        />
        <MetricCard
          label="High severity"
          value={metrics.high}
          description="High severity records"
          icon={<AlertTriangle size={19} />}
        />
        <MetricCard
          label="Open events"
          value={metrics.open}
          description="Awaiting investigation"
          icon={<UserX size={19} />}
        />
        <MetricCard
          label="Under review"
          value={metrics.underReview}
          description="Currently being reviewed"
          icon={<Eye size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Security event records
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredEvents.length} matching events
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search event, actor, resource..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={15} className="mr-1 text-[#918c83]" />
              <span className="mr-1 text-xs text-[#918c83]">
                Severity:
              </span>

              {severityFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveSeverity(filter)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeSeverity === filter
                      ? "bg-[#292821] text-white"
                      : "border border-[#e8e3da] text-[#77736c] hover:bg-[#f7f5f0]"
                  }`}
                >
                  {filter === "ALL"
                    ? "All"
                    : severityConfig[filter].label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs text-[#918c83]">
                Status:
              </span>

              {(
                [
                  "ALL",
                  "OPEN",
                  "UNDER_REVIEW",
                  "RESOLVED",
                  "FALSE_POSITIVE",
                ] as const
              ).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveStatus(filter)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    activeStatus === filter
                      ? "bg-[#292821] text-white"
                      : "border border-[#e8e3da] text-[#77736c] hover:bg-[#f7f5f0]"
                  }`}
                >
                  {filter === "ALL"
                    ? "All statuses"
                    : statusConfig[filter].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading security events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No security events found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Actor</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Occurred</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-[#fcfbf9]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {event.eventType}
                      </p>
                      <p className="mt-1 max-w-[260px] text-xs text-[#918c83]">
                        {event.summary}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {event.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {event.category.replaceAll("_", " ")}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {event.actorLabel || "System"}
                    </td>

                    <td className="px-5 py-4">
                      <SeverityBadge severity={event.severity} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={event.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDate(event.occurredAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(event)}
                          disabled={!onViewDetails}
                          title="View security event"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>

                        {(event.status === "OPEN" ||
                          event.status === "UNDER_REVIEW") && (
                          <button
                            type="button"
                            onClick={() => onRequestReview?.(event.id)}
                            disabled={!onRequestReview}
                            title="Request event review"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <ShieldCheck size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[#e9e5dd] bg-[#faf9f6] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Security monitoring safeguards
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Severity classifications should be based on documented
                detection rules and incident policies.
              </li>
              <li>
                • Preserve original event timestamps and correlation IDs
                for investigation.
              </li>
              <li>
                • Restrict access to sensitive event details and personal
                information.
              </li>
              <li>
                • Do not expose passwords, tokens, session secrets, or
                unnecessary network identifiers in event summaries.
              </li>
              <li>
                • Reviewing an event does not automatically resolve the
                underlying security issue.
              </li>
              <li>
                • Maintain an auditable record of investigation decisions
                and subsequent remediation.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
