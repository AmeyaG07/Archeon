
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  KeyRound,
  LockKeyhole,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  XCircle,
} from "lucide-react";

export type ApiAccessPolicyStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "EXPIRED"
  | "PENDING_REVIEW"
  | "REVOKED";

export interface ApiAccessPolicy {
  id: string;
  name: string;
  principalName: string;
  principalType: "SERVICE_ACCOUNT" | "INTEGRATION" | "USER";
  environment: "PRODUCTION" | "STAGING" | "DEVELOPMENT";
  scopes: string[];
  status: ApiAccessPolicyStatus;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdBy: string;
  description?: string;
}

interface AdminApiAccessPolicyCenterProps {
  policies: ApiAccessPolicy[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (policy: ApiAccessPolicy) => void;
  onRequestCreate?: () => void;
  onRequestStatusChange?: (
    policyId: string,
    nextStatus: "ACTIVE" | "SUSPENDED" | "REVOKED"
  ) => void;
}

const statusConfig: Record<
  ApiAccessPolicyStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-amber-50 text-amber-700",
    icon: <ShieldAlert size={14} />,
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-slate-100 text-slate-600",
    icon: <Clock3 size={14} />,
  },
  PENDING_REVIEW: {
    label: "Pending review",
    className: "bg-blue-50 text-blue-700",
    icon: <AlertCircle size={14} />,
  },
  REVOKED: {
    label: "Revoked",
    className: "bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
};

const filters = [
  "ALL",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "PENDING_REVIEW",
  "REVOKED",
] as const;

type PolicyFilter = (typeof filters)[number];

function formatDate(value?: string) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

function StatusBadge({
  status,
}: {
  status: ApiAccessPolicyStatus;
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
  icon,
  description,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  description: string;
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

export default function AdminApiAccessPolicyCenter({
  policies,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
  onRequestCreate,
  onRequestStatusChange,
}: AdminApiAccessPolicyCenterProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<PolicyFilter>("ALL");

  const metrics = useMemo(
    () => ({
      total: policies.length,
      active: policies.filter((p) => p.status === "ACTIVE").length,
      suspended: policies.filter((p) => p.status === "SUSPENDED").length,
      pending: policies.filter((p) => p.status === "PENDING_REVIEW").length,
      revoked: policies.filter((p) => p.status === "REVOKED").length,
    }),
    [policies]
  );

  const filteredPolicies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return policies.filter((policy) => {
      const matchesStatus =
        activeFilter === "ALL" || policy.status === activeFilter;

      const searchable = [
        policy.id,
        policy.name,
        policy.principalName,
        policy.principalType,
        policy.environment,
        policy.scopes.join(" "),
        policy.createdBy,
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [policies, search, activeFilter]);

  function getAvailableAction(policy: ApiAccessPolicy) {
    if (policy.status === "ACTIVE") return "SUSPENDED" as const;
    if (policy.status === "SUSPENDED") return "ACTIVE" as const;
    return null;
  }

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <LockKeyhole size={15} />
            Security and access governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            API Access Policies
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review API principals, permission scopes, environments,
            policy status, and expiration records.
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
            Request policy
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
          label="Total policies"
          value={metrics.total}
          description="Policy records supplied"
          icon={<KeyRound size={19} />}
        />
        <MetricCard
          label="Active"
          value={metrics.active}
          description="Marked active"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="Suspended"
          value={metrics.suspended}
          description="Temporarily restricted"
          icon={<ShieldAlert size={19} />}
        />
        <MetricCard
          label="Pending review"
          value={metrics.pending}
          description="Awaiting review"
          icon={<Clock3 size={19} />}
        />
        <MetricCard
          label="Revoked"
          value={metrics.revoked}
          description="Marked revoked"
          icon={<XCircle size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Policy register
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredPolicies.length} matching records
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
                placeholder="Search policy, principal, scope..."
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
                  ? "All policies"
                  : statusConfig[filter].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading API access policies...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No policies found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try another search or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Policy</th>
                  <th className="px-5 py-3 font-medium">Principal</th>
                  <th className="px-5 py-3 font-medium">Environment</th>
                  <th className="px-5 py-3 font-medium">Scopes</th>
                  <th className="px-5 py-3 font-medium">Expires</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredPolicies.map((policy) => {
                  const availableAction =
                    getAvailableAction(policy);

                  return (
                    <tr
                      key={policy.id}
                      className="hover:bg-[#fcfbf9]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-[#34322c]">
                          {policy.name}
                        </p>
                        <p className="mt-1 font-mono text-xs text-[#aaa397]">
                          {policy.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-[#34322c]">
                          {policy.principalName}
                        </p>
                        <p className="mt-1 text-xs text-[#918c83]">
                          {policy.principalType.replaceAll("_", " ")}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736c]">
                        {policy.environment}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-[240px] flex-wrap gap-1.5">
                          {policy.scopes.slice(0, 3).map((scope) => (
                            <span
                              key={scope}
                              className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]"
                            >
                              {scope}
                            </span>
                          ))}
                          {policy.scopes.length > 3 && (
                            <span className="rounded-md bg-[#f3f1ec] px-2 py-1 text-xs text-[#68645c]">
                              +{policy.scopes.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#77736c]">
                        {formatDate(policy.expiresAt)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={policy.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewDetails?.(policy)}
                            disabled={!onViewDetails}
                            title="View policy details"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#77736c] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <Eye size={15} />
                          </button>

                          {availableAction && (
                            <button
                              type="button"
                              onClick={() =>
                                onRequestStatusChange?.(
                                  policy.id,
                                  availableAction
                                )
                              }
                              disabled={!onRequestStatusChange}
                              title={
                                availableAction === "SUSPENDED"
                                  ? "Request suspension"
                                  : "Request activation"
                              }
                              className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:opacity-40"
                            >
                              {availableAction === "SUSPENDED" ? (
                                <LockKeyhole size={15} />
                              ) : (
                                <CheckCircle2 size={15} />
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
          <Shield size={19} className="mt-0.5 shrink-0 text-[#9b8358]" />
          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Access governance controls
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Apply least-privilege scopes and environment-specific
                access restrictions.
              </li>
              <li>
                • Enforce expiration and revocation on the backend, not
                just in the interface.
              </li>
              <li>
                • Require authorization and audit records for policy
                changes.
              </li>
              <li>
                • Enforce separation of duties for sensitive access
                approvals.
              </li>
              <li>
                • Never expose API secrets, bearer tokens, or signing
                credentials in policy responses.
              </li>
              <li>
                • Use stable principal IDs rather than display names for
                authorization decisions.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
