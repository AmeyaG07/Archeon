
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export type VendorDisputeType =
  | "Invoice Dispute"
  | "Cash Settlement Dispute";

export type VendorDisputeStatus =
  | "Submitted"
  | "Under Review"
  | "Awaiting Vendor Information"
  | "Awaiting Finance Review"
  | "Resolved"
  | "Rejected"
  | "Withdrawn";

export interface VendorDisputeEvidence {
  id: string;
  fileName: string;
  uploadedAt: string;
}

export interface VendorDisputeHistoryEntry {
  id: string;
  event: string;
  description: string;
  timestamp: string;
  actorLabel: string;
}

export interface VendorDisputeRecord {
  id: string;
  referenceCode: string;
  type: VendorDisputeType;
  relatedReference: string;
  projectName: string;
  subject: string;
  description: string;
  status: VendorDisputeStatus;
  submittedAt: string;
  lastUpdatedAt: string;
  financeResponse?: string;
  resolutionSummary?: string;
  evidence: VendorDisputeEvidence[];
  history: VendorDisputeHistoryEntry[];
}

interface VendorDisputeTrackingProps {
  disputes: VendorDisputeRecord[];
  loading?: boolean;
  error?: string;
  onOpenEvidence: (
    evidence: VendorDisputeEvidence,
    dispute: VendorDisputeRecord
  ) => void | Promise<void>;
  onOpenDispute?: (dispute: VendorDisputeRecord) => void;
  onRefresh?: () => void;
}

type DisputeFilter = "All" | VendorDisputeStatus;

