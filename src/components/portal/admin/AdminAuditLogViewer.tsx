
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Filter,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

export type AuditEventSeverity =
  | "Informational"
  | "Warning"
  | "Critical";

export type AuditEventOutcome =
  | "Success"
  | "Failed"
  | "Denied"
  | "Pending";

export type AuditEventCategory =
  | "Authentication"
  | "Client Management"
  | "Vendor Management"
  | "Project Management"
  | "Invoice Management"
  | "Financial Approval"
  | "Cash Settlement"
  | "Document Access"
  | "Configuration"
  | "Security"
  | "Other";

export interface AdminAuditEvent {
  id: string;
  eventReference: string;
  occurredAt: string;

  actorId: string | null;
  actorName: string;
  actorRole: string;

  action: string;
  category: AuditEventCategory;
  severity: AuditEventSeverity;
  outcome: AuditEventOutcome;

  entityType?: string;
  entityReference?: string;

  description: string;

  ipAddress?: string;
  source?: string;

  correlationId?: string;
  reason?: string;

  changes?: {
    field: string;
    previousValue: string | null;
    newValue: string | null;
  }[];
}

export interface AuditLogSummary {
  totalEvents: number;
  criticalEvents: number;
  failedEvents: number;
  deniedEvents: number;
}

export interface AdminAuditLogViewerProps {
  events: AdminAuditEvent[];
  summary?: AuditLogSummary;

  loading?: boolean;
  error?: string;

  currentPage: number;
  totalPages: number;
  totalRecords: number;

  onRefresh?: () => void;
  onPageChange: (page: number) => void;

  onExport?: (filters: {
    search: string;
    category: string;
    severity: string;
    outcome: string;
    fromDate: string;
    toDate: string;
  }) => void;

  onOpenEntity?: (
    entityType: string,
    entityReference: string
  ) => void;

  onOpenActor?: (actorId: string) => void;
}

type AuditFilter = {
  search: string;
  category: string;
  severity: string;
  outcome: string;
  fromDate: string;
  toDate: string;
};

const INITIAL_FILTERS: AuditFilter = {
  search: "",
  category: "All",
  severity: "All",
  outcome: "All",
  fromDate: "",
  toDate: "",
};

const CATEGORIES: AuditEventCategory[] = [
  "Authentication",
  "Client Management",
  "Vendor Management",
  "Project Management",
  "Invoice Management",
  "Financial Approval",
  "Cash Settlement",
  "Document Access",
  "Configuration",
  "Security",
  "Other",
];

const SEVERITIES: AuditEventSeverity[] = [
  "Informational",
  "Warning",
  "Critical",
];

const OUTCOMES: AuditEventOutcome[] = [
  "Success",
  "Failed",
  "Denied",
  "Pending",
];

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function severityClass(severity: AuditEventSeverity) {
  switch (severity) {
    case "Critical":
      return "bg-[#F8E8E5] text-[#A04F43]";

    case "Warning":
      return "bg-[#F5EFDF] text-[#98743F]";

    default:
      return "bg-[#EAEFEA] text-[#607A60]";
  }
}

function outcomeClass(outcome: AuditEventOutcome) {
  switch (outcome) {
    case "Success":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Failed":
    case "Denied":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#F4EFE2] text-[#94743F]";
  }
}

