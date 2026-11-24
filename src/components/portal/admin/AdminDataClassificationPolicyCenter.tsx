
"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Shield,
  LockKeyhole,
  Eye,
  FileText,
  AlertTriangle,
} from "lucide-react";

export type DataClassificationLevel =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED";

export interface DataClassificationPolicy {
  id: string;
  name: string;
  level: DataClassificationLevel;
  description: string;
  handlingRequirements: string[];
  retentionDays?: number;
  encryptionRequired: boolean;
  approvalRequiredForExport: boolean;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  version: number;
  updatedAt: string;
  updatedBy: string;
}

interface AdminDataClassificationPolicyCenterProps {
  policies: DataClassificationPolicy[];
  loading?: boolean;
  error?: string | null;
  onCreate?: () => void;
  onEdit?: (policy: DataClassificationPolicy) => void;
  onRetire?: (policy: DataClassificationPolicy) => void;
  onRefresh?: () => void;
}

const levelStyles: Record<
  DataClassificationLevel,
  { label: string; className: string }
> = {
  PUBLIC: {
    label: "Public",
    className: "bg-slate-100 text-slate-700",
  },
  INTERNAL: {
    label: "Internal",
    className: "bg-blue-50 text-blue-700",
  },
  CONFIDENTIAL: {
    label: "Confidential",
    className: "bg-amber-50 text-amber-800",
  },
  RESTRICTED: {
    label: "Restricted",
    className: "bg-red-50 text-red-700",
  },
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

export default function AdminDataClassificationPolicyCenter({
  policies,
  loading = false,
  error,
  onCreate,
  onEdit,
  onRetire,
  onRefresh,
}: AdminDataClassificationPolicyCenterProps) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<
    DataClassificationLevel | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    DataClassificationPolicy["status"] | "ALL"
  >("ALL");

  const filteredPolicies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return policies.filter((policy) => {
      const searchable = [
        policy.name,
        policy.description,
        policy.id,
        policy.updatedBy,
        ...policy.handlingRequirements,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (levelFilter === "ALL" || policy.level === levelFilter) &&
        (statusFilter === "ALL" || policy.status === statusFilter)
      );
    });
  }, [policies, search, levelFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      active: policies.filter((item) => item.status === "ACTIVE").length,
      draft: policies.filter((item) => item.status === "DRAFT").length,
      retired: policies.filter((item) => item.status === "RETIRED").length,
      restricted: policies.filter(
        (item) => item.level === "RESTRICTED"
      ).length,
    }),
    [policies]
  );

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <Shield size={15} />
            Data governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Data Classification Policies
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Define how information is classified, protected, retained,
            and approved for export.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCreate}
            disabled={!onCreate}
            className="flex items-center gap-2 rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            <Plus size={16} />
            New policy
          </button>
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
            label: "Active policies",
            value: counts.active,
            icon: Shield,
          },
          {
            label: "Draft policies",
            value: counts.draft,
            icon: FileText,
          },
          {
            label: "Retired policies",
            value: counts.retired,
            icon: Eye,
          },
          {
            label: "Restricted policies",
            value: counts.restricted,
            icon: LockKeyhole,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-[#e9e5dd] bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#77736c]">{item.label}</p>
                <Icon size={17} className="text-[#9b8358]" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-[#292821]">
                {item.value.toLocaleString("en-IN")}
              </p>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-[#e9e5dd] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#eeeae3] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-[#292821]">
              Classification policy registry
            </h2>

            <span className="text-xs text-[#918c83]">
              {filteredPolicies.length} matching policies
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918c83]"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search policies..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(event) =>
                setLevelFilter(
                  event.target.value as DataClassificationLevel | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All classification levels</option>
              <option value="PUBLIC">Public</option>
              <option value="INTERNAL">Internal</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="RESTRICTED">Restricted</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | DataClassificationPolicy["status"]
                    | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All policy statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading classification policies...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 text-center">
            <Shield
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No policies found
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Adjust your filters or create a policy.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {filteredPolicies.map((policy) => (
              <article key={policy.id} className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#34322c]">
                        {policy.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${levelStyles[policy.level].className}`}
                      >
                        {levelStyles[policy.level].label}
                      </span>

                      <span className="rounded-full bg-[#f3f1ec] px-2.5 py-1 text-xs text-[#666157]">
                        {policy.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#77736c]">
                      {policy.description}
                    </p>

                    <p className="mt-2 text-xs text-[#918c83]">
                      Policy ID: {policy.id} · Version {policy.version}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit?.(policy)}
                      disabled={!onEdit || policy.status === "RETIRED"}
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onRetire?.(policy)}
                      disabled={
                        !onRetire || policy.status !== "ACTIVE"
                      }
                      className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                    >
                      Retire
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Encryption
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {policy.encryptionRequired
                        ? "Required"
                        : "Not required"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Export approval
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {policy.approvalRequiredForExport
                        ? "Required"
                        : "Not required"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Retention period
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {policy.retentionDays == null
                        ? "Not specified"
                        : `${policy.retentionDays} days`}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Last updated
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(policy.updatedAt)}
                    </p>
                    <p className="mt-1 text-xs text-[#918c83]">
                      By {policy.updatedBy}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                    Handling requirements
                  </p>

                  {policy.handlingRequirements.length === 0 ? (
                    <p className="text-xs text-[#918c83]">
                      No handling requirements supplied.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {policy.handlingRequirements.map(
                        (requirement, index) => (
                          <li
                            key={`${policy.id}-${index}`}
                            className="rounded-md border border-[#eeeae3] bg-white px-2.5 py-1.5 text-xs text-[#666157]"
                          >
                            {requirement}
                          </li>
                        )
                      )}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
        />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Enforcement must remain server-side
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Displaying an active policy does not guarantee that files,
            APIs, exports, or database records follow it. The backend
            must enforce classification, authorization, encryption,
            retention, and export restrictions on every relevant
            operation.
          </p>
        </div>
      </section>
    </main>
  );
}
