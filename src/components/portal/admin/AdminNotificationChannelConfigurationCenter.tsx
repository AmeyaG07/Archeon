
"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertTriangle,
  Settings2,
} from "lucide-react";

export type NotificationProviderChannel =
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "IN_APP";

export type NotificationProviderStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "DEGRADED"
  | "CONFIGURATION_REQUIRED"
  | "DISABLED";

export interface NotificationChannelConfiguration {
  id: string;
  channel: NotificationProviderChannel;
  providerName: string;
  displayName: string;
  status: NotificationProviderStatus;
  environment: "SANDBOX" | "PRODUCTION" | "NOT_CONFIGURED";
  senderIdentity?: string;
  lastHealthCheckAt?: string;
  lastSuccessfulDeliveryAt?: string;
  supportedFeatures: string[];
  configurationNotes?: string;
  updatedAt: string;
  updatedBy: string;
}

interface AdminNotificationChannelConfigurationCenterProps {
  configurations: NotificationChannelConfiguration[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (configuration: NotificationChannelConfiguration) => void;
  onConfigure?: (configuration: NotificationChannelConfiguration) => void;
  onRunHealthCheck?: (configurationId: string) => void;
}

const statusStyles: Record<NotificationProviderStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-700",
  DEGRADED: "bg-amber-50 text-amber-800",
  CONFIGURATION_REQUIRED: "bg-orange-50 text-orange-800",
  DISABLED: "bg-red-50 text-red-700",
};

const channelStyles: Record<NotificationProviderChannel, string> = {
  EMAIL: "bg-blue-50 text-blue-700",
  SMS: "bg-violet-50 text-violet-700",
  WHATSAPP: "bg-emerald-50 text-emerald-700",
  IN_APP: "bg-slate-100 text-slate-700",
};

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ChannelIcon({
  channel,
}: {
  channel: NotificationProviderChannel;
}) {
  switch (channel) {
    case "EMAIL":
      return <Mail size={17} />;
    case "SMS":
      return <Smartphone size={17} />;
    case "WHATSAPP":
      return <MessageSquare size={17} />;
    case "IN_APP":
      return <Bell size={17} />;
  }
}

