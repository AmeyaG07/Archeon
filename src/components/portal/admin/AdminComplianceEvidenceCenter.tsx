
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Search,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

export type EvidenceStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export type EvidenceCategory =
  | "POLICY"
  | "ACCESS_CONTROL"
  | "FINANCIAL"
  | "SECURITY"
  | "OPERATIONAL"
  | "CONTRACTUAL"
  | "OTHER";

export type ComplianceEvidence = {
  id: string;
  title: string;
  description: string;
  category: EvidenceCategory;
  referenceStandard?: string;
  owner: string;
  status: EvidenceStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  expiresAt?: string;
  documentReference?: string;
  reviewNotes?: string;
};

export type ComplianceRequirement = {
  id: string;
  title: string;
  description: string;
  category: EvidenceCategory;
  owner: string;
  evidenceIds: string[];
  reviewRequired: boolean;
};

type Props = {
  evidence: ComplianceEvidence[];
  requirements: ComplianceRequirement[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onOpenEvidence?: (item: ComplianceEvidence) => void;
  onSubmitEvidence?: (requirement: ComplianceRequirement) => void;
  onReviewEvidence?: (
    item: ComplianceEvidence,
    decision: "ACCEPT" | "REJECT"
  ) => void;
};

const statusStyles: Record<EvidenceStatus, string> = {
  NOT_SUBMITTED: "bg-stone-100 text-stone-600",
  SUBMITTED: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-amber-50 text-amber-800",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-orange-50 text-orange-800",
};

const categoryLabels: Record<EvidenceCategory, string> = {
  POLICY: "Policy",
  ACCESS_CONTROL: "Access control",
  FINANCIAL: "Financial",
  SECURITY: "Security",
  OPERATIONAL: "Operational",
  CONTRACTUAL: "Contractual",
  OTHER: "Other",
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
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

export default function AdminComplianceEvidenceCenter({
  evidence,
  requirements,
  loading = false,
  error,
  onRefresh,
  onOpenEvidence,
  onSubmitEvidence,
  onReviewEvidence,
}: Props) {
  const [activeTab, setActiveTab] = useState<"evidence" | "requirements">(
    "evidence"
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const metrics = useMemo(
    () => ({
      total: evidence.length,
      accepted: evidence.filter((item) => item.status === "ACCEPTED").length,
      pending: evidence.filter(
        (item) =>
          item.status === "SUBMITTED" || item.status === "UNDER_REVIEW"
      ).length,
      attention: evidence.filter(
        (item) =>
          item.status === "REJECTED" ||
          item.status === "EXPIRED" ||
          item.status === "NOT_SUBMITTED"
      ).length,
    }),
    [evidence]
  );

  const filteredEvidence = useMemo(() => {
    const query = search.trim().toLowerCase();

    return evidence.filter((item) => {
      const searchable = [
        item.id,
        item.title,
        item.description,
        item.owner,
        item.category,
        item.referenceStandard ?? "",
        item.documentReference ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "ALL" || item.status === statusFilter) &&
        (categoryFilter === "ALL" || item.category === categoryFilter)
      );
    });
  }, [evidence, search, statusFilter, categoryFilter]);

  const filteredRequirements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requirements.filter((item) =>
      [
        item.id,
        item.title,
        item.description,
        item.owner,
        item.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [requirements, search]);

  function getRequirementEvidence(
    requirement: ComplianceRequirement
  ): ComplianceEvidence[] {
    return evidence.filter((item) =>
      requirement.evidenceIds.includes(item.id)
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f3] px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs text-stone-500">
              <ShieldCheck size={14} />
              Administration / Compliance & Evidence
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Compliance & Evidence
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              Organise evidence records, monitor review status, and identify
              outstanding documentation requirements.
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
            label="Evidence records"
            value={metrics.total}
            icon={<FileText size={18} />}
          />
          <Metric
            label="Accepted"
            value={metrics.accepted}
            icon={<CheckCircle2 size={18} />}
          />
          <Metric
            label="Pending review"
            value={metrics.pending}
            icon={<Clock3 size={18} />}
          />
          <Metric
            label="Needs attention"
            value={metrics.attention}
            icon={<AlertTriangle size={18} />}
          />
        </section>

        <section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("evidence")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "evidence"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Evidence records
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("requirements")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  activeTab === "requirements"
                    ? "bg-stone-900 text-white"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                Requirements
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
                placeholder="Search records..."
                className="w-full rounded-lg border border-stone-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {activeTab === "evidence" ? (
            <>
              <div className="flex flex-wrap gap-3 border-b border-stone-100 bg-stone-50/60 p-4">
                <select
                  aria-label="Filter evidence by status"
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
                  aria-label="Filter evidence by category"
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All categories</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <p className="self-center text-xs text-stone-500 sm:ml-auto">
                  {filteredEvidence.length} of {evidence.length} records
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  Loading evidence records...
                </div>
              ) : filteredEvidence.length === 0 ? (
                <div className="p-12 text-center">
                  <FileCheck2
                    size={28}
                    className="mx-auto text-stone-300"
                  />
                  <p className="mt-3 text-sm font-medium">
                    No evidence records found
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredEvidence.map((item) => (
                    <article key={item.id} className="p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-stone-400">
                              {item.id}
                            </span>
                            <Badge className={statusStyles[item.status]}>
                              {item.status.replaceAll("_", " ")}
                            </Badge>
                            <Badge className="bg-stone-100 text-stone-600">
                              {categoryLabels[item.category]}
                            </Badge>
                          </div>

                          <h2 className="mt-2 text-sm font-semibold">
                            {item.title}
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-stone-500">
                            {item.description}
                          </p>

                          <div className="mt-3 grid gap-2 text-xs text-stone-500 sm:grid-cols-2">
                            <p>Owner: {item.owner}</p>
                            <p>
                              Reference: {item.referenceStandard || "Not specified"}
                            </p>
                            <p>Submitted: {formatDate(item.submittedAt)}</p>
                            <p>Reviewed: {formatDate(item.reviewedAt)}</p>
                            <p>Reviewed by: {item.reviewedBy || "Not recorded"}</p>
                            <p>Expires: {formatDate(item.expiresAt)}</p>
                          </div>

                          {item.reviewNotes && (
                            <p className="mt-3 rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-600">
                              Review notes: {item.reviewNotes}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(item.status === "SUBMITTED" ||
                            item.status === "UNDER_REVIEW") &&
                            onReviewEvidence && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewEvidence(item, "REJECT")
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onReviewEvidence(item, "ACCEPT")
                                  }
                                  className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700"
                                >
                                  Accept
                                </button>
                              </>
                            )}

                          <button
                            type="button"
                            onClick={() => onOpenEvidence?.(item)}
                            disabled={!onOpenEvidence}
                            className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100 disabled:opacity-50"
                          >
                            View evidence
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
                  Loading requirements...
                </div>
              ) : filteredRequirements.length === 0 ? (
                <div className="p-12 text-center text-sm text-stone-500">
                  No requirements found.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredRequirements.map((requirement) => {
                    const linkedEvidence = getRequirementEvidence(requirement);

                    const acceptedCount = linkedEvidence.filter(
                      (item) => item.status === "ACCEPTED"
                    ).length;

                    return (
                      <article key={requirement.id} className="p-4 sm:p-5">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs text-stone-400">
                              {requirement.id}
                            </p>
                            <h2 className="mt-2 text-sm font-semibold">
                              {requirement.title}
                            </h2>
                            <p className="mt-1 text-sm text-stone-500">
                              {requirement.description}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
                              <span>
                                Category: {categoryLabels[requirement.category]}
                              </span>
                              <span>Owner: {requirement.owner}</span>
                              <span>
                                Linked evidence: {linkedEvidence.length}
                              </span>
                              <span>
                                Accepted evidence: {acceptedCount}
                              </span>
                              <span>
                                Review required:{" "}
                                {requirement.reviewRequired ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>

                          {onSubmitEvidence && (
                            <button
                              type="button"
                              onClick={() => onSubmitEvidence(requirement)}
                              className="inline-flex items-center gap-2 self-start rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-50"
                            >
                              <Upload size={14} />
                              Submit evidence
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
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
                Evidence review safeguards
              </h2>
              <p className="mt-1 text-xs leading-5 text-stone-600">
                Accepting an evidence record confirms an internal review
                decision only. It does not establish legal compliance,
                certification, or regulatory approval. Verify document
                authenticity, scope, validity, ownership, and applicable
                requirements before recording a decision.
              </p>
            </div>
          </div>
        </section>

        <p className="flex items-center gap-2 text-xs text-stone-400">
          <XCircle size={13} />
          Evidence submission and document storage must be handled by the
          authorised document workflow.
        </p>
      </div>
    </main>
  );
}
