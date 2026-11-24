
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  KeyRound,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export type ApiKeyStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "REVOKED"
  | "PENDING_ROTATION";

export interface ApiKeyRecord {
  id: string;
  label: string;
  keyPrefix: string;
  ownerName: string;
  ownerType: "USER" | "SERVICE";
  environment: "PRODUCTION" | "STAGING" | "DEVELOPMENT";
  scopes: string[];
  status: ApiKeyStatus;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdBy: string;
}

interface AdminApiKeyManagementCenterProps {
  keys: ApiKeyRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (key: ApiKeyRecord) => void;
  onRequestRotation?: (keyId: string) => void;
  onRequestRevocation?: (keyId: string) => void;
}

const statusConfig: Record<
  ApiKeyStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  EXPIRING_SOON: {
    label: "Expiring soon",
    className: "bg-amber-50 text-amber-700",
    icon: <CalendarClock size={14} />,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-600",
    icon: <Clock3 size={14} />,
  },
  REVOKED: {
    label: "Revoked",
    className: "bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
  PENDING_ROTATION: {
    label: "Rotation pending",
    className: "bg-blue-50 text-blue-700",
    icon: <RefreshCw size={14} />,
  },
};

const filters = [
  "ALL",
  "ACTIVE",
  "EXPIRING_SOON",
  "PENDING_ROTATION",
  "EXPIRED",
  "REVOKED",
] as const;

type KeyFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({ status }: { status: ApiKeyStatus }) {
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
        {value}
      </p>

      <p className="mt-1 text-xs text-[#918c83]">{description}</p>
    </div>
  );
}

export default function AdminApiKeyManagementCenter({
  keys,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
  onRequestRotation,
  onRequestRevocation,
}: AdminApiKeyManagementCenterProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<KeyFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: keys.length,
      active: keys.filter((key) => key.status === "ACTIVE").length,
      expiring: keys.filter(
        (key) => key.status === "EXPIRING_SOON"
      ).length,
      pending: keys.filter(
        (key) => key.status === "PENDING_ROTATION"
      ).length,
      revoked: keys.filter(
        (key) => key.status === "REVOKED"
      ).length,
    }),
    [keys]
  );

  const filteredKeys = useMemo(() => {
    const query = search.trim().toLowerCase();

    return keys.filter((key) => {
      const matchesFilter =
        activeFilter === "ALL" || key.status === activeFilter;

      const searchable = [
        key.id,
        key.label,
        key.keyPrefix,
        key.ownerName,
        key.ownerType,
        key.environment,
        key.scopes.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [keys, search, activeFilter]);

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <KeyRound size={15} />
            Security operations
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            API Key Management
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review API credential metadata, access scopes, expiry, and
            rotation or revocation requests.
          </p>
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
          label="Total credentials"
          value={metrics.total}
          description="Records in supplied dataset"
          icon={<KeyRound size={19} />}
        />
        <MetricCard
          label="Active"
          value={metrics.active}
          description="Currently marked active"
          icon={<ShieldCheck size={19} />}
        />
        <MetricCard
          label="Expiring soon"
          value={metrics.expiring}
          description="Approaching recorded expiry"
          icon={<CalendarClock size={19} />}
        />
        <MetricCard
          label="Rotation pending"
          value={metrics.pending}
          description="Awaiting rotation workflow"
          icon={<RefreshCw size={19} />}
        />
        <MetricCard
          label="Revoked"
          value={metrics.revoked}
          description="Marked as revoked"
          icon={<ShieldAlert size={19} />}
        />
      </section>

      <section className="rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Credential inventory
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredKeys.length} matching credentials
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search key, owner, scope..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
                  ? "All credentials"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading API credentials...
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="p-12 text-center">
            <KeyRound size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No credentials found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Credential</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Environment</th>
                  <th className="px-5 py-3 font-medium">Scopes</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Expiry</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-[#fcfbf9]">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {key.label}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#918c83]">
                        {key.keyPrefix}••••••••
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {key.id}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-[#34322c]">
                        {key.ownerName}
                      </p>
                      <p className="mt-1 text-xs text-[#918c83]">
                        {key.ownerType === "SERVICE"
                          ? "Service account"
                          : "User account"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-[#77736c]">
                        {key.environment}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex max-w-[220px] flex-wrap gap-1.5">
                        {key.scopes.slice(0, 3).map((scope) => (
                          <span
                            key={scope}
                            className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]"
                          >
                            {scope}
                          </span>
                        ))}
                        {key.scopes.length > 3 && (
                          <span className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]">
                            +{key.scopes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={key.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {formatDate(key.expiresAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails?.(key)}
                          disabled={!onViewDetails}
                          title="View credential details"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onRequestRotation?.(key.id)}
                          disabled={
                            !onRequestRotation ||
                            key.status === "REVOKED" ||
                            key.status === "EXPIRED" ||
                            key.status === "PENDING_ROTATION"
                          }
                          title="Request key rotation"
                          className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <RefreshCw size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => onRequestRevocation?.(key.id)}
                          disabled={
                            !onRequestRevocation ||
                            key.status === "REVOKED" ||
                            key.status === "EXPIRED"
                          }
                          title="Request key revocation"
                          className="rounded-lg border border-[#e8e3da] p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <XCircle size={15} />
                        </button>
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
          <Shield size={19} className="mt-0.5 shrink-0 text-[#9b8358]" />
          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Credential security requirements
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Never return complete secret values through inventory APIs.
              </li>
              <li>
                • Store secrets in a secure secret-management system, not
                frontend state or browser storage.
              </li>
              <li>
                • Enforce least-privilege scopes and environment separation.
              </li>
              <li>
                • Rotation must support controlled replacement and safe
                retirement of the old credential.
              </li>
              <li>
                • Revocation must take effect server-side and be recorded in
                the audit trail.
              </li>
              <li>
                • Require explicit authorization and suitable approval for
                sensitive credential operations.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
