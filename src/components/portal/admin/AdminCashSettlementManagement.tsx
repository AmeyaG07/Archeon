
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Search,
  RefreshCw,
  Wallet,
  Building2,
  UserRound,
  CalendarDays,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  ArrowUpRight,
  X,
  MessageSquare,
  LockKeyhole,
} from "lucide-react";

export type CashVendorAcknowledgement =
  | "Pending"
  | "Acknowledged"
  | "Disputed"
  | "Expired";

export type CashFinanceStatus =
  | "Awaiting Vendor"
  | "Pending Verification"
  | "Under Verification"
  | "Verified"
  | "Rejected"
  | "Disputed";

export type CashSettlementStatus =
  | "Initiated"
  | "Awaiting Acknowledgement"
  | "Awaiting Finance Verification"
  | "Under Review"
  | "Verified"
  | "Rejected"
  | "Disputed"
  | "Cancelled";

export interface CashSettlementHistoryEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  remarks?: string;
  timestamp: string;
}

export interface AdminCashSettlementRecord {
  id: string;
  reference: string;

  vendorId: string;
  vendorName: string;

  projectId?: string;
  projectReference?: string;
  projectName?: string;

  relatedInvoiceId?: string;
  relatedInvoiceReference?: string;

  amount: number;
  currency: "INR";

  initiatedBy: string;
  initiatedAt: string;

  settlementDate?: string;
  settlementDescription: string;

  vendorAcknowledgement: CashVendorAcknowledgement;
  vendorAcknowledgedAt?: string;
  vendorResponse?: string;

  financeStatus: CashFinanceStatus;
  financeVerifiedBy?: string;
  financeVerifiedAt?: string;
  financeRemarks?: string;

  overallStatus: CashSettlementStatus;

  evidenceCount: number;
  hasRequiredEvidence: boolean;

  currentUserCanVerify: boolean;
  currentUserInitiated: boolean;

  history: CashSettlementHistoryEntry[];
}

export interface CashSettlementSummary {
  totalCount: number;
  totalValue: number;
  awaitingVendor: number;
  awaitingFinance: number;
  verifiedCount: number;
  disputedCount: number;
}

export interface CashFinanceDecision {
  decision: "Verify" | "Reject" | "Request Clarification";
  remarks: string;
}

interface AdminCashSettlementManagementProps {
  settlements: AdminCashSettlementRecord[];
  summary?: CashSettlementSummary;

  loading?: boolean;
  error?: string;
  processingSettlementId?: string;

  onRefresh?: () => void;

  onOpenSettlement?: (settlementId: string) => void;

  onOpenVendor?: (vendorId: string) => void;

  onOpenProject?: (projectId: string) => void;

  onOpenInvoice?: (invoiceId: string) => void;

  onOpenEvidence?: (settlementId: string) => void;

  onSubmitFinanceDecision: (
    settlementId: string,
    decision: CashFinanceDecision
  ) => Promise<void>;
}

type SettlementFilter =
  | "All"
  | "Awaiting Acknowledgement"
  | "Awaiting Finance Verification"
  | "Verified"
  | "Disputed"
  | "Rejected";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "Not available";

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

