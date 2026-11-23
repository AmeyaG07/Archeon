
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  Server,
  X,
} from "lucide-react";

export type MaintenanceStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export type MaintenanceImpact =
  | "NO_EXPECTED_DOWNTIME"
  | "DEGRADED_SERVICE"
  | "PARTIAL_OUTAGE"
  | "FULL_OUTAGE"
  | "UNKNOWN";

export type MaintenanceRecord = {
  id: string;
  title: string;
  description: string;
  affectedServices: string[];
  impact: MaintenanceImpact;
  status: MaintenanceStatus;
  requestedBy: string;
  approvedBy?: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  notificationRequired: boolean;
  notificationStatus?: "NOT_SENT" | "SENT" | "FAILED" | "NOT_REQUIRED";
  updatedAt: string;
};

export type MaintenanceDraft = {
  title: string;
  description: string;
  affectedServices: string;
  impact: MaintenanceImpact;
  scheduledStart: string;
  scheduledEnd: string;
  notificationRequired: boolean;
};

type Props = {
  records: MaintenanceRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenRecord?: (record: MaintenanceRecord) => void;
  onCreateRecord?: (draft: MaintenanceDraft) => void;
  onReviewRecord?: (
    record: MaintenanceRecord,
    decision: "APPROVE" | "REJECT"
  ) => void;
  onUpdateStatus?: (
    record: MaintenanceRecord,
    status: MaintenanceStatus
  ) => void;
};

const statusStyles: Record<MaintenanceStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-600",
  PENDING_APPROVAL: "bg-amber-50 text-amber-800",
  APPROVED: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "bg-orange-50 text-orange-800",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-stone-100 text-stone-600",
  FAILED: "bg-red-50 text-red-700",
};

const impactStyles: Record<MaintenanceImpact, string> = {
  NO_EXPECTED_DOWNTIME: "bg-emerald-50 text-emerald-700",
  DEGRADED_SERVICE: "bg-amber-50 text-amber-800",
  PARTIAL_OUTAGE: "bg-orange-50 text-orange-800",
  FULL_OUTAGE: "bg-red-50 text-red-700",
  UNKNOWN: "bg-stone-100 text-stone-600",
};

const statusOptions: MaintenanceStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
];

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

const emptyDraft: MaintenanceDraft = {
  title: "",
  description: "",
  affectedServices: "",
  impact: "UNKNOWN",
  scheduledStart: "",
  scheduledEnd: "",
  notificationRequired: true,
};

