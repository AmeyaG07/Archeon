
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "CONTAINMENT_PENDING"
  | "CONTAINED"
  | "RESOLVED"
  | "CLOSED";

export type IncidentCategory =
  | "SECURITY"
  | "ACCESS_CONTROL"
  | "DATA"
  | "AVAILABILITY"
  | "INTEGRATION"
  | "OPERATIONAL"
  | "OTHER";

export type IncidentRecord = {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reportedBy: string;
  assignedTo?: string;
  affectedSystems: string[];
  reportedAt: string;
  updatedAt: string;
  resolvedAt?: string;
  referenceIds?: string[];
};

type IncidentDraft = {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  affectedSystems: string;
};

type Props = {
  incidents: IncidentRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenIncident?: (incident: IncidentRecord) => void;
  onCreateIncident?: (draft: IncidentDraft) => void;
  onUpdateStatus?: (
    incident: IncidentRecord,
    status: IncidentStatus
  ) => void;
  onAssignIncident?: (incident: IncidentRecord) => void;
};

const severityStyles: Record<IncidentSeverity, string> = {
  LOW: "bg-stone-100 text-stone-700",
  MEDIUM: "bg-amber-50 text-amber-800",
  HIGH: "bg-orange-50 text-orange-800",
  CRITICAL: "bg-red-50 text-red-700",
};

const statusStyles: Record<IncidentStatus, string> = {
  OPEN: "bg-blue-50 text-blue-700",
  INVESTIGATING: "bg-violet-50 text-violet-700",
  CONTAINMENT_PENDING: "bg-amber-50 text-amber-800",
  CONTAINED: "bg-cyan-50 text-cyan-800",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-stone-100 text-stone-600",
};

const statusOptions: IncidentStatus[] = [
  "OPEN",
  "INVESTIGATING",
  "CONTAINMENT_PENDING",
  "CONTAINED",
  "RESOLVED",
  "CLOSED",
];