function settlementStatusStyle(status: CashSettlementStatus) {
  switch (status) {
    case "Verified":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Awaiting Acknowledgement":
    case "Awaiting Finance Verification":
    case "Under Review":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Disputed":
    case "Rejected":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function acknowledgementStyle(status: CashVendorAcknowledgement) {
  switch (status) {
    case "Acknowledged":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Disputed":
    case "Expired":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#F4EFE2] text-[#94743F]";
  }
}

function financeStatusStyle(status: CashFinanceStatus) {
  switch (status) {
    case "Verified":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Pending Verification":
    case "Under Verification":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Rejected":
    case "Disputed":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function isValidAmount(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function AdminCashSettlementManagement({
  settlements,
  summary,
  loading = false,
  error,
  processingSettlementId,
  onRefresh,
  onOpenSettlement,
  onOpenVendor,
  onOpenProject,
  onOpenInvoice,
  onOpenEvidence,
  onSubmitFinanceDecision,
}: AdminCashSettlementManagementProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SettlementFilter>("All");

  const [selectedSettlement, setSelectedSettlement] =
    useState<AdminCashSettlementRecord | null>(null);

  const [decision, setDecision] =
    useState<CashFinanceDecision["decision"]>("Verify");

  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const calculatedSummary = useMemo<CashSettlementSummary>(() => ({
    totalCount: settlements.length,

    totalValue: settlements.reduce(
      (total, item) => total + item.amount,
      0
    ),

    awaitingVendor: settlements.filter(
      (item) =>
        item.overallStatus === "Awaiting Acknowledgement"
    ).length,

    awaitingFinance: settlements.filter(
      (item) =>
        item.overallStatus === "Awaiting Finance Verification" ||
        item.overallStatus === "Under Review"
    ).length,

    verifiedCount: settlements.filter(
      (item) => item.overallStatus === "Verified"
    ).length,

    disputedCount: settlements.filter(
      (item) => item.overallStatus === "Disputed"
    ).length,
  }), [settlements]);

  const totals = summary ?? calculatedSummary;

  const filteredSettlements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return settlements.filter((item) => {
      const matchesSearch =
        !query ||
        item.reference.toLowerCase().includes(query) ||
        item.vendorName.toLowerCase().includes(query) ||
        item.vendorId.toLowerCase().includes(query) ||
        (item.projectName ?? "").toLowerCase().includes(query) ||
        (item.projectReference ?? "").toLowerCase().includes(query) ||
        (item.relatedInvoiceReference ?? "").toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        item.overallStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [settlements, search, filter]);

  function openSettlement(item: AdminCashSettlementRecord) {
    setSelectedSettlement(item);
    setDecision("Verify");
    setRemarks("");
    setActionError("");
  }

  function closeSettlement() {
    if (submitting) return;

    setSelectedSettlement(null);
    setActionError("");
  }

  async function submitDecision() {
    if (!selectedSettlement || submitting) return;

    setActionError("");

    if (!selectedSettlement.currentUserCanVerify) {
      setActionError(
        "Your account is not authorised to verify this settlement."
      );
      return;
    }

    if (selectedSettlement.currentUserInitiated) {
      setActionError(
        "The settlement initiator cannot independently verify the same settlement."
      );
      return;
    }

    if (
      selectedSettlement.vendorAcknowledgement !== "Acknowledged"
    ) {
      setActionError(
        "Vendor acknowledgement is required before finance verification."
      );
      return;
    }

    if (
      !selectedSettlement.hasRequiredEvidence &&
      decision !== "Request Clarification"
    ) {
      setActionError(
        "Required settlement evidence is missing. Request clarification before verification."
      );
      return;
    }

    if (
      (decision === "Reject" ||
        decision === "Request Clarification") &&
      !remarks.trim()
    ) {
      setActionError("A written reason is required.");
      return;
    }

    if (!isValidAmount(selectedSettlement.amount)) {
      setActionError(
        "The settlement amount is invalid. Do not verify this record."
      );
      return;
    }

    setSubmitting(true);

    try {
      await onSubmitFinanceDecision(selectedSettlement.id, {
        decision,
        remarks: remarks.trim(),
      });

      setSelectedSettlement(null);
      setRemarks("");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "The finance decision could not be submitted."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Finance / Cash Settlements
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Cash Settlements
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Monitor vendor acknowledgements, settlement evidence,
            finance verification and disputed cash transactions.
          </p>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-5"
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0 text-[#9A5147]"
          />
          <p className="text-xs leading-6 text-[#805B55]">
            {error}
          </p>
        </div>
      )}

      {/* Summary */}
      <section className="mt-9 grid grid-cols-2 gap-px border border-[#D8D6D0] bg-[#D8D6D0] lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          label="Total Records"
          value={totals.totalCount.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Total Settlement Value"
          value={formatCurrency(totals.totalValue)}
        />

        <SummaryCard
          label="Awaiting Vendor"
          value={totals.awaitingVendor.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Awaiting Finance"
          value={totals.awaitingFinance.toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Verified"
          value={totals.verifiedCount.toLocaleString("en-IN")}
        />
      </section>

      {/* Governance Notice */}
      <section className="mt-6 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5 md:p-6">
        <LockKeyhole
          size={20}
          className="mt-0.5 shrink-0 text-[#A58A64]"
        />

        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            Two-Party Verification
          </p>

          <p className="mt-2 text-xs leading-6 text-[#666159]">
            A vendor acknowledgement records the vendor&apos;s response.
            Finance must independently verify the settlement and its
            evidence. Neither action alone proves that money was
            correctly transferred.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="mt-10">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search settlement, vendor, project or invoice..."
            aria-label="Search cash settlements"
            className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#A58A64]"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              "All",
              "Awaiting Acknowledgement",
              "Awaiting Finance Verification",
              "Verified",
              "Rejected",
            ] as SettlementFilter[]
          ).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              aria-pressed={filter === item}
              className={`border px-4 py-3 text-[9px] uppercase tracking-widest transition-colors ${
                filter === item
                  ? "border-[#171717] bg-[#171717] text-white"
                  : "border-[#D8D6D0] bg-white text-[#77736C] hover:border-[#A58A64]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Settlement Register */}
      <section className="mt-9">
        <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              Finance Records
            </p>

            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Settlement Register
            </h2>
          </div>

          <p className="font-mono text-[9px] text-[#99958D]">
            {filteredSettlements.length} RECORDS
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading settlement records...
            </p>
          </div>
        ) : filteredSettlements.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
            <Wallet
              size={28}
              strokeWidth={1.3}
              className="mx-auto text-[#A58A64]"
            />

            <h3 className="mt-5 font-serif text-2xl text-[#171717]">
              No settlements found
            </h3>

            <p className="mt-3 text-xs text-[#77736C]">
              No settlement records match your search or filter.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredSettlements.map((item) => (
              <SettlementCard
                key={item.id}
                item={item}
                processing={
                  processingSettlementId === item.id
                }
                onOpen={() => openSettlement(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Detail and Verification Drawer */}
      {selectedSettlement && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-black/50"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSettlement();
            }
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="settlement-detail-title"
            className="flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-[#F2F0EB] shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6D0] bg-[#F2F0EB] px-6 py-5 md:px-8">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  Settlement / {selectedSettlement.reference}
                </p>

                <h2
                  id="settlement-detail-title"
                  className="mt-2 font-serif text-2xl text-[#171717]"
                >
                  Settlement Verification
                </h2>
              </div>

              <button
                type="button"
                onClick={closeSettlement}
                disabled={submitting}
                aria-label="Close settlement details"
                className="text-[#77736C] disabled:opacity-40"
              >
                <X size={21} />
              </button>
            </div>

            <div className="flex-1 space-y-7 p-6 md:p-8">

              {/* Settlement Identity */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
                    <Wallet size={20} />
                  </div>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${settlementStatusStyle(selectedSettlement.overallStatus)}`}
                  >
                    {selectedSettlement.overallStatus}
                  </span>
                </div>

                <h3 className="mt-5 break-words font-serif text-3xl text-[#171717]">
                  {selectedSettlement.reference}
                </h3>

                <p className="mt-3 font-serif text-3xl text-[#171717]">
                  {formatCurrency(selectedSettlement.amount)}
                </p>

                <div className="mt-6 space-y-4 border-t border-[#E5E2DC] pt-5">
                  <DetailLine
                    icon={<Building2 size={14} />}
                    label="Vendor"
                    value={selectedSettlement.vendorName}
                  />

                  <DetailLine
                    icon={<UserRound size={14} />}
                    label="Initiated By"
                    value={selectedSettlement.initiatedBy}
                  />

                  <DetailLine
                    icon={<CalendarDays size={14} />}
                    label="Initiated At"
                    value={formatDate(selectedSettlement.initiatedAt)}
                  />

                  <DetailLine
                    icon={<CalendarDays size={14} />}
                    label="Settlement Date"
                    value={formatDate(selectedSettlement.settlementDate)}
                  />
                </div>

                <p className="mt-5 border-t border-[#E5E2DC] pt-5 text-xs leading-7 text-[#666159]">
                  {selectedSettlement.settlementDescription}
                </p>

                {onOpenVendor && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenVendor(selectedSettlement.vendorId)
                    }
                    className="mt-5 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
                  >
                    Open Vendor Record
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </section>

              {/* Project and Invoice */}
              {(selectedSettlement.projectId ||
                selectedSettlement.relatedInvoiceId) && (
                <section className="border border-[#D8D6D0] bg-white p-6">
                  <SectionHeading>Related Records</SectionHeading>

                  {selectedSettlement.projectName && (
                    <div className="mt-5">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                        Project
                      </p>

                      <p className="mt-2 text-sm text-[#33312D]">
                        {selectedSettlement.projectName}
                      </p>

                      {selectedSettlement.projectReference && (
                        <p className="mt-1 font-mono text-[9px] text-[#A58A64]">
                          {selectedSettlement.projectReference}
                        </p>
                      )}

                      {selectedSettlement.projectId && onOpenProject && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenProject(selectedSettlement.projectId!)
                          }
                          className="mt-3 text-[9px] uppercase tracking-widest text-[#987543]"
                        >
                          Open Project
                        </button>
                      )}
                    </div>
                  )}

                  {selectedSettlement.relatedInvoiceReference && (
                    <div className="mt-5 border-t border-[#E5E2DC] pt-5">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                        Related Invoice
                      </p>

                      <p className="mt-2 text-sm text-[#33312D]">
                        {selectedSettlement.relatedInvoiceReference}
                      </p>

                      {selectedSettlement.relatedInvoiceId && onOpenInvoice && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInvoice(
                              selectedSettlement.relatedInvoiceId!
                            )
                          }
                          className="mt-3 text-[9px] uppercase tracking-widest text-[#987543]"
                        >
                          Open Invoice
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )}

              {/* Vendor Acknowledgement */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Vendor Acknowledgement</SectionHeading>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#77736C]">
                    Vendor response
                  </p>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${acknowledgementStyle(selectedSettlement.vendorAcknowledgement)}`}
                  >
                    {selectedSettlement.vendorAcknowledgement}
                  </span>
                </div>

                {selectedSettlement.vendorAcknowledgedAt && (
                  <p className="mt-4 text-[10px] text-[#77736C]">
                    Acknowledged at:{" "}
                    {formatDate(selectedSettlement.vendorAcknowledgedAt)}
                  </p>
                )}

                {selectedSettlement.vendorResponse && (
                  <div className="mt-5 border-t border-[#E5E2DC] pt-5">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                      Vendor Response
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-[#55514A]">
                      {selectedSettlement.vendorResponse}
                    </p>
                  </div>
                )}

                {selectedSettlement.vendorAcknowledgement !== "Acknowledged" && (
                  <div className="mt-5 border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs leading-6 text-[#805B55]">
                    Finance verification is blocked until the vendor&apos;s
                    acknowledgement is confirmed by the server.
                  </div>
                )}
              </section>

              {/* Finance Status */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Finance Verification Status</SectionHeading>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#77736C]">
                    Finance status
                  </p>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${financeStatusStyle(selectedSettlement.financeStatus)}`}
                  >
                    {selectedSettlement.financeStatus}
                  </span>
                </div>

                {selectedSettlement.financeVerifiedBy && (
                  <div className="mt-5 space-y-3 border-t border-[#E5E2DC] pt-5">
                    <DetailLine
                      icon={<UserRound size={14} />}
                      label="Finance Reviewer"
                      value={selectedSettlement.financeVerifiedBy}
                    />

                    <DetailLine
                      icon={<CalendarDays size={14} />}
                      label="Finance Decision Date"
                      value={formatDate(selectedSettlement.financeVerifiedAt)}
                    />
                  </div>
                )}

                {selectedSettlement.financeRemarks && (
                  <p className="mt-5 border-t border-[#E5E2DC] pt-5 text-xs leading-6 text-[#55514A]">
                    {selectedSettlement.financeRemarks}
                  </p>
                )}
              </section>

              {/* Evidence */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <SectionHeading>Settlement Evidence</SectionHeading>

                  <span className="font-mono text-[9px] text-[#99958D]">
                    {selectedSettlement.evidenceCount} FILES
                  </span>
                </div>

                <p className="mt-3 text-xs leading-6 text-[#77736C]">
                  {selectedSettlement.hasRequiredEvidence
                    ? "The server reports the required evidence is present. Inspect the actual supporting records before verification."
                    : "Required evidence is reported missing. Request clarification before verification."}
                </p>

                {selectedSettlement.evidenceCount > 0 && onOpenEvidence && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenEvidence(selectedSettlement.id)
                    }
                    className="mt-5 inline-flex items-center gap-2 border border-[#D8D6D0] px-5 py-3 text-[9px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64]"
                  >
                    <FileText size={14} />
                    Inspect Evidence
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </section>

              {/* History */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Settlement History</SectionHeading>

                {selectedSettlement.history.length === 0 ? (
                  <p className="mt-5 text-xs text-[#77736C]">
                    No history records are available.
                  </p>
                ) : (
                  <div className="mt-5 space-y-5">
                    {selectedSettlement.history.map((entry) => (
                      <div
                        key={entry.id}
                        className="border-l border-[#D8D6D0] pl-4"
                      >
                        <p className="text-xs text-[#33312D]">
                          {entry.action}
                        </p>

                        <p className="mt-1 text-[10px] text-[#77736C]">
                          {entry.actorName} · {entry.actorRole}
                        </p>

                        {entry.remarks && (
                          <p className="mt-2 text-xs leading-6 text-[#77736C]">
                            {entry.remarks}
                          </p>
                        )}

                        <p className="mt-2 font-mono text-[8px] text-[#99958D]">
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Finance Decision */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Finance Decision</SectionHeading>

                <p className="mt-3 text-xs leading-6 text-[#77736C]">
                  Record an independent finance decision after
                  checking the vendor acknowledgement and supporting evidence.
                </p>

                <label className="mt-6 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Decision
                  </span>

                  <select
                    value={decision}
                    onChange={(event) => {
                      setDecision(
                        event.target.value as CashFinanceDecision["decision"]
                      );
                      setActionError("");
                    }}
                    disabled={
                      submitting ||
                      !selectedSettlement.currentUserCanVerify ||
                      selectedSettlement.currentUserInitiated ||
                      selectedSettlement.vendorAcknowledgement !== "Acknowledged"
                    }
                    className="h-12 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64] disabled:opacity-50"
                  >
                    <option value="Verify">Verify Settlement</option>
                    <option value="Reject">Reject Settlement</option>
                    <option value="Request Clarification">
                      Request Clarification
                    </option>
                  </select>
                </label>

                <label className="mt-5 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Finance Remarks
                    {(decision === "Reject" ||
                      decision === "Request Clarification") &&
                      " · Required"}
                  </span>

                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    rows={4}
                    maxLength={2000}
                    disabled={submitting}
                    placeholder="Record verification findings, rejection reasons or clarification required..."
                    className="w-full resize-y border border-[#D8D6D0] bg-white p-4 text-xs leading-6 outline-none focus:border-[#A58A64] disabled:opacity-50"
                  />

                  <span className="mt-2 block text-right font-mono text-[8px] text-[#99958D]">
                    {remarks.length}/2000
                  </span>
                </label>

                {actionError && (
                  <div
                    role="alert"
                    className="mt-5 border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs leading-6 text-[#805B55]"
                  >
                    {actionError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitDecision}
                  disabled={
                    submitting ||
                    !selectedSettlement.currentUserCanVerify ||
                    selectedSettlement.currentUserInitiated ||
                    selectedSettlement.vendorAcknowledgement !== "Acknowledged" ||
                    processingSettlementId === selectedSettlement.id
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Submitting Decision...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={15} />
                      Submit Finance Decision
                    </>
                  )}
                </button>

                <p className="mt-4 text-[9px] leading-5 text-[#99958D]">
                  Verification records a finance decision. It does not
                  initiate a bank transfer or replace bank reconciliation.
                </p>
              </section>
            </div>

            <div className="sticky bottom-0 border-t border-[#D8D6D0] bg-[#F2F0EB] p-5">
              <button
                type="button"
                onClick={closeSettlement}
                disabled={submitting}
                className="w-full border border-[#D8D6D0] px-5 py-4 text-[9px] uppercase tracking-widest text-[#77736C] disabled:opacity-40"
              >
                Close Settlement
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white p-5 md:p-6">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-5 break-words font-serif text-2xl text-[#171717] md:text-3xl">
        {value}
      </p>
    </div>
  );
}

function SettlementCard({
  item,
  processing,
  onOpen,
}: {
  item: AdminCashSettlementRecord;
  processing: boolean;
  onOpen: () => void;
}) {
  return (
    <article className="border border-[#D8D6D0] bg-white p-5 md:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
            <Wallet size={19} />
          </div>

          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              {item.reference}
            </p>

            <h3 className="mt-2 break-words font-serif text-2xl text-[#171717]">
              {item.vendorName}
            </h3>

            <p className="mt-2 text-xs text-[#77736C]">
              {item.projectName || "No linked project"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${settlementStatusStyle(item.overallStatus)}`}
          >
            {item.overallStatus}
          </span>

          {processing && (
            <span className="text-[8px] uppercase tracking-widest text-[#94743F]">
              Processing...
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E5E2DC] pt-5 sm:grid-cols-3">
        <Metric
          label="Settlement Amount"
          value={formatCurrency(item.amount)}
        />

        <Metric
          label="Vendor Acknowledgement"
          value={item.vendorAcknowledgement}
        />

        <Metric
          label="Finance Verification"
          value={item.financeStatus}
        />
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-5 sm:flex-row sm:items-center">
        <p className="text-[10px] text-[#77736C]">
          Initiated: {formatDate(item.initiatedAt)}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
        >
          Review Settlement
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-2 break-words text-sm text-[#33312D]">
        {value}
      </p>
    </div>
  );
}

function DetailLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[#A58A64]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <p className="mt-1 break-words text-xs text-[#55514A]">
          {value}
        </p>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
      {children}
    </p>
  );
}

