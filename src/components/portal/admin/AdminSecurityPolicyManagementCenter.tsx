
"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  LockKeyhole,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  XCircle,
} from "lucide-react";

export type SecurityPolicyStatus =
  | "ACTIVE"
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "REVIEW_REQUIRED"
  | "RETIRED";

export type SecurityPolicyCategory =
  | "AUTHENTICATION"
  | "PASSWORD"
  | "SESSION"
  | "ACCOUNT_PROTECTION"
  | "ACCESS_CONTROL"
  | "AUDIT"
  | "DATA_PROTECTION"
  | "OTHER";

export interface SecurityPolicyRecord {
  id: string;
  name: string;
  category: SecurityPolicyCategory;
  description: string;
  status: SecurityPolicyStatus;
  version: string;
  owner: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  updatedAt: string;
  enforcementMode: "ENFORCED" | "ADVISORY" | "NOT_CONFIGURED";
}

interface AdminSecurityPolicyManagementCenterProps {
  policies: SecurityPolicyRecord[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onViewDetails?: (policy: SecurityPolicyRecord) => void;
  onRequestCreate?: () => void;
  onRequestReview?: (policy: SecurityPolicyRecord) => void;
}

const statusConfig: Record<
  SecurityPolicyStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 size={14} />,
  },
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600",
    icon: <FileCheck2 size={14} />,
  },
  PENDING_APPROVAL: {
    label: "Pending approval",
    className: "bg-blue-50 text-blue-700",
    icon: <Clock3 size={14} />,
  },
  REVIEW_REQUIRED: {
    label: "Review required",
    className: "bg-amber-50 text-amber-700",
    icon: <AlertCircle size={14} />,
  },
  RETIRED: {
    label: "Retired",
    className: "bg-red-50 text-red-700",
    icon: <XCircle size={14} />,
  },
};

const categoryLabels: Record<SecurityPolicyCategory, string> = {
  AUTHENTICATION: "Authentication",
  PASSWORD: "Password security",
  SESSION: "Session management",
  ACCOUNT_PROTECTION: "Account protection",
  ACCESS_CONTROL: "Access control",
  AUDIT: "Audit and logging",
  DATA_PROTECTION: "Data protection",
  OTHER: "Other",
};

