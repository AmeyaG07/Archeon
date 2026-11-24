
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Globe,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  Webhook,
  XCircle,
} from "lucide-react";

export type WebhookEndpointStatus =
  | "ACTIVE"
  | "PAUSED"
  | "PENDING_VERIFICATION"
  | "DISABLED"
  | "FAILED";

export interface WebhookEndpoint {
  id: string;
  name: string;
  destinationUrl: string;
  ownerName: string;
  environment: "PRODUCTION" | "STAGING" | "DEVELOPMENT";
  subscribedEvents: string[];
  status: WebhookEndpointStatus;
  createdAt: string;
  updatedAt: string;
  lastSuccessfulDeliveryAt?: string;
  lastFailedDeliveryAt?: string;
  failureCount: number;
  description?: string;
}

interface AdminWebhookEndpointManagementCenterProps {
  endpoints: WebhookEndpoint[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (endpoint: WebhookEndpoint) => void;
  onRequestCreate?: () => void;
  onRequestStatusChange?: (
    endpointId: string,
    nextStatus: "ACTIVE" | "PAUSED" | "DISABLED"
  ) => void;
}

const statusConfig: Record<
  WebhookEndpointStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  PAUSED: {
    label: "Paused",
    className: "bg-amber-50 text-amber-700",
    icon: <PauseCircle size={14} />,
  },
  PENDING_VERIFICATION: {
    label: "Verification pending",
    className: "bg-blue-50 text-blue-700",
    icon: <Clock3 size={14} />,
  },
  DISABLED: {
    label: "Disabled",
    className: "bg-slate-100 text-slate-600",
    icon: <XCircle size={14} />,
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
    icon: <AlertCircle size={14} />,
  },
};

const filters = [
  "ALL",
  "ACTIVE",
  "PAUSED",
  "PENDING_VERIFICATION",
  "DISABLED",
  "FAILED",
] as const;

type EndpointFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({
  status,
}: {
  status: WebhookEndpointStatus;
}) {
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

export default function AdminWebhookEndpointManagementCenter({
  endpoints,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
  onRequestCreate,
  onRequestStatusChange,
}: AdminWebhookEndpointManagementCenterProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<EndpointFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: endpoints.length,
      active: endpoints.filter(
        (endpoint) => endpoint.status === "ACTIVE"
      ).length,
      paused: endpoints.filter(
        (endpoint) => endpoint.status === "PAUSED"
      ).length,
      pending: endpoints.filter(
        (endpoint) =>
          endpoint.status === "PENDING_VERIFICATION"
      ).length,
      failed: endpoints.filter(
        (endpoint) => endpoint.status === "FAILED"
      ).length,
    }),
    [endpoints]
  );

  const filteredEndpoints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return endpoints.filter((endpoint) => {
      const matchesStatus =
        activeFilter === "ALL" ||
        endpoint.status === activeFilter;

      const searchable = [
        endpoint.id,
        endpoint.name,
        endpoint.destinationUrl,
        endpoint.ownerName,
        endpoint.environment,
        endpoint.subscribedEvents.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [endpoints, search, activeFilter]);

  function getAvailableAction(endpoint: WebhookEndpoint) {
    if (endpoint.status === "ACTIVE") return "PAUSED" as const;

    if (endpoint.status === "PAUSED") return "ACTIVE" as const;

    return null;
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Webhook size={15} />
            Integration operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Webhook Endpoint Management
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review registered destinations, subscribed event types,
            endpoint status, and delivery reliability indicators.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRequestCreate}
            disabled={!onRequestCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#403e35] disabled:opacity-50"
          >
            <Plus size={15} />
            Request endpoint
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total endpoints"
          value={metrics.total}
          description="Registered endpoint records"
          icon={<Webhook size={19} />}
        />
        <MetricCard
          label="Active"
          value={metrics.active}
          description="Marked as active"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="Paused"
          value={metrics.paused}
          description="Temporarily paused"
          icon={<PauseCircle size={19} />}
        />
        <MetricCard
          label="Pending verification"
          value={metrics.pending}
          description="Awaiting endpoint verification"
          icon={<Clock3 size={19} />}
        />
        <MetricCard
          label="Failed"
          value={metrics.failed}
          description="Marked as failed"
          icon={<AlertCircle size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Registered endpoints
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredEndpoints.length} matching endpoints
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
                placeholder="Search endpoint, owner, event type..."
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
                  ? "All endpoints"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading webhook endpoints...
          </div>
        ) : filteredEndpoints.length === 0 ? (
          <div className="p-12 text-center">
            <Webhook size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No webhook endpoints found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Endpoint</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Environment</th>
                  <th className="px-5 py-3 font-medium">Subscriptions</th>
                  <th className="px-5 py-3 font-medium">Failures</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredEndpoints.map((endpoint) => {
                  const availableAction =
                    getAvailableAction(endpoint);

                  return (
                    <tr
                      key={endpoint.id}
                      className="hover:bg-[#fcfbf9]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-[#34322c]">
                          {endpoint.name}
                        </p>

                        <div className="mt-1 flex max-w-[260px] items-center gap-1.5 text-xs text-[#918c83]">
                          <Globe size={12} className="shrink-0" />
                          <span className="truncate">
                            {endpoint.destinationUrl}
                          </span>
                        </div>

                        <p className="mt-1 font-mono text-xs text-[#aaa397]">
                          {endpoint.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {endpoint.ownerName}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736c]">
                        {endpoint.environment}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-[230px] flex-wrap gap-1.5">
                          {endpoint.subscribedEvents
                            .slice(0, 3)
                            .map((eventType) => (
                              <span
                                key={eventType}
                                className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]"
                              >
                                {eventType}
                              </span>
                            ))}

                          {endpoint.subscribedEvents.length > 3 && (
                            <span className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]">
                              +{endpoint.subscribedEvents.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {endpoint.failureCount.toLocaleString("en-IN")}
                        {endpoint.lastFailedDeliveryAt && (
                          <p className="mt-1 text-xs text-[#aaa397]">
                            Last failure:{" "}
                            {formatDate(endpoint.lastFailedDeliveryAt)}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={endpoint.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails?.(endpoint)}
                            disabled={!onViewDetails}
                            title="View endpoint details"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <Eye size={15} />
                          </button>

                          {availableAction && (
                            <button
                              type="button"
                              onClick={() =>
                                onRequestStatusChange?.(
                                  endpoint.id,
                                  availableAction
                                )
                              }
                              disabled={!onRequestStatusChange}
                              title={
                                availableAction === "PAUSED"
                                  ? "Request pause"
                                  : "Request activation"
                              }
                              className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:opacity-40"
                            >
                              {availableAction === "PAUSED" ? (
                                <PauseCircle size={15} />
                              ) : (
                                <PlayCircle size={15} />
                              )}
                            </button>
                          )}
                        </div>
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
          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Endpoint security requirements
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Validate endpoint ownership and destination authorization
                before activation.
              </li>
              <li>
                • Prevent server-side request forgery by blocking private,
                loopback, link-local, and otherwise prohibited destinations.
              </li>
              <li>
                • Validate DNS resolution and every redirect to prevent
                destination-validation bypasses.
              </li>
              <li>
                • Keep signing secrets in secure backend storage and never
                return them to the frontend.
              </li>
              <li>
                • Use HTTPS, signature verification, replay protection,
                and idempotent event handling.
              </li>
              <li>
                • Record endpoint creation, subscription changes, pause,
                activation, and deletion requests in the audit trail.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