export default function AdminNotificationChannelConfigurationCenter({
  configurations,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
  onConfigure,
  onRunHealthCheck,
}: AdminNotificationChannelConfigurationCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    NotificationProviderStatus | "ALL"
  >("ALL");
  const [channelFilter, setChannelFilter] = useState<
    NotificationProviderChannel | "ALL"
  >("ALL");

  const filteredConfigurations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return configurations.filter((item) => {
      const searchable = [
        item.id,
        item.channel,
        item.providerName,
        item.displayName,
        item.environment,
        item.senderIdentity ?? "",
        item.updatedBy,
        item.configurationNotes ?? "",
        ...item.supportedFeatures,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "ALL" || item.status === statusFilter) &&
        (channelFilter === "ALL" || item.channel === channelFilter)
      );
    });
  }, [configurations, search, statusFilter, channelFilter]);

  const counts = useMemo(
    () => ({
      active: configurations.filter(
        (item) => item.status === "ACTIVE"
      ).length,
      degraded: configurations.filter(
        (item) => item.status === "DEGRADED"
      ).length,
      inactive: configurations.filter(
        (item) =>
          item.status === "INACTIVE" ||
          item.status === "DISABLED"
      ).length,
      needsConfiguration: configurations.filter(
        (item) => item.status === "CONFIGURATION_REQUIRED"
      ).length,
    }),
    [configurations]
  );

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Settings2 size={15} />
            Communication infrastructure
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Notification Channel Configuration
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Inspect notification providers, environment configuration,
            channel capabilities, and operational health.
          </p>
        </div>

        </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Active channels",
            value: counts.active,
            color: "text-emerald-700",
          },
          {
            label: "Degraded channels",
            value: counts.degraded,
            color: "text-amber-700",
          },
          {
            label: "Inactive / disabled",
            value: counts.inactive,
            color: "text-slate-700",
          },
          {
            label: "Configuration required",
            value: counts.needsConfiguration,
            color: "text-orange-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#e9e5dd] bg-white p-5"
          >
            <p className="text-sm text-[#77736c]">{item.label}</p>
            <p className={`mt-3 text-3xl font-semibold ${item.color}`}>
              {item.value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div>
            <h2 className="font-semibold text-[#292821]">
              Provider registry
            </h2>
            <p className="mt-1 text-xs text-[#918c83]">
              Provider status shown here reflects the supplied
              configuration records, not a live connection test.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search provider or channel..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(
                  event.target.value as
                    | NotificationProviderChannel
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All channels</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="IN_APP">In-app</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | NotificationProviderStatus
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DEGRADED">Degraded</option>
              <option value="CONFIGURATION_REQUIRED">
                Configuration required
              </option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading provider configurations...
          </div>
        ) : filteredConfigurations.length === 0 ? (
          <div className="p-12 text-center">
            <Settings2
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No matching configurations
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Adjust your filters or check the configuration source.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {filteredConfigurations.map((configuration) => (
              <article
                key={configuration.id}
                className="space-y-4 p-5"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f2eb] text-[#9b8358]">
                      <ChannelIcon channel={configuration.channel} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[#34322c]">
                          {configuration.displayName}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${channelStyles[configuration.channel]}`}
                        >
                          {configuration.channel}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[configuration.status]}`}
                        >
                          {configuration.status.replaceAll("_", " ")}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#77736c]">
                        Provider: {configuration.providerName}
                      </p>

                      <p className="mt-1 text-xs text-[#918c83]">
                        Configuration ID: {configuration.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onViewDetails?.(configuration)}
                      disabled={!onViewDetails}
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      View details
                    </button>

                    <button
                      type="button"
                      onClick={() => onConfigure?.(configuration)}
                      disabled={!onConfigure}
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      Configure
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onRunHealthCheck?.(configuration.id)
                      }
                      disabled={!onRunHealthCheck}
                      className="rounded-lg bg-[#292821] px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
                    >
                      Run health check
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Environment
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {configuration.environment.replaceAll("_", " ")}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Sender identity
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-[#34322c]">
                      {configuration.senderIdentity || "Not configured"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Last health check
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(configuration.lastHealthCheckAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Last successful delivery
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(
                        configuration.lastSuccessfulDeliveryAt
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                    Supported features
                  </p>

                  {configuration.supportedFeatures.length === 0 ? (
                    <p className="text-xs text-[#918c83]">
                      No capabilities supplied.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {configuration.supportedFeatures.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-md border border-[#eeeae3] bg-white px-2.5 py-1.5 text-xs text-[#666157]"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {configuration.configurationNotes && (
                  <p className="rounded-lg bg-[#faf9f6] p-3 text-xs leading-5 text-[#77736c]">
                    {configuration.configurationNotes}
                  </p>
                )}

                <p className="text-xs text-[#918c83]">
                  Last updated {formatDate(configuration.updatedAt)}
                  {" · "}
                  By {configuration.updatedBy}
                </p>
              </article>
            ))}
          </div>
        )}

        <footer className="border-t border-[#eeeae3] bg-[#faf9f6] px-5 py-3 text-xs text-[#918c83]">
          Showing {filteredConfigurations.length.toLocaleString("en-IN")} of{" "}
          {configurations.length.toLocaleString("en-IN")} supplied configurations.
        </footer>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
        />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Provider credentials must never reach the browser
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Store provider secrets in a secure backend secret store.
            Never return API keys, access tokens, passwords, or
            private configuration values through this component&apos;s
            data model. Health checks must run server-side and return
            only safe diagnostic information.
          </p>
        </div>
      </section>

      <section className="flex gap-3 rounded-xl border border-[#e9e5dd] bg-white p-4">
        <ShieldCheck
          size={19}
          className="mt-0.5 shrink-0 text-[#9b8358]"
        />
        <div>
          <h3 className="text-sm font-semibold text-[#34322c]">
            Production activation controls
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#77736c]">
            Provider activation should require authorized backend
            operations, configuration validation, environment
            separation, audit logging, and a controlled deployment
            process. A successful health check alone is not
            authorization to send customer notifications.
          </p>
        </div>
      </section>
    </main>
  );
}