export function AdminAuditLogViewer({
  events,
  summary,
  loading = false,
  error,
  currentPage,
  totalPages,
  totalRecords,
  onRefresh,
  onPageChange,
  onExport,
  onOpenEntity,
  onOpenActor,
}: AdminAuditLogViewerProps) {
  const [filters, setFilters] =
    useState<AuditFilter>(INITIAL_FILTERS);

  const [selectedEvent, setSelectedEvent] =
    useState<AdminAuditEvent | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const visibleEvents = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return events.filter((event) => {
      if (
        query &&
        ![
          event.eventReference,
          event.actorName,
          event.actorRole,
          event.action,
          event.description,
          event.entityReference ?? "",
          event.entityType ?? "",
          event.correlationId ?? "",
        ].some((value) => value.toLowerCase().includes(query))
      ) {
        return false;
      }

      if (
        filters.category !== "All" &&
        event.category !== filters.category
      ) {
        return false;
      }

      if (
        filters.severity !== "All" &&
        event.severity !== filters.severity
      ) {
        return false;
      }

      if (
        filters.outcome !== "All" &&
        event.outcome !== filters.outcome
      ) {
        return false;
      }

      const eventDate = new Date(event.occurredAt);

      if (Number.isNaN(eventDate.getTime())) {
        return false;
      }

      if (filters.fromDate) {
        const from = new Date(`${filters.fromDate}T00:00:00`);

        if (eventDate < from) return false;
      }

      if (filters.toDate) {
        const to = new Date(`${filters.toDate}T23:59:59.999`);

        if (eventDate > to) return false;
      }

      return true;
    });
  }, [events, filters]);

  const activeFilterCount = [
    filters.category !== "All",
    filters.severity !== "All",
    filters.outcome !== "All",
    Boolean(filters.fromDate),
    Boolean(filters.toDate),
  ].filter(Boolean).length;

  function updateFilter<K extends keyof AuditFilter>(
    key: K,
    value: AuditFilter[K]
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFilters() {
    setFilters(INITIAL_FILTERS);
  }

  function handleExport() {
    onExport?.({
      search: filters.search,
      category: filters.category,
      severity: filters.severity,
      outcome: filters.outcome,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
  }

  const hasDateError =
    Boolean(filters.fromDate && filters.toDate) &&
    filters.fromDate > filters.toDate;

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Governance
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Audit Log
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Review recorded administrative actions, security events,
            financial decisions and changes across the platform.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
              <LockKeyhole size={12} />
              Read-only event history
            </span>

            <span className="h-1 w-1 rounded-full bg-[#A58A64]" />

            <span className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
              {totalRecords.toLocaleString("en-IN")} records
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {onExport && (
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || hasDateError}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64] disabled:opacity-40"
            >
              <ArrowDownToLine size={14} />
              Export Logs
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#171717] px-5 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-40"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-5"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-[#9A5147]"
          />

          <p className="text-xs leading-6 text-[#805B55]">
            {error}
          </p>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <section className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Events"
            value={summary.totalEvents}
            icon={<Activity size={18} />}
          />

          <SummaryCard
            label="Critical Events"
            value={summary.criticalEvents}
            icon={<ShieldAlert size={18} />}
            warning
          />

          <SummaryCard
            label="Failed Events"
            value={summary.failedEvents}
            icon={<AlertCircle size={18} />}
            warning
          />

          <SummaryCard
            label="Denied Actions"
            value={summary.deniedEvents}
            icon={<ShieldCheck size={18} />}
          />
        </section>
      )}

      {/* Search and Filters */}
      <section className="mt-9">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
            />

            <input
              value={filters.search}
              onChange={(event) =>
                updateFilter("search", event.target.value)
              }
              placeholder="Search event, actor, reference or action..."
              aria-label="Search audit events"
              className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-xs text-[#33312D] outline-none placeholder:text-[#AAA69E] focus:border-[#A58A64]"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            aria-expanded={showFilters}
            className="inline-flex h-12 items-center justify-center gap-2 border border-[#D8D6D0] bg-white px-5 text-[10px] uppercase tracking-widest text-[#55514A]"
          >
            <Filter size={14} />
            Filters

            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#A58A64] text-[9px] text-white">
                {activeFilterCount}
              </span>
            )}

            <ChevronDown
              size={13}
              className={showFilters ? "rotate-180" : ""}
            />
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-4 border border-[#D8D6D0] bg-white p-5 md:grid-cols-2 xl:grid-cols-5">
            <FilterSelect
              label="Category"
              value={filters.category}
              options={["All", ...CATEGORIES]}
              onChange={(value) =>
                updateFilter("category", value)
              }
            />

            <FilterSelect
              label="Severity"
              value={filters.severity}
              options={["All", ...SEVERITIES]}
              onChange={(value) =>
                updateFilter("severity", value)
              }
            />

            <FilterSelect
              label="Outcome"
              value={filters.outcome}
              options={["All", ...OUTCOMES]}
              onChange={(value) =>
                updateFilter("outcome", value)
              }
            />

            <label className="block">
              <span className="mb-2 block font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                From Date
              </span>

              <input
                type="date"
                value={filters.fromDate}
                onChange={(event) =>
                  updateFilter("fromDate", event.target.value)
                }
                className="h-10 w-full border border-[#D8D6D0] px-3 text-xs text-[#55514A] outline-none focus:border-[#A58A64]"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                To Date
              </span>

              <input
                type="date"
                value={filters.toDate}
                onChange={(event) =>
                  updateFilter("toDate", event.target.value)
                }
                className="h-10 w-full border border-[#D8D6D0] px-3 text-xs text-[#55514A] outline-none focus:border-[#A58A64]"
              />
            </label>

            <div className="flex items-center justify-between gap-3 md:col-span-2 xl:col-span-5">
              {hasDateError ? (
                <p className="text-[10px] text-[#9A5147]">
                  The start date cannot be after the end date.
                </p>
              ) : (
                <p className="text-[10px] text-[#99958D]">
                  Filters apply to the currently loaded event records.
                </p>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
              >
                <X size={13} />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Event List */}
      <section className="mt-8">
        <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-4">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              Recorded Activity
            </p>

            <h2 className="mt-2 font-serif text-2xl text-[#171717]">
              System Events
            </h2>
          </div>

          <p className="font-mono text-[9px] text-[#99958D]">
            {visibleEvents.length.toLocaleString("en-IN")} SHOWN
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading audit records...
            </p>
          </div>
        ) : hasDateError ? (
          <div className="mt-5 border border-[#E3C9C5] bg-[#FAF3F1] p-8 text-center">
            <p className="text-xs text-[#805B55]">
              Correct the date range to view audit events.
            </p>
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white p-12 text-center">
            <Activity
              size={28}
              className="mx-auto text-[#A58A64]"
            />

            <h3 className="mt-4 font-serif text-xl text-[#171717]">
              No matching events
            </h3>

            <p className="mt-2 text-xs text-[#77736C]">
              Try changing your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {visibleEvents.map((event) => (
              <AuditEventCard
                key={event.id}
                event={event}
                onOpen={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#D8D6D0] pt-5">
          <p className="text-[10px] text-[#77736C]">
            Page {currentPage} of {totalPages}
            {" · "}
            {totalRecords.toLocaleString("en-IN")} total records
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="border border-[#D8D6D0] bg-white px-4 py-2 text-[9px] uppercase tracking-widest text-[#55514A] disabled:opacity-40"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="border border-[#171717] bg-[#171717] px-4 py-2 text-[9px] uppercase tracking-widest text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selectedEvent && (
        <AuditEventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onOpenActor={onOpenActor}
          onOpenEntity={onOpenEntity}
        />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  warning = false,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  warning?: boolean;
}) {
  return (
    <div className="border border-[#D8D6D0] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className={warning ? "text-[#9A5147]" : "text-[#A58A64]"}>
          {icon}
        </span>
      </div>

      <p className="mt-5 font-serif text-3xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full border border-[#D8D6D0] bg-white px-3 text-xs text-[#55514A] outline-none focus:border-[#A58A64]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AuditEventCard({
  event,
  onOpen,
}: {
  event: AdminAuditEvent;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full border border-[#D8D6D0] bg-white p-5 text-left transition-colors hover:border-[#A58A64] md:p-6"
    >
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
            {event.severity === "Critical" ? (
              <ShieldAlert size={17} />
            ) : event.category === "Authentication" ? (
              <LockKeyhole size={17} />
            ) : (
              <Activity size={17} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                {event.eventReference}
              </span>

              <span
                className={`px-2 py-1 text-[8px] uppercase tracking-widest ${severityClass(event.severity)}`}
              >
                {event.severity}
              </span>

              <span
                className={`px-2 py-1 text-[8px] uppercase tracking-widest ${outcomeClass(event.outcome)}`}
              >
                {event.outcome}
              </span>
            </div>

            <h3 className="mt-3 break-words font-serif text-xl text-[#171717]">
              {event.action}
            </h3>

            <p className="mt-2 max-w-3xl text-xs leading-6 text-[#77736C]">
              {event.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-[#99958D]">
              <span>{event.category}</span>

              {event.entityReference && (
                <span>
                  {event.entityType}: {event.entityReference}
                </span>
              )}

              <span>{event.actorRole}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#E5E2DC] pt-4 xl:border-0 xl:pt-0">
          <div className="xl:text-right">
            <p className="text-xs text-[#55514A]">
              {event.actorName}
            </p>

            <p className="mt-2 font-mono text-[9px] text-[#99958D]">
              {formatDateTime(event.occurredAt)}
            </p>
          </div>

          <ArrowUpRight
            size={16}
            className="text-[#A58A64]"
          />
        </div>
      </div>
    </button>
  );
}

function AuditEventDetail({
  event,
  onClose,
  onOpenActor,
  onOpenEntity,
}: {
  event: AdminAuditEvent;
  onClose: () => void;
  onOpenActor?: (actorId: string) => void;
  onOpenEntity?: (
    entityType: string,
    entityReference: string
  ) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/40"
      role="presentation"
      onMouseDown={(mouseEvent) => {
        if (mouseEvent.target === mouseEvent.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        className="h-full w-full max-w-2xl overflow-y-auto bg-[#F7F5F0] shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6D0] bg-[#F7F5F0] px-6 py-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              Audit Event Details
            </p>

            <h2
              id="audit-detail-title"
              className="mt-2 font-serif text-2xl text-[#171717]"
            >
              Event Record
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            className="border border-[#D8D6D0] bg-white p-2 text-[#55514A]"
          >
            <X size={17} />
          </button>
        </header>

        <div className="space-y-7 p-6">
          <section className="border border-[#D8D6D0] bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] text-[#A58A64]">
                {event.eventReference}
              </span>

              <span
                className={`px-2 py-1 text-[8px] uppercase tracking-widest ${severityClass(event.severity)}`}
              >
                {event.severity}
              </span>

              <span
                className={`px-2 py-1 text-[8px] uppercase tracking-widest ${outcomeClass(event.outcome)}`}
              >
                {event.outcome}
              </span>
            </div>

            <h3 className="mt-4 font-serif text-2xl text-[#171717]">
              {event.action}
            </h3>

            <p className="mt-3 text-xs leading-7 text-[#77736C]">
              {event.description}
            </p>
          </section>

          <DetailSection title="Event Information">
            <DetailRow label="Category" value={event.category} />
            <DetailRow label="Event ID" value={event.id} />
            <DetailRow
              label="Occurred At"
              value={formatDateTime(event.occurredAt)}
            />

            <DetailRow
              label="Correlation ID"
              value={event.correlationId ?? "Not provided"}
            />

            <DetailRow
              label="Source"
              value={event.source ?? "Not provided"}
            />
          </DetailSection>

          <DetailSection title="Actor Information">
            <DetailRow label="Actor" value={event.actorName} />
            <DetailRow label="Role" value={event.actorRole} />
            <DetailRow
              label="Actor ID"
              value={event.actorId ?? "System / Unavailable"}
            />

            {event.actorId && onOpenActor && (
              <button
                type="button"
                onClick={() => onOpenActor(event.actorId!)}
                className="mt-3 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
              >
                <UserRound size={13} />
                Open Actor Record
              </button>
            )}
          </DetailSection>

          <DetailSection title="Related Entity">
            <DetailRow
              label="Entity Type"
              value={event.entityType ?? "Not linked"}
            />

            <DetailRow
              label="Entity Reference"
              value={event.entityReference ?? "Not linked"}
            />

            {event.entityType &&
              event.entityReference &&
              onOpenEntity && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenEntity(
                      event.entityType!,
                      event.entityReference!
                    )
                  }
                  className="mt-3 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
                >
                  <Eye size={13} />
                  Open Related Record
                </button>
              )}
          </DetailSection>

          {(event.ipAddress || event.reason) && (
            <DetailSection title="Additional Context">
              {event.ipAddress && (
                <DetailRow
                  label="IP Address"
                  value={event.ipAddress}
                />
              )}

              {event.reason && (
                <DetailRow
                  label="Reason"
                  value={event.reason}
                />
              )}
            </DetailSection>
          )}

          {event.changes && event.changes.length > 0 && (
            <DetailSection title="Recorded Field Changes">
              <div className="space-y-3">
                {event.changes.map((change, index) => (
                  <div
                    key={`${change.field}-${index}`}
                    className="border border-[#E5E2DC] p-4"
                  >
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                      {change.field}
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-[#99958D]">
                          Previous Value
                        </p>

                        <p className="mt-2 break-words text-xs text-[#77736C]">
                          {change.previousValue ?? "Not available"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-[#99958D]">
                          New Value
                        </p>

                        <p className="mt-2 break-words text-xs text-[#33312D]">
                          {change.newValue ?? "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}

          <div className="flex items-start gap-3 border border-[#D8D6D0] bg-white p-4">
            <LockKeyhole
              size={17}
              className="mt-0.5 shrink-0 text-[#A58A64]"
            />

            <p className="text-[10px] leading-6 text-[#77736C]">
              This interface does not provide audit record editing
              or deletion. Record integrity and retention must be
              enforced by the backend.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[#A58A64]">
        {title}
      </h3>

      <div className="border border-[#D8D6D0] bg-white p-5">
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 border-b border-[#EAE7E0] py-3 last:border-0 sm:flex-row">
      <span className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </span>

      <span className="break-all text-xs text-[#33312D] sm:max-w-[65%] sm:text-right">
        {value}
      </span>
    </div>
  );
}