const FILTERS: DisputeFilter[] = [
  "All",
  "Submitted",
  "Under Review",
  "Awaiting Vendor Information",
  "Awaiting Finance Review",
  "Resolved",
  "Rejected",
  "Withdrawn",
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusStyle(status: VendorDisputeStatus) {
  switch (status) {
    case "Resolved":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Under Review":
    case "Awaiting Finance Review":
      return "bg-[#EAF0F5] text-[#58738C]";

    case "Awaiting Vendor Information":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Rejected":
      return "bg-[#F8EAE7] text-[#9A5147]";

    case "Withdrawn":
      return "bg-[#ECEAE5] text-[#77736C]";

    default:
      return "bg-[#F4EFE2] text-[#94743F]";
  }
}

function renderStatusIcon(status: VendorDisputeStatus, size: number) {
  switch (status) {
    case "Resolved":
      return <CheckCircle2 size={size} />;

    case "Rejected":
      return <XCircle size={size} />;

    case "Awaiting Vendor Information":
    case "Submitted":
      return <AlertCircle size={size} />;

    default:
      return <Clock3 size={size} />;
  }
}

export function VendorDisputeTracking({
  disputes,
  loading = false,
  error,
  onOpenEvidence,
  onOpenDispute,
  onRefresh,
}: VendorDisputeTrackingProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DisputeFilter>("All");
  const [selectedDispute, setSelectedDispute] =
    useState<VendorDisputeRecord | null>(null);

  const filteredDisputes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return disputes.filter((dispute) => {
      const matchesSearch =
        !query ||
        dispute.referenceCode.toLowerCase().includes(query) ||
        dispute.relatedReference.toLowerCase().includes(query) ||
        dispute.projectName.toLowerCase().includes(query) ||
        dispute.subject.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        dispute.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [disputes, search, statusFilter]);

  const summary = useMemo(() => {
    return disputes.reduce(
      (result, dispute) => {
        if (
          dispute.status === "Submitted" ||
          dispute.status === "Under Review" ||
          dispute.status === "Awaiting Finance Review"
        ) {
          result.open += 1;
        }

        if (dispute.status === "Awaiting Vendor Information") {
          result.actionRequired += 1;
        }

        if (dispute.status === "Resolved") {
          result.resolved += 1;
        }

        return result;
      },
      {
        open: 0,
        actionRequired: 0,
        resolved: 0,
      }
    );
  }, [disputes]);

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading dispute records...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <section
        role="alert"
        className="border border-[#E3C9C5] bg-[#FAF3F1] p-7"
      >
        <AlertCircle size={22} className="text-[#9A5147]" />

        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
          Dispute records unavailable
        </h2>

        <p className="mt-3 text-sm leading-7 text-[#805B55]">
          {error}
        </p>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline"
          >
            Try Again
          </button>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Vendor Portal / Finance Support
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Dispute Resolution
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Track invoice and cash-settlement disputes, review
            finance responses and follow the progress of each case.
          </p>
        </header>

        {/* Summary */}
        <section className="mt-9 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-3">
          <SummaryCard
            label="Open Disputes"
            value={String(summary.open)}
            icon={<Clock3 size={19} />}
          />

          <SummaryCard
            label="Your Action Required"
            value={String(summary.actionRequired)}
            icon={<AlertCircle size={19} />}
          />

          <SummaryCard
            label="Resolved Disputes"
            value={String(summary.resolved)}
            icon={<CheckCircle2 size={19} />}
          />
        </section>

        {/* Search and Filters */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Case Records
              </p>

              <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                Your Disputes
              </h2>
            </div>

            <span className="font-mono text-[10px] text-[#99958D]">
              {filteredDisputes.length} RECORDS
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search case, invoice or project..."
                aria-label="Search disputes"
                className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as DisputeFilter)
              }
              aria-label="Filter disputes by status"
              className="h-12 border border-[#D8D6D0] bg-white px-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64] md:w-72"
            >
              {FILTERS.map((filter) => (
                <option key={filter} value={filter}>
                  {filter === "All" ? "All Dispute Statuses" : filter}
                </option>
              ))}
            </select>
          </div>

          {/* Dispute List */}
          <div className="mt-7 space-y-5">
            {filteredDisputes.length === 0 ? (
              <div className="border border-[#D8D6D0] bg-white px-6 py-16 text-center">
                <MessageSquare
                  size={28}
                  strokeWidth={1.3}
                  className="mx-auto text-[#A58A64]"
                />

                <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                  No disputes found
                </h3>

                <p className="mt-3 text-sm text-[#77736C]">
                  No records match your current search or filter.
                </p>
              </div>
            ) : (
              filteredDisputes.map((dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  onOpen={() => setSelectedDispute(dispute)}
                />
              ))
            )}
          </div>
        </section>

        {/* Security Notice */}
        <div className="mt-12 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
          <ShieldCheck
            size={20}
            className="mt-1 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            Dispute records and finance decisions are controlled by
            the studio&apos;s authorised systems. A dispute marked
            resolved must include a recorded resolution outcome.
          </p>
        </div>

        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL VENDOR WORKSPACE
          </p>
        </footer>
      </div>

      {/* Dispute Details */}
      {selectedDispute && (
        <DisputeDetailDialog
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onOpenEvidence={(evidence) =>
            onOpenEvidence(evidence, selectedDispute)
          }
          onOpenFullDetails={
            onOpenDispute
              ? () => onOpenDispute(selectedDispute)
              : undefined
          }
        />
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-white p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 font-serif text-3xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function DisputeCard({
  dispute,
  onOpen,
}: {
  dispute: VendorDisputeRecord;
  onOpen: () => void;
}) {
  return (
    <article className="border border-[#D8D6D0] bg-white p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            {dispute.referenceCode}
          </p>

          <h3 className="mt-3 font-serif text-2xl text-[#171717]">
            {dispute.subject}
          </h3>

          <p className="mt-2 text-xs text-[#77736C]">
            {dispute.projectName}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 px-3 py-2 text-[9px] uppercase tracking-widest ${getStatusStyle(dispute.status)}`}
        >
          {renderStatusIcon(dispute.status, 13)}
          {dispute.status}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <span className="border border-[#E5E2DC] px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
          {dispute.type}
        </span>

        <span className="border border-[#E5E2DC] px-3 py-2 font-mono text-[9px] text-[#77736C]">
          Related: {dispute.relatedReference}
        </span>
      </div>

      <p className="mt-6 text-xs leading-7 text-[#77736C]">
        {dispute.description}
      </p>

      {dispute.status === "Awaiting Vendor Information" && (
        <div className="mt-6 flex items-start gap-3 border border-[#E8DFCE] bg-[#F8F4EB] p-5">
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-[#94743F]"
          />

          <p className="text-xs leading-6 text-[#6F5C39]">
            The finance team has requested additional information.
            Review the case details and follow the instructions
            provided by the studio.
          </p>
        </div>
      )}

      <div className="mt-7 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-6 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-[10px] text-[#99958D]">
            <CalendarDays size={14} />
            Submitted {formatDate(dispute.submittedAt)}
          </p>

          <p className="mt-2 flex items-center gap-2 text-[10px] text-[#99958D]">
            <Clock3 size={14} />
            Updated {formatDate(dispute.lastUpdatedAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
        >
          Track Dispute
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}

function DisputeDetailDialog({
  dispute,
  onClose,
  onOpenEvidence,
  onOpenFullDetails,
}: {
  dispute: VendorDisputeRecord;
  onClose: () => void;
  onOpenEvidence: (evidence: VendorDisputeEvidence) => void;
  onOpenFullDetails?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-dispute-title"
        className="my-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-[#D8D6D0] bg-[#F2F0EB] p-6 md:p-9"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              Dispute / {dispute.referenceCode}
            </p>

            <h2
              id="vendor-dispute-title"
              className="mt-4 font-serif text-3xl text-[#171717]"
            >
              Case Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dispute details"
            className="text-xs uppercase tracking-widest text-[#77736C] hover:text-[#171717]"
          >
            Close
          </button>
        </div>

        {/* Case Overview */}
        <div className="mt-7 border border-[#D8D6D0] bg-white p-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            {dispute.type}
          </p>

          <h3 className="mt-3 font-serif text-2xl text-[#171717]">
            {dispute.subject}
          </h3>

          <p className="mt-3 text-xs leading-7 text-[#77736C]">
            {dispute.description}
          </p>

          <div className="mt-5 border-t border-[#E5E2DC] pt-5">
            <p className="text-[10px] text-[#99958D]">
              Related reference
            </p>

            <p className="mt-2 text-xs text-[#33312D]">
              {dispute.relatedReference}
            </p>
          </div>
        </div>

        {/* Finance Response */}
        <section className="mt-7">
          <h3 className="font-serif text-xl text-[#171717]">
            Finance Response
          </h3>

          {dispute.financeResponse ? (
            <div className="mt-4 border border-[#E8DFCE] bg-[#F8F4EB] p-5">
              <p className="text-xs leading-7 text-[#6F5C39]">
                {dispute.financeResponse}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-7 text-[#99958D]">
              No finance response has been recorded yet.
            </p>
          )}
        </section>

        {/* Resolution */}
        <section className="mt-7">
          <h3 className="font-serif text-xl text-[#171717]">
            Resolution Outcome
          </h3>

          {dispute.resolutionSummary ? (
            <div className="mt-4 border border-[#D7E2D2] bg-[#F0F5EE] p-5">
              <p className="text-xs leading-7 text-[#547A51]">
                {dispute.resolutionSummary}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs leading-7 text-[#99958D]">
              No final resolution has been recorded.
            </p>
          )}
        </section>

        {/* Evidence */}
        <section className="mt-7">
          <h3 className="font-serif text-xl text-[#171717]">
            Submitted Evidence
          </h3>

          {dispute.evidence.length === 0 ? (
            <p className="mt-3 text-xs text-[#99958D]">
              No supporting files are attached to this case.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {dispute.evidence.map((evidence) => (
                <button
                  key={evidence.id}
                  type="button"
                  onClick={() => onOpenEvidence(evidence)}
                  className="flex w-full items-center gap-3 border border-[#D8D6D0] bg-white p-4 text-left hover:border-[#A58A64]"
                >
                  <FileText
                    size={17}
                    className="shrink-0 text-[#A58A64]"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs text-[#33312D]">
                      {evidence.fileName}
                    </span>

                    <span className="mt-1 block text-[10px] text-[#99958D]">
                      Uploaded {formatDate(evidence.uploadedAt)}
                    </span>
                  </span>

                  <ArrowUpRight
                    size={15}
                    className="shrink-0 text-[#99958D]"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* History */}
        <section className="mt-8">
          <h3 className="font-serif text-xl text-[#171717]">
            Case History
          </h3>

          {dispute.history.length === 0 ? (
            <p className="mt-3 text-xs text-[#99958D]">
              No additional history is available.
            </p>
          ) : (
            <div className="mt-5 border-l border-[#D8D6D0] pl-5">
              {dispute.history.map((entry) => (
                <div
                  key={entry.id}
                  className="relative pb-7 last:pb-0"
                >
                  <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border border-[#A58A64] bg-[#F2F0EB]" />

                  <p className="text-xs font-medium text-[#33312D]">
                    {entry.event}
                  </p>

                  <p className="mt-2 text-xs leading-6 text-[#77736C]">
                    {entry.description}
                  </p>

                  <p className="mt-2 font-mono text-[9px] text-[#99958D]">
                    {entry.actorLabel} · {formatDate(entry.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-9 flex flex-wrap justify-end gap-3 border-t border-[#D8D6D0] pt-6">
          {onOpenFullDetails && (
            <button
              type="button"
              onClick={onOpenFullDetails}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#77736C] hover:border-[#A58A64]"
            >
              Open Full Case
              <ArrowUpRight size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="bg-[#171717] px-7 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64]"
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}