function formatDate(value: string) {
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

const initialDraft: IncidentDraft = {
  title: "",
  description: "",
  category: "OPERATIONAL",
  severity: "MEDIUM",
  affectedSystems: "",
};

export default function AdminIncidentManagementCenter({
  incidents,
  loading = false,
  error,
  onRefresh,
  onOpenIncident,
  onCreateIncident,
  onUpdateStatus,
  onAssignIncident,
}: Props) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draft, setDraft] = useState<IncidentDraft>(initialDraft);
  const [formError, setFormError] = useState("");

  const metrics = useMemo(
    () => ({
      total: incidents.length,
      active: incidents.filter(
        (item) => !["RESOLVED", "CLOSED"].includes(item.status)
      ).length,
      critical: incidents.filter(
        (item) =>
          item.severity === "CRITICAL" &&
          !["RESOLVED", "CLOSED"].includes(item.status)
      ).length,
      resolved: incidents.filter((item) => item.status === "RESOLVED").length,
    }),
    [incidents]
  );

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return incidents.filter((incident) => {
      const searchable = [
        incident.id,
        incident.title,
        incident.description,
        incident.reportedBy,
        incident.assignedTo ?? "",
        incident.category,
        ...incident.affectedSystems,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (severityFilter === "ALL" ||
          incident.severity === severityFilter) &&
        (statusFilter === "ALL" || incident.status === statusFilter)
      );
    });
  }, [incidents, search, severityFilter, statusFilter]);

  function submitIncident(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!draft.title.trim() || !draft.description.trim()) {
      setFormError("Title and description are required.");
      return;
    }

    if (!onCreateIncident) {
      setFormError("Incident creation is not configured.");
      return;
    }

    onCreateIncident(draft);
    setDraft(initialDraft);
    setShowCreateForm(false);
  }

  function updateDraft<K extends keyof IncidentDraft>(
    key: K,
    value: IncidentDraft[K]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs text-stone-500">
              <ShieldAlert size={14} />
              Administration / Incident Management
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Incident Management
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Track reported incidents, investigations, assignments, and
              resolution records.
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
                setShowCreateForm(true);
              }}
              disabled={!onCreateIncident}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              <Plus size={15} />
              Report incident
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
            label="Total incidents"
            value={metrics.total}
            icon={<FileText size={18} />}
          />
          <Metric
            label="Active incidents"
            value={metrics.active}
            icon={<Clock3 size={18} />}
          />
          <Metric
            label="Active critical"
            value={metrics.critical}
            icon={<AlertCircle size={18} />}
          />
          <Metric
            label="Resolved incidents"
            value={metrics.resolved}
            icon={<CheckCircle2 size={18} />}
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
                placeholder="Search incidents..."
                className="w-full rounded-lg border border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-stone-500"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              aria-label="Filter by severity"
              className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
              className="rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-stone-500">
              Loading incidents...
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-12 text-center">
              <ShieldAlert
                size={28}
                className="mx-auto text-stone-300"
              />
              <p className="mt-3 text-sm font-medium">
                No matching incidents
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Adjust your filters or search terms.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredIncidents.map((incident) => (
                <article
                  key={incident.id}
                  className="p-4 transition hover:bg-stone-50/70 sm:p-5"
                >
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-stone-400">
                          {incident.id}
                        </span>
                        <Badge className={severityStyles[incident.severity]}>
                          {incident.severity}
                        </Badge>
                        <Badge className={statusStyles[incident.status]}>
                          {incident.status.replaceAll("_", " ")}
                        </Badge>
                      </div>

                      <h2 className="mt-2 text-sm font-semibold">
                        {incident.title}
                      </h2>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-500">
                        {incident.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500">
                        <span>Category: {incident.category}</span>
                        <span>Reported by: {incident.reportedBy}</span>
                        <span>Assigned to: {incident.assignedTo || "Unassigned"}</span>
                        <span>Reported: {formatDate(incident.reportedAt)}</span>
                      </div>

                      {incident.affectedSystems.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {incident.affectedSystems.map((system) => (
                            <span
                              key={system}
                              className="rounded-md border border-stone-200 bg-white px-2 py-1 text-[10px] text-stone-600"
                            >
                              {system}
                            </span>
                          ))}
                        </div>
                      )}

                      {incident.referenceIds &&
                        incident.referenceIds.length > 0 && (
                          <p className="mt-3 text-xs text-stone-500">
                            Related references:{" "}
                            {incident.referenceIds.join(", ")}
                          </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      {onAssignIncident && (
                        <button
                          type="button"
                          onClick={() => onAssignIncident(incident)}
                          className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100"
                        >
                          Assign
                        </button>
                      )}

                      {onUpdateStatus && (
                        <select
                          aria-label={`Update status for ${incident.id}`}
                          value={incident.status}
                          onChange={(event) =>
                            onUpdateStatus(
                              incident,
                              event.target.value as IncidentStatus
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
                        onClick={() => onOpenIncident?.(incident)}
                        disabled={!onOpenIncident}
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
            <ShieldAlert
              size={19}
              className="mt-0.5 shrink-0 text-amber-800"
            />
            <div>
              <h2 className="text-sm font-semibold">
                Incident handling safeguards
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                Status changes are administrative records, not proof of
                technical containment or resolution. Preserve relevant
                evidence, restrict access to sensitive incident details, and
                record investigation actions through an auditable workflow.
              </p>
            </div>
          </div>
        </section>
      </div>

      {showCreateForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateForm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-dialog-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="incident-dialog-title"
                  className="text-lg font-semibold"
                >
                  Report an incident
                </h2>
                <p className="mt-1 text-xs text-stone-500">
                  Enter the initial incident information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitIncident} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="incident-title"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Incident title
                </label>
                <input
                  id="incident-title"
                  required
                  value={draft.title}
                  onChange={(event) =>
                    updateDraft("title", event.target.value)
                  }
                  maxLength={160}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-stone-500"
                  placeholder="Short incident summary"
                />
              </div>

              <div>
                <label
                  htmlFor="incident-description"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Description
                </label>
                <textarea
                  id="incident-description"
                  required
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft("description", event.target.value)
                  }
                  rows={4}
                  maxLength={4000}
                  className="w-full resize-y rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-stone-500"
                  placeholder="Describe what was reported or observed..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="incident-category"
                    className="mb-1.5 block text-xs font-medium"
                  >
                    Category
                  </label>
                  <select
                    id="incident-category"
                    value={draft.category}
                    onChange={(event) =>
                      updateDraft(
                        "category",
                        event.target.value as IncidentCategory
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm"
                  >
                    {[
                      "SECURITY",
                      "ACCESS_CONTROL",
                      "DATA",
                      "AVAILABILITY",
                      "INTEGRATION",
                      "OPERATIONAL",
                      "OTHER",
                    ].map((category) => (
                      <option key={category} value={category}>
                        {category.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="incident-severity"
                    className="mb-1.5 block text-xs font-medium"
                  >
                    Initial severity
                  </label>
                  <select
                    id="incident-severity"
                    value={draft.severity}
                    onChange={(event) =>
                      updateDraft(
                        "severity",
                        event.target.value as IncidentSeverity
                      )
                    }
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm"
                  >
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((severity) => (
                      <option key={severity} value={severity}>
                        {severity}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="incident-systems"
                  className="mb-1.5 block text-xs font-medium"
                >
                  Affected systems
                </label>
                <input
                  id="incident-systems"
                  value={draft.affectedSystems}
                  onChange={(event) =>
                    updateDraft("affectedSystems", event.target.value)
                  }
                  className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-stone-500"
                  placeholder="Comma-separated system names"
                />
              </div>

              {formError && (
                <p role="alert" className="text-xs text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!onCreateIncident}
                  className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  Submit incident
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