export default function AdminMaintenanceManagementCenter({
  records,
  loading = false,
  error,
  onRefresh,
  onOpenRecord,
  onCreateRecord,
  onReviewRecord,
  onUpdateStatus,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [impactFilter, setImpactFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<MaintenanceDraft>(emptyDraft);
  const [formError, setFormError] = useState("");

  const metrics = useMemo(
    () => ({
      total: records.length,
      awaitingApproval: records.filter(
        (item) => item.status === "PENDING_APPROVAL"
      ).length,
      upcoming: records.filter((item) => item.status === "SCHEDULED").length,
      inProgress: records.filter(
        (item) => item.status === "IN_PROGRESS"
      ).length,
    }),
    [records]
  );

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const searchable = [
        record.id,
        record.title,
        record.description,
        record.requestedBy,
        record.approvedBy ?? "",
        ...record.affectedServices,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "ALL" || record.status === statusFilter) &&
        (impactFilter === "ALL" || record.impact === impactFilter)
      );
    });
  }, [records, search, statusFilter, impactFilter]);

  function updateDraft<K extends keyof MaintenanceDraft>(
    key: K,
    value: MaintenanceDraft[K]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submitDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!draft.title.trim() || !draft.description.trim()) {
      setFormError("Title and description are required.");
      return;
    }

    if (!draft.scheduledStart || !draft.scheduledEnd) {
      setFormError("Both scheduled dates are required.");
      return;
    }

    const start = new Date(draft.scheduledStart).getTime();
    const end = new Date(draft.scheduledEnd).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      setFormError("The end time must be later than the start time.");
      return;
    }

    if (!onCreateRecord) {
      setFormError("Maintenance creation is not configured.");
      return;
    }

    onCreateRecord(draft);
    setDraft(emptyDraft);
    setShowForm(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs text-stone-500">
              <Server size={14} />
              Administration / Maintenance
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Maintenance Management
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Coordinate planned maintenance, review service impact, and
              monitor execution records.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={!onRefresh || loading}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setFormError("");
                setShowForm(true);
              }}
              disabled={!onCreateRecord}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              <Plus size={15} />
              Plan maintenance
            </button>
          </div>
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
            label="Total records"
            value={metrics.total}
            icon={<CalendarClock size={18} />}
          />
          <Metric
            label="Awaiting approval"
            value={metrics.awaitingApproval}
            icon={<Clock3 size={18} />}
          />
          <Metric
            label="Scheduled"
            value={metrics.upcoming}
            icon={<CalendarClock size={18} />}
          />
          <Metric
            label="In progress"
            value={metrics.inProgress}
            icon={<RefreshCw size={18} />}
          />
        </section>

        <section className="rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search maintenance records..."
                className="w-full rounded-lg border border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-stone-500"
              />
            </div>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by service impact"
              value={impactFilter}
              onChange={(event) => setImpactFilter(event.target.value)}
              className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All impact levels</option>
              {Object.keys(impactStyles).map((impact) => (
                <option key={impact} value={impact}>
                  {impact.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-stone-500">
              Loading maintenance records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarClock
                size={28}
                className="mx-auto text-stone-300"
              />
              <p className="mt-3 text-sm font-medium">
                No maintenance records found
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Try changing the filters or search terms.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredRecords.map((record) => (
                <article key={record.id} className="p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-stone-400">
                          {record.id}
                        </span>
                        <Badge className={statusStyles[record.status]}>
                          {record.status.replaceAll("_", " ")}
                        </Badge>
                        <Badge className={impactStyles[record.impact]}>
                          {record.impact.replaceAll("_", " ")}
                        </Badge>
                      </div>

                      <h2 className="mt-2 text-sm font-semibold">
                        {record.title}
                      </h2>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-500">
                        {record.description}
                      </p>

                      <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-stone-700">
                            Scheduled start:
                          </span>{" "}
                          {formatDate(record.scheduledStart)}
                        </p>
                        <p>
                          <span className="font-medium text-stone-700">
                            Scheduled end:
                          </span>{" "}
                          {formatDate(record.scheduledEnd)}
                        </p>
                        <p>Requested by: {record.requestedBy}</p>
                        <p>Approved by: {record.approvedBy || "Not recorded"}</p>
                        <p>
                          Notification:{" "}
                          {record.notificationStatus || "Not recorded"}
                        </p>
                      </div>

                      {record.affectedServices.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {record.affectedServices.map((service) => (
                            <span
                              key={service}
                              className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] text-stone-600"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      )}

                      {record.actualStart && (
                        <p className="mt-3 text-xs text-stone-500">
                          Actual start: {formatDate(record.actualStart)}
                        </p>
                      )}
                      {record.actualEnd && (
                        <p className="mt-1 text-xs text-stone-500">
                          Actual end: {formatDate(record.actualEnd)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      {record.status === "PENDING_APPROVAL" &&
                        onReviewRecord && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                onReviewRecord(record, "REJECT")
                              }
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onReviewRecord(record, "APPROVE")
                              }
                              className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700"
                            >
                              Approve
                            </button>
                          </>
                        )}

                      {onUpdateStatus && (
                        <select
                          aria-label={`Update status for ${record.id}`}
                          value={record.status}
                          onChange={(event) =>
                            onUpdateStatus(
                              record,
                              event.target.value as MaintenanceStatus
                            )
                          }
                          className="max-w-44 rounded-lg border border-stone-200 bg-white px-2 py-2 text-xs"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenRecord?.(record)}
                        disabled={!onOpenRecord}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100 disabled:opacity-50"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0 text-amber-800"
            />
            <div>
              <h2 className="text-sm font-semibold">
                Maintenance execution safeguards
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                Approval and scheduling do not execute maintenance. Confirm
                service ownership, impact, recovery arrangements, and
                communication requirements before any infrastructure action.
                Record actual start and end times from verified execution
                results.
              </p>
            </div>
          </div>
        </section>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-dialog-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="maintenance-dialog-title"
                  className="text-lg font-semibold"
                >
                  Plan maintenance
                </h2>
                <p className="mt-1 text-xs text-stone-500">
                  Create a maintenance request for review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitDraft} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="maintenance-title"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Maintenance title
                </label>
                <input
                  id="maintenance-title"
                  required
                  maxLength={160}
                  value={draft.title}
                  onChange={(event) =>
                    updateDraft("title", event.target.value)
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="maintenance-description"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Description
                </label>
                <textarea
                  id="maintenance-description"
                  required
                  rows={3}
                  maxLength={4000}
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft("description", event.target.value)
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="maintenance-services"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Affected services
                </label>
                <input
                  id="maintenance-services"
                  value={draft.affectedServices}
                  onChange={(event) =>
                    updateDraft("affectedServices", event.target.value)
                  }
                  placeholder="Comma-separated service names"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="maintenance-impact"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Expected impact
                </label>
                <select
                  id="maintenance-impact"
                  value={draft.impact}
                  onChange={(event) =>
                    updateDraft(
                      "impact",
                      event.target.value as MaintenanceImpact
                    )
                  }
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm"
                >
                  {Object.keys(impactStyles).map((impact) => (
                    <option key={impact} value={impact}>
                      {impact.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="maintenance-start"
                    className="mb-1.5 block text-xs font-medium"
                  >
                    Scheduled start
                  </label>
                  <input
                    id="maintenance-start"
                    type="datetime-local"
                    required
                    value={draft.scheduledStart}
                    onChange={(event) =>
                      updateDraft("scheduledStart", event.target.value)
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="maintenance-end"
                    className="mb-1.5 block text-xs font-medium"
                  >
                    Scheduled end
                  </label>
                  <input
                    id="maintenance-end"
                    type="datetime-local"
                    required
                    value={draft.scheduledEnd}
                    onChange={(event) =>
                      updateDraft("scheduledEnd", event.target.value)
                    }
                    className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={draft.notificationRequired}
                  onChange={(event) =>
                    updateDraft("notificationRequired", event.target.checked)
                  }
                  className="mt-0.5"
                />
                A notification is required for this maintenance request.
              </label>

              {formError && (
                <p role="alert" className="text-xs text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!onCreateRecord}
                  className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  Submit request
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
