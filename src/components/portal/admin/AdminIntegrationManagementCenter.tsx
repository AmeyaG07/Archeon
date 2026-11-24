
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link2,
  RefreshCw,
  Search,
  ShieldCheck,
  Unplug,
  XCircle,
} from "lucide-react";

export type IntegrationStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "DEGRADED"
  | "PENDING_CONFIGURATION"
  | "DISABLED"
  | "UNKNOWN";

export type IntegrationEnvironment = "PRODUCTION" | "STAGING" | "DEVELOPMENT";

export type IntegrationRecord = {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  status: IntegrationStatus;
  environment: IntegrationEnvironment;
  enabled: boolean;
  lastCheckedAt?: string;
  lastSuccessfulSyncAt?: string;
  owner?: string;
  failureReason?: string;
  documentationUrl?: string;
};

export type IntegrationEvent = {
  id: string;
  integrationId: string;
  integrationName: string;
  eventType: "CONNECTION" | "AUTHENTICATION" | "SYNC" | "CONFIGURATION" | "ERROR";
  description: string;
  occurredAt: string;
  severity: "INFO" | "WARNING" | "ERROR";
};

type Props = {
  integrations: IntegrationRecord[];
  events: IntegrationEvent[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenIntegration?: (integration: IntegrationRecord) => void;
  onOpenDocumentation?: (integration: IntegrationRecord) => void;
  onRequestConfiguration?: (integration: IntegrationRecord) => void;
  onRequestDisable?: (integration: IntegrationRecord) => void;
};

const statusStyles: Record<IntegrationStatus, string> = {
  CONNECTED: "bg-emerald-50 text-emerald-700",
  DISCONNECTED: "bg-red-50 text-red-700",
  DEGRADED: "bg-amber-50 text-amber-800",
  PENDING_CONFIGURATION: "bg-blue-50 text-blue-700",
  DISABLED: "bg-stone-100 text-stone-600",
  UNKNOWN: "bg-stone-100 text-stone-600",
};

const eventStyles: Record<IntegrationEvent["severity"], string> = {
  INFO: "bg-blue-50 text-blue-700",
  WARNING: "bg-amber-50 text-amber-800",
  ERROR: "bg-red-50 text-red-700",
};

function formatDate(value?: string) {
  if (!value) return "Not recorded";

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
        <p className="text-xs text-stone-500">{label}</p>
        <span className="text-stone-400">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default function AdminIntegrationManagementCenter({
  integrations,
  events,
  loading = false,
  error,
  onRefresh,
  onOpenIntegration,
  onOpenDocumentation,
  onRequestConfiguration,
  onRequestDisable,
}: Props) {
  const [activeTab, setActiveTab] = useState<"integrations" | "events">(
    "integrations"
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [environmentFilter, setEnvironmentFilter] = useState("ALL");

  const metrics = useMemo(
    () => ({
      total: integrations.length,
      connected: integrations.filter(
        (item) => item.status === "CONNECTED"
      ).length,
      attention: integrations.filter(
        (item) =>
          item.status === "DEGRADED" ||
          item.status === "DISCONNECTED" ||
          item.status === "UNKNOWN"
      ).length,
      disabled: integrations.filter(
        (item) =>
          !item.enabled || item.status === "DISABLED"
      ).length,
    }),
    [integrations]
  );

  const filteredIntegrations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return integrations.filter((item) => {
      const searchable = [
        item.id,
        item.name,
        item.description,
        item.provider,
        item.category,
        item.owner ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "ALL" || item.status === statusFilter) &&
        (environmentFilter === "ALL" ||
          item.environment === environmentFilter)
      );
    });
  }, [integrations, search, statusFilter, environmentFilter]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((item) =>
      [
        item.id,
        item.integrationId,
        item.integrationName,
        item.eventType,
        item.description,
        item.severity,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [events, search]);

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs text-stone-500">
              <Link2 size={14} />
              Administration / Integrations
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Integration Management
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Monitor connected services, configuration status, and
              integration-related events.
            </p>
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
            label="Total integrations"
            value={metrics.total}
            icon={<Link2 size={18} />}
          />
          <Metric
            label="Connected"
            value={metrics.connected}
            icon={<CheckCircle2 size={18} />}
          />
          <Metric
            label="Needs attention"
            value={metrics.attention}
            icon={<AlertTriangle size={18} />}
          />
          <Metric
            label="Disabled"
            value={metrics.disabled}
            icon={<Unplug size={18} />}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("integrations")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "integrations"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Integrations
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "events"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Event history
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
                placeholder="Search integrations or events..."
                className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {activeTab === "integrations" ? (
            <>
              <div className="flex flex-wrap gap-3 border-b border-stone-100 bg-stone-50/60 p-4">
                <select
                  aria-label="Filter integration status"
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
                  aria-label="Filter environment"
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
                  {filteredIntegrations.length} of {integrations.length} records
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading integrations...
                </div>
              ) : filteredIntegrations.length === 0 ? (
                <div className="p-12 text-center">
                  <Link2 size={28} className="mx-auto text-stone-300" />
                  <p className="mt-3 text-sm font-medium">
                    No integrations found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredIntegrations.map((integration) => (
                    <article key={integration.id} className="p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">
                              {integration.id}
                            </span>
                            <Badge className={statusStyles[integration.status]}>
                              {integration.status.replaceAll("_", " ")}
                            </Badge>
                            <Badge className="bg-stone-100 text-stone-600">
                              {integration.environment}
                            </Badge>
                            <Badge
                              className={
                                integration.enabled
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-stone-100 text-stone-600"
                              }
                            >
                              {integration.enabled ? "ENABLED" : "DISABLED"}
                            </Badge>
                          </div>

                          <h2 className="mt-2 text-sm font-semibold">
                            {integration.name}
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-stone-500">
                            {integration.description}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                            <p>Provider: {integration.provider}</p>
                            <p>Category: {integration.category}</p>
                            <p>Owner: {integration.owner || "Not assigned"}</p>
                            <p>
                              Last checked: {formatDate(integration.lastCheckedAt)}
                            </p>
                            <p>
                              Last successful sync:{" "}
                              {formatDate(integration.lastSuccessfulSyncAt)}
                            </p>
                          </div>

                          {integration.failureReason && (
                            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                              {integration.failureReason}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {onRequestConfiguration &&
                            integration.status === "PENDING_CONFIGURATION" && (
                              <button
                                type="button"
                                onClick={() =>
                                  onRequestConfiguration(integration)
                                }
                                className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-50"
                              >
                                Request configuration
                              </button>
                            )}

                          {onRequestDisable && integration.enabled && (
                            <button
                              type="button"
                              onClick={() => onRequestDisable(integration)}
                              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Request disable
                            </button>
                          )}

                          {onOpenDocumentation &&
                            integration.documentationUrl && (
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenDocumentation(integration)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-50"
                              >
                                Documentation
                                <ExternalLink size={12} />
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => onOpenIntegration?.(integration)}
                            disabled={!onOpenIntegration}
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
            </>
          ) : (
            <div>
              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading event history...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  No integration events found.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredEvents.map((event) => (
                    <article
                      key={event.id}
                      className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-start sm:p-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-stone-400">
                            {event.id}
                          </span>
                          <Badge className={eventStyles[event.severity]}>
                            {event.severity}
                          </Badge>
                          <Badge className="bg-stone-100 text-stone-600">
                            {event.eventType}
                          </Badge>
                        </div>

                        <h3 className="mt-2 text-sm font-semibold">
                          {event.integrationName}
                        </h3>
                        <p className="mt-1 text-sm text-stone-500">
                          {event.description}
                        </p>
                        <p className="mt-2 text-xs text-stone-400">
                          Integration: {event.integrationId} ·{" "}
                          {formatDate(event.occurredAt)}
                        </p>
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
                Integration security safeguards
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                Store credentials in an approved secrets manager, never in
                browser code or integration records. Validate webhook
                signatures, restrict permissions, audit configuration
                changes, and isolate integration access by environment and
                authorised user.
              </p>
            </div>
          </div>
        </section>

        <p className="flex items-center gap-2 text-xs text-stone-400">
          <Clock3 size={13} />
          Connection status and sync timestamps must reflect verified
          monitoring data, not assumed availability.
        </p>
      </div>
    </main>
  );
}
