
"use client";

import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  LockKeyhole,
  RefreshCw,
  Shield,
  ShieldAlert,
  Trash2,
} from "lucide-react";

export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";

export type DataRetentionPolicy = {
  id: string;
  name: string;
  description: string;
  classification: DataClassification;
  retentionPeriodLabel: string;
  basis: string;
  enabled: boolean;
  lastReviewedAt?: string;
  nextReviewAt?: string;
};

export type DataDeletionRequest = {
  id: string;
  subjectLabel: string;
  dataCategory: string;
  requestedAt: string;
  status:
    | "received"
    | "under_review"
    | "approved"
    | "rejected"
    | "in_progress"
    | "completed";
  reason?: string;
  assignedTo?: string;
};

export type DataGovernanceEvent = {
  id: string;
  title: string;
  description: string;
  actor: string;
  occurredAt: string;
  category: "retention" | "access" | "deletion" | "classification";
};

type Props = {
  policies: DataRetentionPolicy[];
  deletionRequests: DataDeletionRequest[];
  events: DataGovernanceEvent[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenPolicy?: (policy: DataRetentionPolicy) => void;
  onReviewPolicy?: (policy: DataRetentionPolicy) => void;
  onOpenDeletionRequest?: (request: DataDeletionRequest) => void;
  onReviewDeletionRequest?: (request: DataDeletionRequest) => void;
  onOpenEvent?: (event: DataGovernanceEvent) => void;
};

const classificationStyles: Record<DataClassification, string> = {
  public: "bg-[#F2F0EB] text-[#55534F]",
  internal: "bg-blue-50 text-blue-800",
  confidential: "bg-amber-50 text-amber-800",
  restricted: "bg-red-50 text-red-800",
};

const requestStyles: Record<DataDeletionRequest["status"], string> = {
  received: "bg-blue-50 text-blue-800",
  under_review: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-800",
  in_progress: "bg-blue-50 text-blue-800",
  completed: "bg-[#F2F0EB] text-[#55534F]",
};

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${className}`}>
      {children}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#9A7848]">
          {eyebrow}
        </p>
        <h2 className="text-lg font-medium tracking-tight text-[#171717]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

export default function AdminDataGovernanceCenter({
  policies,
  deletionRequests,
  events,
  loading = false,
  error = null,
  onRefresh,
  onOpenPolicy,
  onReviewPolicy,
  onOpenDeletionRequest,
  onReviewDeletionRequest,
  onOpenEvent,
}: Props) {
  const enabledPolicies = policies.filter((policy) => policy.enabled).length;

  const restrictedPolicies = policies.filter(
    (policy) => policy.classification === "restricted"
  ).length;

  const pendingRequests = deletionRequests.filter(
    (request) =>
      request.status === "received" ||
      request.status === "under_review"
  ).length;

  const processingRequests = deletionRequests.filter(
    (request) => request.status === "in_progress"
  ).length;

  return (
    <main className="min-h-screen bg-[#F7F6F2] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#9A7848]">
              Studio administration / Governance
            </p>

            <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
              Data governance
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77736D]">
              Review data classifications, retention policies, deletion
              requests and governance activity.
            </p>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-[#D8D6D0] bg-white px-4 py-2.5 text-xs font-medium text-[#33312E] hover:border-[#B68A4A] disabled:opacity-50 sm:self-auto"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          )}
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Unable to load governance information</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-[#D8D6D0] bg-white px-4 py-3 text-xs text-[#77736D]"
          >
            Updating governance information…
          </div>
        )}

        {/* Overview */}
        <section className="mb-9">
          <SectionHeading eyebrow="01 / Overview" title="Governance indicators" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <Database size={18} className="text-[#9A7848]" />
              <p className="mt-4 text-xs text-[#77736D]">Total policies</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {policies.length}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <CheckCircle2 size={18} className="text-emerald-700" />
              <p className="mt-4 text-xs text-[#77736D]">Enabled policies</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {enabledPolicies}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <Clock3 size={18} className="text-amber-700" />
              <p className="mt-4 text-xs text-[#77736D]">Requests awaiting review</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {pendingRequests}
              </p>
            </article>

            <article className="rounded-xl border border-[#E2E0DA] bg-white p-5">
              <LockKeyhole size={18} className="text-red-700" />
              <p className="mt-4 text-xs text-[#77736D]">Restricted policies</p>
              <p className="mt-1 text-3xl font-medium tabular-nums text-[#171717]">
                {restrictedPolicies}
              </p>
            </article>
          </div>
        </section>

        {/* Data classification */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="02 / Classification"
            title="Data sensitivity levels"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                "public",
                "internal",
                "confidential",
                "restricted",
              ] as DataClassification[]
            ).map((classification) => (
              <article
                key={classification}
                className="rounded-xl border border-[#E2E0DA] bg-white p-5"
              >
                <StatusPill className={classificationStyles[classification]}>
                  {classification}
                </StatusPill>
                <p className="mt-3 text-xs leading-5 text-[#77736D]">
                  {classification === "public" &&
                    "Information approved for public access."}
                  {classification === "internal" &&
                    "Information intended for authorised studio personnel."}
                  {classification === "confidential" &&
                    "Business, client or project information requiring controlled access."}
                  {classification === "restricted" &&
                    "Highly sensitive information requiring narrowly controlled access."}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Retention policies */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="03 / Retention"
            title="Data retention policies"
          />

          {policies.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#E2E0DA] bg-white">
              <table className="w-full min-w-[950px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">Policy</th>
                    <th className="px-5 py-3 font-medium">Classification</th>
                    <th className="px-5 py-3 font-medium">Retention period</th>
                    <th className="px-5 py-3 font-medium">Policy basis</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Next review</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {policies.map((policy) => (
                    <tr
                      key={policy.id}
                      className="border-b border-[#EEECE7] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-[#252421]">
                          {policy.name}
                        </p>
                        <p className="mt-1 max-w-[230px] text-[10px] leading-4 text-[#77736D]">
                          {policy.description}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill
                          className={classificationStyles[policy.classification]}
                        >
                          {policy.classification}
                        </StatusPill>
                      </td>

                      <td className="px-5 py-4 text-xs text-[#55534F]">
                        {policy.retentionPeriodLabel}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {policy.basis}
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill
                          className={
                            policy.enabled
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-[#F2F0EB] text-[#77736D]"
                          }
                        >
                          {policy.enabled ? "Enabled" : "Disabled"}
                        </StatusPill>
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(policy.nextReviewAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {onOpenPolicy && (
                            <button
                              type="button"
                              onClick={() => onOpenPolicy(policy)}
                              className="text-xs font-medium text-[#9A7848] hover:underline"
                            >
                              Details
                            </button>
                          )}

                          {onReviewPolicy && (
                            <button
                              type="button"
                              onClick={() => onReviewPolicy(policy)}
                              className="text-xs font-medium text-[#55534F] hover:underline"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8D6D0] bg-white p-8 text-center">
              <Archive size={23} className="mx-auto mb-2 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">
                No retention policies available
              </p>
              <p className="mt-1 text-xs text-[#77736D]">
                Policy information will appear when supplied by the governance service.
              </p>
            </div>
          )}
        </section>

        {/* Deletion requests */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="04 / Data rights"
            title="Data deletion requests"
          />

          <div className="mb-4 rounded-lg border border-[#E2E0DA] bg-white p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#9A7848]" />
              <p className="text-xs font-medium text-[#252421]">
                Deletion requires an authorised review
              </p>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#77736D]">
              A request must be checked against identity, legal obligations,
              contractual requirements, retention rules and any applicable
              preservation or dispute hold before a deletion decision.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#E2E0DA] bg-white p-4">
              <p className="text-xs text-[#77736D]">Awaiting review</p>
              <p className="mt-1 text-xl font-medium text-[#171717]">
                {pendingRequests}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E0DA] bg-white p-4">
              <p className="text-xs text-[#77736D]">In progress</p>
              <p className="mt-1 text-xl font-medium text-[#171717]">
                {processingRequests}
              </p>
            </div>
            <div className="rounded-lg border border-[#E2E0DA] bg-white p-4">
              <p className="text-xs text-[#77736D]">Total requests</p>
              <p className="mt-1 text-xl font-medium text-[#171717]">
                {deletionRequests.length}
              </p>
            </div>
          </div>

          {deletionRequests.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#E2E0DA] bg-white">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-[#EEECE7] bg-[#FAF9F6]">
                  <tr className="text-[10px] uppercase tracking-wider text-[#77736D]">
                    <th className="px-5 py-3 font-medium">Request</th>
                    <th className="px-5 py-3 font-medium">Data category</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                    <th className="px-5 py-3 font-medium">Assigned to</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {deletionRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-[#EEECE7] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-[#252421]">
                          {request.subjectLabel}
                        </p>
                        <p className="mt-1 text-[10px] text-[#99958D]">
                          {request.id}
                        </p>
                        {request.reason && (
                          <p className="mt-1 max-w-[220px] text-[10px] text-[#77736D]">
                            {request.reason}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {request.dataCategory}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {formatDate(request.requestedAt)}
                      </td>

                      <td className="px-5 py-4 text-xs text-[#77736D]">
                        {request.assignedTo ?? "Unassigned"}
                      </td>

                      <td className="px-5 py-4">
                        <StatusPill className={requestStyles[request.status]}>
                          {request.status.replace("_", " ")}
                        </StatusPill>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {onOpenDeletionRequest && (
                            <button
                              type="button"
                              onClick={() => onOpenDeletionRequest(request)}
                              className="text-xs font-medium text-[#9A7848] hover:underline"
                            >
                              Details
                            </button>
                          )}

                          {(request.status === "received" ||
                            request.status === "under_review") &&
                            onReviewDeletionRequest && (
                              <button
                                type="button"
                                onClick={() => onReviewDeletionRequest(request)}
                                className="text-xs font-medium text-[#55534F] hover:underline"
                              >
                                Review
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8D6D0] bg-white p-8 text-center">
              <Trash2 size={23} className="mx-auto mb-2 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">
                No deletion requests
              </p>
              <p className="mt-1 text-xs text-[#77736D]">
                Submitted requests will appear here.
              </p>
            </div>
          )}
        </section>

        {/* Governance activity */}
        <section>
          <SectionHeading
            eyebrow="05 / Accountability"
            title="Governance activity"
          />

          {events.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-[#E2E0DA] bg-white">
              {events.map((event, index) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => onOpenEvent?.(event)}
                  disabled={!onOpenEvent}
                  className={`flex w-full items-start gap-3 p-5 text-left transition hover:bg-[#FAF9F6] disabled:cursor-default ${
                    index !== events.length - 1
                      ? "border-b border-[#EEECE7]"
                      : ""
                  }`}
                >
                  <span className="rounded-lg bg-[#F2F0EB] p-2 text-[#77736D]">
                    {event.category === "deletion" ? (
                      <Trash2 size={16} />
                    ) : event.category === "access" ? (
                      <LockKeyhole size={16} />
                    ) : event.category === "retention" ? (
                      <Archive size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[#252421]">
                      {event.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#77736D]">
                      {event.description}
                    </span>
                    <span className="mt-2 block text-[10px] text-[#99958D]">
                      {event.actor} · {formatDate(event.occurredAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D8D6D0] bg-white p-8 text-center">
              <Shield size={23} className="mx-auto mb-2 text-[#99958D]" />
              <p className="text-sm font-medium text-[#33312E]">
                No governance activity
              </p>
              <p className="mt-1 text-xs text-[#77736D]">
                Activity records will appear when supplied by the audit service.
              </p>
            </div>
          )}
        </section>

        <footer className="mt-9 border-t border-[#D8D6D0] pt-5">
          <div className="flex items-start gap-2">
            <LockKeyhole size={15} className="mt-0.5 shrink-0 text-[#9A7848]" />
            <p className="text-[11px] leading-5 text-[#8B877F]">
              Do not invent retention periods or treat a deletion request as
              automatic permission to erase records. The backend must
              enforce approved retention schedules, preservation holds,
              access controls, deletion authorisation and immutable audit
              records. Sensitive documents and payment evidence may require
              separate retention and access rules.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