const filters = [
  "ALL",
  "ACTIVE",
  "DRAFT",
  "PENDING_APPROVAL",
  "REVIEW_REQUIRED",
  "RETIRED",
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
  status: SecurityPolicyStatus;
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

function EnforcementBadge({
  mode,
}: {
  mode: SecurityPolicyRecord["enforcementMode"];
}) {
  const styles = {
    ENFORCED: "bg-emerald-50 text-emerald-700",
    ADVISORY: "bg-amber-50 text-amber-700",
    NOT_CONFIGURED: "bg-slate-100 text-slate-600",
  };

  const labels = {
    ENFORCED: "Enforced",
    ADVISORY: "Advisory",
    NOT_CONFIGURED: "Not configured",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[mode]}`}
    >
      {labels[mode]}
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

export default function AdminSecurityPolicyManagementCenter({
  policies,
  loading = false,
  error,
  onRefresh,
  onViewDetails,
  onRequestCreate,
  onRequestReview,
}: AdminSecurityPolicyManagementCenterProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PolicyFilter>("ALL");
  const [categoryFilter, setCategoryFilter] =
    useState<SecurityPolicyCategory | "ALL">("ALL");

  const metrics = useMemo(
    () => ({
      total: policies.length,
      active: policies.filter((p) => p.status === "ACTIVE").length,
      pending: policies.filter(
        (p) => p.status === "PENDING_APPROVAL"
      ).length,
      reviewRequired: policies.filter(
        (p) => p.status === "REVIEW_REQUIRED"
      ).length,
      notConfigured: policies.filter(
        (p) => p.enforcementMode === "NOT_CONFIGURED"
      ).length,
    }),
    [policies]
  );

  const filteredPolicies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return policies.filter((policy) => {
      const matchesStatus =
        statusFilter === "ALL" || policy.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" ||
        policy.category === categoryFilter;

      const searchable = [
        policy.id,
        policy.name,
        policy.description,
        policy.owner,
        policy.version,
        policy.category,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        matchesCategory &&
        (!query || searchable.includes(query))
      );
    });
  }, [policies, search, statusFilter, categoryFilter]);

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Shield size={15} />
            Security governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Security Policy Management
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review security policy versions, ownership, enforcement
            status, and scheduled policy reviews.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || loading}
            className="rounded-lg border border-[#ded9cf] bg-white px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:opacity-50"
          >
            Refresh
          </button>

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
          icon={<FileCheck2 size={19} />}
        />
        <MetricCard
          label="Active"
          value={metrics.active}
          description="Marked active"
          icon={<CheckCircle2 size={19} />}
        />
        <MetricCard
          label="Pending approval"
          value={metrics.pending}
          description="Awaiting approval"
          icon={<Clock3 size={19} />}
        />
        <MetricCard
          label="Review required"
          value={metrics.reviewRequired}
          description="Requires policy review"
          icon={<AlertCircle size={19} />}
        />
        <MetricCard
          label="Not configured"
          value={metrics.notConfigured}
          description="No enforcement configured"
          icon={<ShieldAlert size={19} />}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="space-y-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-semibold text-[#292821]">
                Security policy register
              </h2>
              <p className="mt-1 text-xs text-[#918c83]">
                {filteredPolicies.length} matching policies
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
                placeholder="Search policy, owner, version..."
                className="w-full rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as PolicyFilter)
              }
              className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
            >
              {filters.map((filter) => (
                <option key={filter} value={filter}>
                  {filter === "ALL"
                    ? "All statuses"
                    : statusConfig[filter].label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as SecurityPolicyCategory | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-[#fcfbf9] px-3 py-2.5 text-sm outline-none focus:border-[#a58c5d]"
            >
              <option value="ALL">All categories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading security policies...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 text-center">
            <Shield size={30} className="mx-auto text-[#b3aa9b]" />
            <p className="mt-3 font-medium text-[#34322c]">
              No security policies found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Try changing the search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-left">
              <thead className="bg-[#faf9f6] text-xs uppercase tracking-wider text-[#918c83]">
                <tr>
                  <th className="px-5 py-3 font-medium">Policy</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Version</th>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Enforcement</th>
                  <th className="px-5 py-3 font-medium">Next review</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ede7]">
                {filteredPolicies.map((policy) => (
                  <tr
                    key={policy.id}
                    className="hover:bg-[#fcfbf9]"
                  >
                    <td className="max-w-[280px] px-5 py-4">
                      <p className="text-sm font-medium text-[#34322c]">
                        {policy.name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#918c83]">
                        {policy.description}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[#aaa397]">
                        {policy.id}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {categoryLabels[policy.category]}
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-[#77736c]">
                      v{policy.version}
                    </td>

                    <td className="px-5 py-4 text-sm text-[#77736c]">
                      {policy.owner}
                    </td>

                    <td className="px-5 py-4">
                      <EnforcementBadge mode={policy.enforcementMode} />
                    </td>

                    <td className="px-5 py-4 text-xs text-[#77736c]">
                      {formatDate(policy.nextReviewAt)}
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

                        {policy.status === "REVIEW_REQUIRED" && (
                          <button
                            type="button"
                            onClick={() => onRequestReview?.(policy)}
                            disabled={!onRequestReview}
                            title="Request policy review"
                            className="rounded-lg border border-[#e8e3da] p-2 text-[#9b8358] hover:bg-[#f7f5f0] disabled:opacity-40"
                          >
                            <FileCheck2 size={15} />
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
          <LockKeyhole
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />

          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Policy governance requirements
            </h3>

            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#77736c]">
              <li>
                • Keep policy definitions versioned and retain previous
                approved versions.
              </li>
              <li>
                • Require authorized review and approval before changing
                active security policies.
              </li>
              <li>
                • Distinguish documented policies from controls actually
                enforced by the application.
              </li>
              <li>
                • Record who proposed, reviewed, approved, and published
                every policy revision.
              </li>
              <li>
                • Do not treat a policy marked active as proof that its
                technical enforcement has been independently verified.
              </li>
              <li>
                • Enforce security controls on the backend and test them
                independently of this interface.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
