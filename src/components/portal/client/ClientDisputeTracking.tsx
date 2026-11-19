
"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquare,
  ShieldCheck,
  CircleDot,
} from "lucide-react";

export type ClientDisputeTrackingStatus =
  | "Submitted"
  | "Under Review"
  | "Awaiting Client Response"
  | "Resolved"
  | "Rejected";

export interface ClientDisputeHistoryEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  actor: "Client" | "Finance Team" | "System";
}

export interface ClientDisputeRecord {
  id: string;
  referenceNumber: string;
  invoiceNumber: string;
  projectName: string;
  reason: string;
  explanation: string;
  submittedAt: string;
  status: ClientDisputeTrackingStatus;
  financeResponse?: string;
  lastUpdatedAt: string;
  history: ClientDisputeHistoryEntry[];
}

interface ClientDisputeTrackingProps {
  disputes: ClientDisputeRecord[];
  loading?: boolean;
  error?: string;
  onViewInvoice: (dispute: ClientDisputeRecord) => void;
  onRetry?: () => void;
}

function getStatusStyle(status: ClientDisputeTrackingStatus) {
  switch (status) {
    case "Resolved":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Rejected":
      return "bg-[#F8EAE7] text-[#9A5147]";

    case "Under Review":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Awaiting Client Response":
      return "bg-[#EAF0F5] text-[#58738C]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getStatusIcon(status: ClientDisputeTrackingStatus) {
  switch (status) {
    case "Resolved":
      return <CheckCircle2 size={18} />;

    case "Rejected":
      return <AlertCircle size={18} />;

    case "Under Review":
      return <Clock3 size={18} />;

    case "Awaiting Client Response":
      return <MessageSquare size={18} />;

    default:
      return <CircleDot size={18} />;
  }
}

export function ClientDisputeTracking({
  disputes,
  loading = false,
  error,
  onViewInvoice,
  onRetry,
}: ClientDisputeTrackingProps) {
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

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 text-xs uppercase tracking-widest text-[#773B34] underline"
          >
            Try Again
          </button>
        )}
      </section>
    );
  }

  const activeCount = disputes.filter(
    (dispute) =>
      dispute.status === "Submitted" ||
      dispute.status === "Under Review" ||
      dispute.status === "Awaiting Client Response"
  ).length;

  const resolvedCount = disputes.filter(
    (dispute) => dispute.status === "Resolved"
  ).length;

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Portal / Financial Review
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Dispute Tracking
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Follow your invoice disputes and review updates shared
            by the studio&apos;s finance team.
          </p>
        </header>

        {/* Summary */}
        <section
          aria-label="Dispute summary"
          className="mt-8 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-3"
        >
          <SummaryCard
            label="Total Disputes"
            value={String(disputes.length)}
            icon={<FileText size={19} />}
          />

          <SummaryCard
            label="Active Disputes"
            value={String(activeCount)}
            icon={<Clock3 size={19} />}
          />

          <SummaryCard
            label="Resolved Disputes"
            value={String(resolvedCount)}
            icon={<CheckCircle2 size={19} />}
          />
        </section>

        {/* Important Notice */}
        <div className="mt-8 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
          <ShieldCheck
            size={20}
            className="mt-1 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            Dispute information shown here reflects the latest
            records provided by the studio. A dispute&apos;s status does
            not independently confirm a refund, payment reversal
            or invoice cancellation.
          </p>
        </div>

        {/* Dispute Records */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Case Records
              </p>

              <h2 className="mt-4 font-serif text-3xl text-[#171717]">
                Your Disputes
              </h2>
            </div>

            <span className="font-mono text-[10px] text-[#99958D]">
              {disputes.length} RECORDS
            </span>
          </div>

          {disputes.length === 0 ? (
            <div className="mt-8 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
              <FileText
                size={28}
                strokeWidth={1.3}
                className="mx-auto text-[#A58A64]"
              />

              <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                No disputes submitted
              </h3>

              <p className="mt-3 text-sm text-[#77736C]">
                Your submitted invoice disputes will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {disputes.map((dispute) => (
                <article
                  key={dispute.id}
                  className="border border-[#D8D6D0] bg-white p-6 md:p-8"
                >
                  {/* Dispute Heading */}
                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                        {dispute.referenceNumber}
                      </p>

                      <h3 className="mt-3 font-serif text-2xl text-[#171717]">
                        {dispute.reason}
                      </h3>

                      <p className="mt-2 text-xs text-[#77736C]">
                        {dispute.projectName}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-2 px-3 py-2 text-[9px] uppercase tracking-widest ${getStatusStyle(dispute.status)}`}
                    >
                      {getStatusIcon(dispute.status)}
                      {dispute.status}
                    </span>
                  </div>

                  {/* Invoice Details */}
                  <div className="mt-7 grid grid-cols-1 gap-5 border-y border-[#E5E2DC] py-5 sm:grid-cols-3">
                    <DetailItem
                      label="Invoice"
                      value={dispute.invoiceNumber}
                    />

                    <DetailItem
                      label="Submitted"
                      value={dispute.submittedAt}
                    />

                    <DetailItem
                      label="Last Updated"
                      value={dispute.lastUpdatedAt}
                    />
                  </div>

                  {/* Client Explanation */}
                  <div className="mt-7">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                      Your Explanation
                    </p>

                    <p className="mt-3 text-sm leading-7 text-[#66635D]">
                      {dispute.explanation}
                    </p>
                  </div>

                  {/* Finance Response */}
                  {dispute.financeResponse && (
                    <div className="mt-7 border border-[#E8DFCE] bg-[#F8F4EB] p-5">
                      <div className="flex items-center gap-3">
                        <MessageSquare
                          size={17}
                          className="text-[#94743F]"
                        />

                        <p className="font-mono text-[10px] uppercase tracking-widest text-[#94743F]">
                          Finance Team Response
                        </p>
                      </div>

                      <p className="mt-4 text-sm leading-7 text-[#6F5C39]">
                        {dispute.financeResponse}
                      </p>
                    </div>
                  )}

                  {/* History */}
                  <div className="mt-8">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                      Dispute History
                    </p>

                    {dispute.history.length === 0 ? (
                      <p className="mt-4 text-xs text-[#99958D]">
                        No additional history is available.
                      </p>
                    ) : (
                      <div className="mt-5 space-y-5">
                        {dispute.history.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center">
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#A58A64]" />
                              <span className="mt-2 w-px flex-1 bg-[#E5E2DC]" />
                            </div>

                            <div className="min-w-0 pb-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="text-sm text-[#33312D]">
                                  {entry.title}
                                </h4>

                                <span className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                                  {entry.actor}
                                </span>
                              </div>

                              <p className="mt-2 text-xs leading-6 text-[#77736C]">
                                {entry.description}
                              </p>

                              <p className="mt-2 font-mono text-[9px] text-[#99958D]">
                                {entry.date}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="mt-7 border-t border-[#E5E2DC] pt-5">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(dispute)}
                      className="text-xs uppercase tracking-widest text-[#33312D] underline decoration-[#A58A64] underline-offset-4 hover:text-[#A58A64]"
                    >
                      View Related Invoice
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL CLIENT RECORDS
          </p>
        </footer>
      </div>
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
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-7 md:p-9">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-7 font-serif text-4xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-2 text-xs text-[#33312D]">
        {value}
      </p>
    </div>
  );
}
