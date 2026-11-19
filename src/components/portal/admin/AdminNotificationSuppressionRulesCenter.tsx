
"use client";

import { useMemo, useState } from "react";
import {
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  Clock,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Settings2,
} from "lucide-react";

export type SuppressionRuleStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export type SuppressionRuleCategory =
  | "CONSENT"
  | "QUIET_HOURS"
  | "PAYMENT"
  | "DISPUTE"
  | "FREQUENCY"
  | "ACCOUNT"
  | "CUSTOM";

export interface NotificationSuppressionRule {
  id: string;
  name: string;
  description: string;
  category: SuppressionRuleCategory;
  status: SuppressionRuleStatus;
  applicableChannels: string[];
  applicablePurposes: string[];
  priority: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  lastTriggeredAt?: string;
  triggerCount?: number;
}

interface AdminNotificationSuppressionRulesCenterProps {
  rules: NotificationSuppressionRule[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onCreate?: () => void;
  onView?: (rule: NotificationSuppressionRule) => void;
  onEdit?: (rule: NotificationSuppressionRule) => void;
  onChangeStatus?: (
    rule: NotificationSuppressionRule,
    nextStatus: SuppressionRuleStatus
  ) => void;
}

const categoryLabels: Record<SuppressionRuleCategory, string> = {
  CONSENT: "Consent and opt-out",
  QUIET_HOURS: "Quiet hours",
  PAYMENT: "Payment state",
  DISPUTE: "Dispute state",
  FREQUENCY: "Frequency limit",
  ACCOUNT: "Account restrictions",
  CUSTOM: "Custom rule",
};

const categoryStyles: Record<SuppressionRuleCategory, string> = {
  CONSENT: "bg-red-50 text-red-700",
  QUIET_HOURS: "bg-blue-50 text-blue-700",
  PAYMENT: "bg-emerald-50 text-emerald-700",
  DISPUTE: "bg-orange-50 text-orange-700",
  FREQUENCY: "bg-violet-50 text-violet-700",
  ACCOUNT: "bg-slate-100 text-slate-700",
  CUSTOM: "bg-amber-50 text-amber-800",
};

const statusStyles: Record<SuppressionRuleStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  DRAFT: "bg-amber-50 text-amber-800",
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

export default function AdminNotificationSuppressionRulesCenter({
  rules,
  loading = false,
  error,
  onRefresh,
  onCreate,
  onView,
  onEdit,
  onChangeStatus,
}: AdminNotificationSuppressionRulesCenterProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    SuppressionRuleCategory | "ALL"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    SuppressionRuleStatus | "ALL"
  >("ALL");

  const filteredRules = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rules
      .filter((rule) => {
        const searchable = [
          rule.id,
          rule.name,
          rule.description,
          rule.updatedBy,
          categoryLabels[rule.category],
          ...rule.applicableChannels,
          ...rule.applicablePurposes,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!query || searchable.includes(query)) &&
          (categoryFilter === "ALL" ||
            rule.category === categoryFilter) &&
          (statusFilter === "ALL" ||
            rule.status === statusFilter)
        );
      })
      .sort((a, b) => a.priority - b.priority);
  }, [rules, search, categoryFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      active: rules.filter((rule) => rule.status === "ACTIVE").length,
      inactive: rules.filter((rule) => rule.status === "INACTIVE").length,
      draft: rules.filter((rule) => rule.status === "DRAFT").length,
      triggered: rules.reduce(
        (total, rule) => total + (rule.triggerCount ?? 0),
        0
      ),
    }),
    [rules]
  );

  return (
    <main className="space-y-7">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#9b8358]">
            <ShieldAlert size={15} />
            Notification governance
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-[#25241f]">
            Notification Suppression Rules
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-[#77736c]">
            Review rules that prevent inappropriate, unauthorized,
            or unnecessary customer and vendor notifications.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={!onRefresh || loading}
            className="flex items-center gap-2 rounded-lg border border-[#ded9cf] px-4 py-2.5 text-sm font-medium text-[#34322c] hover:bg-[#f8f6f1] disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            type="button"
            onClick={onCreate}
            disabled={!onCreate}
            className="flex items-center gap-2 rounded-lg bg-[#292821] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            <Plus size={16} />
            New rule
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
            label: "Active rules",
            value: counts.active,
            color: "text-emerald-700",
          },
          {
            label: "Inactive rules",
            value: counts.inactive,
            color: "text-slate-700",
          },
          {
            label: "Draft rules",
            value: counts.draft,
            color: "text-amber-700",
          },
          {
            label: "Recorded triggers",
            value: counts.triggered,
            color: "text-[#292821]",
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
              Suppression rule registry
            </h2>
            <p className="mt-1 text-xs text-[#918c83]">
              Lower priority numbers are evaluated first, subject
              to backend-defined rule precedence.
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
                placeholder="Search rules..."
                className="w-full rounded-lg border border-[#e5e0d7] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#a58c5d]"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value as SuppressionRuleCategory | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as SuppressionRuleStatus | "ALL"
                )
              }
              className="rounded-lg border border-[#e5e0d7] bg-white px-3 py-2.5 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-[#77736c]">
            Loading suppression rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert
              size={30}
              className="mx-auto text-[#b3aa9b]"
            />
            <p className="mt-3 font-medium text-[#34322c]">
              No matching suppression rules
            </p>
            <p className="mt-1 text-sm text-[#918c83]">
              Change the filters or create a rule.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#f0ede7]">
            {filteredRules.map((rule) => (
              <article key={rule.id} className="space-y-4 p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#34322c]">
                        {rule.name}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${categoryStyles[rule.category]}`}
                      >
                        {categoryLabels[rule.category]}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[rule.status]}`}
                      >
                        {rule.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#77736c]">
                      {rule.description}
                    </p>

                    <p className="mt-2 text-xs text-[#918c83]">
                      Rule ID: {rule.id} · Priority: {rule.priority}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onView?.(rule)}
                      disabled={!onView}
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit?.(rule)}
                      disabled={!onEdit || rule.status === "INACTIVE"}
                      className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                    >
                      Edit
                    </button>

                    {rule.status !== "DRAFT" && (
                      <button
                        type="button"
                        onClick={() =>
                          onChangeStatus?.(
                            rule,
                            rule.status === "ACTIVE"
                              ? "INACTIVE"
                              : "ACTIVE"
                          )
                        }
                        disabled={!onChangeStatus}
                        className="rounded-lg border border-[#ded9cf] px-3 py-2 text-xs font-medium text-[#555148] hover:bg-[#f8f6f1] disabled:opacity-40"
                      >
                        {rule.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Trigger count
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {(rule.triggerCount ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Last triggered
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(rule.lastTriggeredAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Last updated
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {formatDate(rule.updatedAt)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#faf9f6] p-3">
                    <p className="text-xs text-[#918c83]">
                      Updated by
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#34322c]">
                      {rule.updatedBy}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                      Applicable channels
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rule.applicableChannels.length === 0 ? (
                        <span className="text-xs text-[#918c83]">
                          No channels specified
                        </span>
                      ) : (
                        rule.applicableChannels.map((channel) => (
                          <span
                            key={channel}
                            className="rounded-md border border-[#eeeae3] px-2.5 py-1.5 text-xs text-[#666157]"
                          >
                            {channel}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#918c83]">
                      Applicable purposes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rule.applicablePurposes.length === 0 ? (
                        <span className="text-xs text-[#918c83]">
                          All purposes or not specified
                        </span>
                      ) : (
                        rule.applicablePurposes.map((purpose) => (
                          <span
                            key={purpose}
                            className="rounded-md border border-[#eeeae3] px-2.5 py-1.5 text-xs text-[#666157]"
                          >
                            {purpose}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="border-t border-[#eeeae3] bg-[#faf9f6] px-5 py-3 text-xs text-[#918c83]">
          Showing {filteredRules.length.toLocaleString("en-IN")} of{" "}
          {rules.length.toLocaleString("en-IN")} supplied rules.
        </footer>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex gap-3 rounded-xl border border-[#e9e5dd] bg-white p-4">
          <Clock size={19} className="mt-0.5 shrink-0 text-[#9b8358]" />
          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Quiet-hour enforcement
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#77736c]">
              Evaluate quiet hours using the recipient&apos;s configured
              timezone and the applicable communication purpose.
            </p>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-[#e9e5dd] bg-white p-4">
          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0 text-[#9b8358]"
          />
          <div>
            <h3 className="text-sm font-semibold text-[#34322c]">
              Payment and dispute suppression
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#77736c]">
              Recheck authoritative invoice and dispute states before
              dispatching reminders. Do not rely on stale frontend data.
            </p>
          </div>
        </div>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-700"
        />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Critical suppression rules must not be bypassable
          </h3>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            Opt-out, consent, legal restrictions, and account-level
            blocks must be enforced by the backend. An administrator
            must not be able to bypass these restrictions merely by
            changing a UI rule. Changes need authorization, audit
            records, and effective-time handling.
          </p>
        </div>
      </section>
    </main>
  );
}
