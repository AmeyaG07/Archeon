
"use client";

import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock3,
  ShieldCheck,
  IndianRupee,
  CalendarDays,
  FileText,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";

export type VendorSettlementStatus =
  | "Pending Acknowledgement"
  | "Vendor Acknowledged"
  | "Disputed"
  | "Finance Verification Pending"
  | "Finance Verified"
  | "Rejected";

export interface VendorCashSettlementRecord {
  id: string;
  referenceCode: string;
  projectName: string;
  settlementAmount: number;
  settlementDate: string;
  recordedBy: string;
  description?: string;
  status: VendorSettlementStatus;
  vendorAcknowledgedAt?: string;
  financeVerifiedAt?: string;
  financeRemark?: string;
  disputeReason?: string;
}

export interface VendorSettlementAcknowledgement {
  settlementId: string;
  decision: "ACKNOWLEDGE" | "DISPUTE";
  disputeReason?: string;
}

interface VendorCashSettlementProps {
  settlements: VendorCashSettlementRecord[];
  loading?: boolean;
  submittingId?: string;
  error?: string;
  onSubmitDecision: (
    decision: VendorSettlementAcknowledgement
  ) => void | Promise<void>;
  onOpenDetails?: (settlement: VendorCashSettlementRecord) => void;
  onRefresh?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusStyle(status: VendorSettlementStatus) {
  switch (status) {
    case "Finance Verified":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Vendor Acknowledged":
    case "Finance Verification Pending":
      return "bg-[#EAF0F5] text-[#58738C]";

    case "Disputed":
    case "Rejected":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#F4EFE2] text-[#94743F]";
  }
}

export function VendorCashSettlement({
  settlements,
  loading = false,
  submittingId,
  error,
  onSubmitDecision,
  onOpenDetails,
  onRefresh,
}: VendorCashSettlementProps) {
  const [selectedSettlement, setSelectedSettlement] =
    useState<VendorCashSettlementRecord | null>(null);

  const [decision, setDecision] = useState<
    "ACKNOWLEDGE" | "DISPUTE"
  >("ACKNOWLEDGE");

  const [disputeReason, setDisputeReason] = useState("");
  const [validationError, setValidationError] = useState("");

  function openDecision(
    settlement: VendorCashSettlementRecord,
    selectedDecision: "ACKNOWLEDGE" | "DISPUTE"
  ) {
    setSelectedSettlement(settlement);
    setDecision(selectedDecision);
    setDisputeReason("");
    setValidationError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSettlement || submittingId) return;

    if (
      decision === "DISPUTE" &&
      disputeReason.trim().length < 10
    ) {
      setValidationError(
        "Please explain the issue in at least 10 characters."
      );
      return;
    }

    setValidationError("");

    await onSubmitDecision({
      settlementId: selectedSettlement.id,
      decision,
      ...(decision === "DISPUTE"
        ? { disputeReason: disputeReason.trim() }
        : {}),
    });

    // Do not change the settlement status here.
    // The parent must refresh authoritative server data
    // after the backend confirms the decision.
    setSelectedSettlement(null);
  }

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading cash settlement records...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Vendor Portal / Finance
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Cash Settlements
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Review cash settlements recorded against your work.
            Confirm the amount only when you have actually received it.
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-6 text-[10px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
            >
              Refresh Records
            </button>
          )}
        </header>

        {/* Important Notice */}
        <section className="mt-8 flex items-start gap-4 border border-[#E8DFCE] bg-[#F8F4EB] p-6">
          <ShieldCheck
            size={22}
            className="mt-1 shrink-0 text-[#94743F]"
          />

          <div>
            <h2 className="text-sm font-medium text-[#6F5C39]">
              Two-party settlement verification
            </h2>

            <p className="mt-2 text-xs leading-7 text-[#806D4A]">
              Your acknowledgement confirms your response to the
              recorded settlement. Final financial verification
              requires separate authorised finance verification.
            </p>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-5"
          >
            <AlertCircle
              size={19}
              className="shrink-0 text-[#9A5147]"
            />

            <p className="text-xs leading-6 text-[#805B55]">
              {error}
            </p>
          </div>
        )}

        {/* Settlement List */}
        <section className="mt-12">
          <div className="border-b border-[#D8D6D0] pb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
              Settlement Records
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              Your Settlements
            </h2>
          </div>

          {settlements.length === 0 ? (
            <div className="mt-7 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
              <IndianRupee
                size={28}
                strokeWidth={1.3}
                className="mx-auto text-[#A58A64]"
              />

              <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                No settlement records
              </h3>

              <p className="mt-3 text-sm text-[#77736C]">
                No cash settlements are currently recorded for your account.
              </p>
            </div>
          ) : (
            <div className="mt-7 space-y-5">
              {settlements.map((settlement) => {
                const canRespond =
                  settlement.status === "Pending Acknowledgement";

                return (
                  <article
                    key={settlement.id}
                    className="border border-[#D8D6D0] bg-white p-6 md:p-8"
                  >
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                          {settlement.referenceCode}
                        </p>

                        <h3 className="mt-3 font-serif text-2xl text-[#171717]">
                          {settlement.projectName}
                        </h3>

                        {settlement.description && (
                          <p className="mt-2 text-xs leading-6 text-[#77736C]">
                            {settlement.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`w-fit px-3 py-2 text-[9px] uppercase tracking-widest ${getStatusStyle(settlement.status)}`}
                      >
                        {settlement.status}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="mt-7 border-y border-[#E5E2DC] py-6">
                      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                        Recorded Settlement Amount
                      </p>

                      <p className="mt-3 font-serif text-3xl text-[#171717]">
                        {formatCurrency(settlement.settlementAmount)}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <Detail
                        icon={<CalendarDays size={15} />}
                        label="Settlement Date"
                        value={formatDate(settlement.settlementDate)}
                      />

                      <Detail
                        icon={<FileText size={15} />}
                        label="Recorded By"
                        value={settlement.recordedBy}
                      />

                      <Detail
                        icon={<Clock3 size={15} />}
                        label="Vendor Response"
                        value={
                          settlement.vendorAcknowledgedAt
                            ? formatDate(settlement.vendorAcknowledgedAt)
                            : "Awaiting response"
                        }
                      />
                    </div>

                    {/* Dispute Information */}
                    {settlement.disputeReason && (
                      <div className="mt-6 border border-[#E3C9C5] bg-[#FAF3F1] p-5">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#9A5147]">
                          Dispute Submitted
                        </p>

                        <p className="mt-3 text-xs leading-7 text-[#805B55]">
                          {settlement.disputeReason}
                        </p>
                      </div>
                    )}

                    {/* Finance Remark */}
                    {settlement.financeRemark && (
                      <div className="mt-6 border border-[#E8DFCE] bg-[#F8F4EB] p-5">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#94743F]">
                          Finance Response
                        </p>

                        <p className="mt-3 text-xs leading-7 text-[#6F5C39]">
                          {settlement.financeRemark}
                        </p>
                      </div>
                    )}

                    {/* Finance Verification */}
                    {settlement.status === "Finance Verified" && (
                      <div className="mt-6 flex items-center gap-3 border border-[#D7E2D2] bg-[#F0F5EE] p-4">
                        <CheckCircle2
                          size={18}
                          className="text-[#547A51]"
                        />

                        <div>
                          <p className="text-xs font-medium text-[#547A51]">
                            Finance verification completed
                          </p>

                          {settlement.financeVerifiedAt && (
                            <p className="mt-1 text-[10px] text-[#6F826A]">
                              {formatDate(settlement.financeVerifiedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-[#E5E2DC] pt-6">
                      {canRespond && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              openDecision(settlement, "ACKNOWLEDGE")
                            }
                            disabled={Boolean(submittingId)}
                            className="inline-flex items-center gap-2 bg-[#171717] px-6 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                            Acknowledge Receipt
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openDecision(settlement, "DISPUTE")
                            }
                            disabled={Boolean(submittingId)}
                            className="inline-flex items-center gap-2 border border-[#D8D6D0] px-6 py-3 text-[10px] uppercase tracking-widest text-[#9A5147] hover:border-[#9A5147] disabled:opacity-50"
                          >
                            <AlertCircle size={15} />
                            Dispute Settlement
                          </button>
                        </>
                      )}

                      {onOpenDetails && (
                        <button
                          type="button"
                          onClick={() => onOpenDetails(settlement)}
                          className="ml-auto inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
                        >
                          View Details
                          <ArrowUpRight size={15} />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Decision Dialog */}
        {selectedSettlement && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            role="presentation"
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="settlement-dialog-title"
              className="my-auto w-full max-w-xl border border-[#D8D6D0] bg-[#F2F0EB] p-6 shadow-2xl md:p-9"
            >
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                Settlement Response
              </p>

              <h2
                id="settlement-dialog-title"
                className="mt-4 font-serif text-3xl text-[#171717]"
              >
                {decision === "ACKNOWLEDGE"
                  ? "Confirm Receipt"
                  : "Raise a Dispute"}
              </h2>

              <div className="mt-6 border border-[#D8D6D0] bg-white p-5">
                <p className="text-xs text-[#77736C]">
                  {selectedSettlement.projectName}
                </p>

                <p className="mt-3 font-serif text-2xl text-[#171717]">
                  {formatCurrency(selectedSettlement.settlementAmount)}
                </p>

                <p className="mt-2 font-mono text-[9px] text-[#99958D]">
                  {selectedSettlement.referenceCode}
                </p>
              </div>

              {decision === "ACKNOWLEDGE" ? (
                <div className="mt-6 border border-[#E8DFCE] bg-[#F8F4EB] p-5">
                  <p className="text-xs leading-7 text-[#6F5C39]">
                    By continuing, you confirm that you have received
                    the cash amount shown above. Do not acknowledge
                    a settlement that you have not actually received
                    or that has an incorrect amount.
                  </p>
                </div>
              ) : (
                <div className="mt-6">
                  <label
                    htmlFor="settlement-dispute-reason"
                    className="mb-3 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]"
                  >
                    Explain the discrepancy
                  </label>

                  <textarea
                    id="settlement-dispute-reason"
                    value={disputeReason}
                    onChange={(event) =>
                      setDisputeReason(event.target.value)
                    }
                    rows={5}
                    maxLength={2000}
                    placeholder="Explain why the amount or settlement record is incorrect..."
                    className="w-full border border-[#D8D6D0] bg-white p-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
                  />

                  <p className="mt-2 text-right font-mono text-[9px] text-[#99958D]">
                    {disputeReason.length}/2000
                  </p>
                </div>
              )}

              {validationError && (
                <p role="alert" className="mt-4 text-xs text-[#9A5147]">
                  {validationError}
                </p>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={Boolean(submittingId)}
                  onClick={() => setSelectedSettlement(null)}
                  className="border border-[#D8D6D0] px-6 py-3 text-[10px] uppercase tracking-widest text-[#77736C] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={Boolean(submittingId)}
                  onClick={(event) => {
                    const form = event.currentTarget.form;
                    if (form) form.requestSubmit();
                  }}
                  className="bg-[#171717] px-6 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
                >
                  {submittingId === selectedSettlement.id
                    ? "Processing..."
                    : decision === "ACKNOWLEDGE"
                      ? "Confirm Receipt"
                      : "Submit Dispute"}
                </button>
              </div>

              {/* Hidden form handles the actual submission */}
              <form onSubmit={handleSubmit} className="hidden">
                <button type="submit">Submit</button>
              </form>
            </section>
          </div>
        )}

        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL VENDOR WORKSPACE
          </p>
        </footer>
      </div>
    </main>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        <span className="text-[#A58A64]">{icon}</span>
        {label}
      </p>

      <p className="mt-2 text-xs text-[#33312D]">{value}</p>
    </div>
  );
}
