
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Search,
  RefreshCw,
  FileText,
  Clock3,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Eye,
  ArrowUpRight,
  UserRound,
  Building2,
  CalendarDays,
  IndianRupee,
  MessageSquare,
  LockKeyhole,
} from "lucide-react";

export type ApprovalInvoiceStatus =
  | "Submitted"
  | "Under Review"
  | "Partially Approved"
  | "Approved"
  | "Rejected"
  | "Disputed";

export type ApprovalDecision =
  | "Approve"
  | "Partially Approve"
  | "Reject"
  | "Request Clarification";

export interface ApprovalHistoryEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  remarks?: string;
  timestamp: string;
}

export interface ApprovalInvoice {
  id: string;
  reference: string;
  partyType: "Client" | "Vendor";
  partyName: string;
  projectName?: string;
  projectReference?: string;

  invoiceDate: string;
  submittedAt: string;

  currency: "INR";
  invoiceAmount: number;
  previouslyApprovedAmount: number;
  proposedApprovalAmount?: number;

  status: ApprovalInvoiceStatus;

  description: string;
  invoiceDocumentCount: number;
  hasRequiredDocuments: boolean;

  submittedBy: string;
  assignedReviewer?: string;

  requiresSecondApproval: boolean;
  approvalCount: number;
  requiredApprovalCount: number;

  currentUserCanApprove: boolean;
  currentUserAlreadyApproved: boolean;

  history: ApprovalHistoryEntry[];
}

export interface ApprovalWorkspaceSummary {
  pendingCount: number;
  underReviewCount: number;
  awaitingSecondApprovalCount: number;
  approvedTodayCount: number;
  rejectedCount: number;
}

export interface ApprovalSubmission {
  decision: ApprovalDecision;
  approvedAmount?: number;
  remarks: string;
}

interface AdminInvoiceApprovalWorkspaceProps {
  invoices: ApprovalInvoice[];
  summary?: ApprovalWorkspaceSummary;
  loading?: boolean;
  submittingInvoiceId?: string;
  error?: string;

  onRefresh?: () => void;

  onOpenInvoice?: (invoiceId: string) => void;

  onSubmitDecision: (
    invoiceId: string,
    decision: ApprovalSubmission
  ) => Promise<void>;

  onOpenHistory?: (invoiceId: string) => void;
}

type QueueFilter =
  | "All"
  | "Submitted"
  | "Under Review"
  | "Awaiting Second Approval";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

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

function approvalStatusStyle(status: ApprovalInvoiceStatus) {
  switch (status) {
    case "Approved":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Submitted":
    case "Under Review":
      return "bg-[#F4EFE2] text-[#94743F]";
    case "Partially Approved":
      return "bg-[#EAEFF5] text-[#526C8A]";
    case "Rejected":
    case "Disputed":
      return "bg-[#F8EAE7] text-[#9A5147]";
    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function isPositiveMoney(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function AdminInvoiceApprovalWorkspace({
  invoices,
  summary,
  loading = false,
  submittingInvoiceId,
  error,
  onRefresh,
  onOpenInvoice,
  onSubmitDecision,
  onOpenHistory,
}: AdminInvoiceApprovalWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] =
    useState<QueueFilter>("All");

  const [selectedInvoice, setSelectedInvoice] =
    useState<ApprovalInvoice | null>(null);

  const [decision, setDecision] =
    useState<ApprovalDecision>("Approve");

  const [approvedAmount, setApprovedAmount] =
    useState("");

  const [remarks, setRemarks] = useState("");
  const [actionError, setActionError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const calculatedSummary = useMemo<ApprovalWorkspaceSummary>(() => ({
    pendingCount: invoices.filter(
      (invoice) => invoice.status === "Submitted"
    ).length,

    underReviewCount: invoices.filter(
      (invoice) => invoice.status === "Under Review"
    ).length,

    awaitingSecondApprovalCount: invoices.filter(
      (invoice) =>
        invoice.requiresSecondApproval &&
        invoice.approvalCount < invoice.requiredApprovalCount
    ).length,

    approvedTodayCount: 0,

    rejectedCount: invoices.filter(
      (invoice) => invoice.status === "Rejected"
    ).length,
  }), [invoices]);

  const totals = summary ?? calculatedSummary;

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        invoice.reference.toLowerCase().includes(query) ||
        invoice.partyName.toLowerCase().includes(query) ||
        invoice.partyType.toLowerCase().includes(query) ||
        (invoice.projectName ?? "").toLowerCase().includes(query) ||
        (invoice.projectReference ?? "").toLowerCase().includes(query);

      const awaitingSecondApproval =
        invoice.requiresSecondApproval &&
        invoice.approvalCount < invoice.requiredApprovalCount;

      const matchesQueue =
        queueFilter === "All" ||
        (queueFilter === "Submitted" &&
          invoice.status === "Submitted") ||
        (queueFilter === "Under Review" &&
          invoice.status === "Under Review") ||
        (queueFilter === "Awaiting Second Approval" &&
          awaitingSecondApproval);

      return matchesSearch && matchesQueue;
    });
  }, [invoices, search, queueFilter]);

  function openReview(invoice: ApprovalInvoice) {
    setSelectedInvoice(invoice);
    setDecision("Approve");
    setApprovedAmount(
      String(
        invoice.proposedApprovalAmount ??
        invoice.invoiceAmount -
          invoice.previouslyApprovedAmount
      )
    );
    setRemarks("");
    setActionError("");
  }

  function closeReview() {
    if (submitting) return;

    setSelectedInvoice(null);
    setActionError("");
  }

  async function submitDecision() {
    if (!selectedInvoice || submitting) return;

    setActionError("");

    if (!selectedInvoice.currentUserCanApprove) {
      setActionError(
        "Your account is not authorised to approve this invoice."
      );
      return;
    }

    if (selectedInvoice.currentUserAlreadyApproved) {
      setActionError(
        "You have already approved this invoice. Another authorised reviewer is required."
      );
      return;
    }

    if (
      !selectedInvoice.hasRequiredDocuments &&
      decision !== "Request Clarification"
    ) {
      setActionError(
        "Required supporting documents are missing. Request clarification before approval."
      );
      return;
    }

    const remainingAmount =
      selectedInvoice.invoiceAmount -
      selectedInvoice.previouslyApprovedAmount;

    let amount: number | undefined;

    if (
      decision === "Approve" ||
      decision === "Partially Approve"
    ) {
      amount = Number(approvedAmount);

      if (!isPositiveMoney(amount)) {
        setActionError("Enter a valid approval amount.");
        return;
      }

      if (amount > remainingAmount) {
        setActionError(
          "The approval amount cannot exceed the remaining unapproved amount."
        );
        return;
      }

      if (
        decision === "Partially Approve" &&
        amount >= remainingAmount
      ) {
        setActionError(
          "For partial approval, enter an amount below the remaining invoice amount."
        );
        return;
      }
    }

    if (
      (decision === "Reject" ||
        decision === "Request Clarification") &&
      !remarks.trim()
    ) {
      setActionError(
        "A written reason is required for this decision."
      );
      return;
    }

    setSubmitting(true);

    try {
      await onSubmitDecision(selectedInvoice.id, {
        decision,
        approvedAmount: amount,
        remarks: remarks.trim(),
      });

      setSelectedInvoice(null);
      setRemarks("");
      setApprovedAmount("");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "The decision could not be submitted."
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
            Administration / Finance / Approvals
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Invoice Approval
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Verify submitted invoices, review supporting evidence
            and record authorised finance decisions.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64] disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh Queue
          </button>
        )}
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-5"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#9A5147]" />
          <p className="text-xs leading-6 text-[#805B55]">
            {error}
          </p>
        </div>
      )}

      {/* Approval Summary */}
      <section className="mt-9 grid grid-cols-2 gap-px border border-[#D8D6D0] bg-[#D8D6D0] lg:grid-cols-5">
        <SummaryCard
          label="Pending Submission"
          value={totals.pendingCount}
        />

        <SummaryCard
          label="Under Review"
          value={totals.underReviewCount}
        />

        <SummaryCard
          label="Awaiting Second Approval"
          value={totals.awaitingSecondApprovalCount}
        />

        <SummaryCard
          label="Approved Today"
          value={totals.approvedTodayCount}
        />

        <SummaryCard
          label="Rejected"
          value={totals.rejectedCount}
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
            Approval Governance
          </p>

          <p className="mt-2 text-xs leading-6 text-[#666159]">
            Approval authority, maker-checker separation, approval
            thresholds and duplicate-payment prevention must be
            enforced by the backend. A successful browser action
            is not proof of a financial approval.
          </p>
        </div>
      </section>

      {/* Queue Filters */}
      <section className="mt-10">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice, party or project..."
            aria-label="Search approval queue"
            className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#A58A64]"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              "All",
              "Submitted",
              "Under Review",
              "Awaiting Second Approval",
            ] as QueueFilter[]
          ).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setQueueFilter(filter)}
              aria-pressed={queueFilter === filter}
              className={`border px-4 py-3 text-[9px] uppercase tracking-widest transition-colors ${
                queueFilter === filter
                  ? "border-[#171717] bg-[#171717] text-white"
                  : "border-[#D8D6D0] bg-white text-[#77736C] hover:border-[#A58A64]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      {/* Review Queue */}
      <section className="mt-9">
        <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              Finance Workflow
            </p>

            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Review Queue
            </h2>
          </div>

          <p className="font-mono text-[9px] text-[#99958D]">
            {filteredInvoices.length} RECORDS
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading approval queue...
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
            <CheckCircle2
              size={28}
              strokeWidth={1.3}
              className="mx-auto text-[#A58A64]"
            />

            <h3 className="mt-5 font-serif text-2xl text-[#171717]">
              No matching invoices
            </h3>

            <p className="mt-3 text-xs text-[#77736C]">
              The selected queue has no matching records.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredInvoices.map((invoice) => (
              <ApprovalQueueCard
                key={invoice.id}
                invoice={invoice}
                submitting={submittingInvoiceId === invoice.id}
                onReview={() => openReview(invoice)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Review Workspace Drawer */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-black/50"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeReview();
            }
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-detail-title"
            className="flex h-full w-full max-w-3xl flex-col overflow-y-auto bg-[#F2F0EB] shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6D0] bg-[#F2F0EB] px-6 py-5 md:px-8">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  Finance Review / {selectedInvoice.reference}
                </p>

                <h2
                  id="approval-detail-title"
                  className="mt-2 font-serif text-2xl text-[#171717]"
                >
                  Invoice Verification
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReview}
                disabled={submitting}
                aria-label="Close review"
                className="text-[#77736C] disabled:opacity-40"
              >
                <X size={21} />
              </button>
            </div>

            <div className="flex-1 space-y-7 p-6 md:p-8">

              {/* Invoice Information */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                      {selectedInvoice.partyType} Invoice
                    </p>

                    <h3 className="mt-3 break-words font-serif text-3xl text-[#171717]">
                      {selectedInvoice.reference}
                    </h3>

                    <p className="mt-2 text-xs text-[#77736C]">
                      {selectedInvoice.partyName}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${approvalStatusStyle(selectedInvoice.status)}`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E5E2DC] pt-5 sm:grid-cols-2">
                  <DetailLine
                    icon={<CalendarDays size={14} />}
                    label="Invoice Date"
                    value={formatDate(selectedInvoice.invoiceDate)}
                  />

                  <DetailLine
                    icon={<Clock3 size={14} />}
                    label="Submitted At"
                    value={formatDate(selectedInvoice.submittedAt)}
                  />

                  <DetailLine
                    icon={<UserRound size={14} />}
                    label="Submitted By"
                    value={selectedInvoice.submittedBy}
                  />

                  <DetailLine
                    icon={<Building2 size={14} />}
                    label="Project"
                    value={selectedInvoice.projectName || "Not linked"}
                  />
                </div>

                {selectedInvoice.description && (
                  <p className="mt-5 border-t border-[#E5E2DC] pt-5 text-xs leading-7 text-[#666159]">
                    {selectedInvoice.description}
                  </p>
                )}

                {onOpenInvoice && (
                  <button
                    type="button"
                    onClick={() => onOpenInvoice(selectedInvoice.id)}
                    className="mt-5 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
                  >
                    Open Full Invoice Record
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </section>

              {/* Financial Verification */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Financial Verification</SectionHeading>

                <div className="mt-5 space-y-4">
                  <MoneyRow
                    label="Submitted Invoice Amount"
                    value={selectedInvoice.invoiceAmount}
                  />

                  <MoneyRow
                    label="Previously Approved"
                    value={selectedInvoice.previouslyApprovedAmount}
                  />

                  <div className="border-t border-[#E5E2DC] pt-4">
                    <MoneyRow
                      label="Remaining Unapproved"
                      value={
                        selectedInvoice.invoiceAmount -
                        selectedInvoice.previouslyApprovedAmount
                      }
                      strong
                    />
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3 border border-[#E5E2DC] bg-[#FAF9F6] p-4">
                  <FileText
                    size={17}
                    className="mt-0.5 shrink-0 text-[#A58A64]"
                  />

                  <div>
                    <p className="text-xs text-[#33312D]">
                      {selectedInvoice.invoiceDocumentCount} supporting documents
                    </p>

                    <p className="mt-1 text-[10px] leading-5 text-[#77736C]">
                      {selectedInvoice.hasRequiredDocuments
                        ? "Required document presence is reported by the server. Inspect the actual documents before making a decision."
                        : "Required documents are reported missing. Request clarification rather than approving without evidence."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Approval Governance */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-[#A58A64]"
                  />

                  <div className="flex-1">
                    <SectionHeading>Approval Governance</SectionHeading>

                    <p className="mt-3 text-xs leading-6 text-[#77736C]">
                      This invoice requires{" "}
                      {selectedInvoice.requiredApprovalCount} approval(s).
                      The server reports{" "}
                      {selectedInvoice.approvalCount} recorded approval(s).
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                      {Array.from({
                        length: Math.min(
                          selectedInvoice.requiredApprovalCount,
                          5
                        ),
                      }).map((_, index) => (
                        <span
                          key={index}
                          className={`h-2 flex-1 ${
                            index < selectedInvoice.approvalCount
                              ? "bg-[#A58A64]"
                              : "bg-[#EAE7E0]"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="mt-3 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                      {selectedInvoice.approvalCount} /{" "}
                      {selectedInvoice.requiredApprovalCount} approvals recorded
                    </p>
                  </div>
                </div>

                {selectedInvoice.currentUserAlreadyApproved && (
                  <div className="mt-5 border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs leading-6 text-[#805B55]">
                    You have already approved this invoice. A different
                    authorised reviewer must complete the next approval.
                  </div>
                )}

                {!selectedInvoice.currentUserCanApprove && (
                  <div className="mt-5 border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs leading-6 text-[#805B55]">
                    Your current account does not have approval authority
                    for this invoice.
                  </div>
                )}
              </section>

              {/* Approval History */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-center justify-between">
                  <SectionHeading>Decision History</SectionHeading>

                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenHistory(selectedInvoice.id)
                      }
                      className="text-[9px] uppercase tracking-widest text-[#987543]"
                    >
                      Full History
                    </button>
                  )}
                </div>

                {selectedInvoice.history.length === 0 ? (
                  <p className="mt-5 text-xs text-[#77736C]">
                    No approval history is available.
                  </p>
                ) : (
                  <div className="mt-5 space-y-5">
                    {selectedInvoice.history.map((entry) => (
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

              {/* Decision Form */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Record Finance Decision</SectionHeading>

                <p className="mt-3 text-xs leading-6 text-[#77736C]">
                  Select a decision and provide the required supporting
                  remarks. The backend makes the final authorisation decision.
                </p>

                <label className="mt-6 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Decision
                  </span>

                  <select
                    value={decision}
                    onChange={(event) => {
                      setDecision(
                        event.target.value as ApprovalDecision
                      );
                      setActionError("");
                    }}
                    disabled={
                      submitting ||
                      !selectedInvoice.currentUserCanApprove ||
                      selectedInvoice.currentUserAlreadyApproved
                    }
                    className="h-12 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64] disabled:opacity-50"
                  >
                    <option value="Approve">Approve</option>
                    <option value="Partially Approve">
                      Partially Approve
                    </option>
                    <option value="Reject">Reject</option>
                    <option value="Request Clarification">
                      Request Clarification
                    </option>
                  </select>
                </label>

                {(decision === "Approve" ||
                  decision === "Partially Approve") && (
                  <label className="mt-5 block">
                    <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                      Approval Amount (INR)
                    </span>

                    <div className="relative">
                      <IndianRupee
                        size={15}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
                      />

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={approvedAmount}
                        onChange={(event) =>
                          setApprovedAmount(event.target.value)
                        }
                        disabled={submitting}
                        className="h-12 w-full border border-[#D8D6D0] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#A58A64] disabled:opacity-50"
                      />
                    </div>
                  </label>
                )}

                <label className="mt-5 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Remarks
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
                    placeholder="Record the reason, verification observations or clarification required..."
                    className="w-full resize-y border border-[#D8D6D0] bg-white p-4 text-xs leading-6 outline-none focus:border-[#A58A64] disabled:opacity-50"
                  />

                  <span className="mt-2 block text-right font-mono text-[8px] text-[#99958D]">
                    {remarks.length}/2000
                  </span>
                </label>

                {actionError && (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-4"
                  >
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-[#9A5147]"
                    />

                    <p className="text-xs leading-6 text-[#805B55]">
                      {actionError}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={submitDecision}
                  disabled={
                    submitting ||
                    !selectedInvoice.currentUserCanApprove ||
                    selectedInvoice.currentUserAlreadyApproved ||
                    submittingInvoiceId === selectedInvoice.id
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
                  Submitting a decision does not execute a bank payment.
                  All approval actions must be validated and recorded by
                  the server.
                </p>
              </section>
            </div>

            <div className="sticky bottom-0 border-t border-[#D8D6D0] bg-[#F2F0EB] p-5">
              <button
                type="button"
                onClick={closeReview}
                disabled={submitting}
                className="w-full border border-[#D8D6D0] px-5 py-4 text-[9px] uppercase tracking-widest text-[#77736C] disabled:opacity-40"
              >
                Close Review
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
  value: number;
}) {
  return (
    <div className="bg-white p-5 md:p-6">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-5 font-serif text-3xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function ApprovalQueueCard({
  invoice,
  submitting,
  onReview,
}: {
  invoice: ApprovalInvoice;
  submitting: boolean;
  onReview: () => void;
}) {
  const awaitingSecond =
    invoice.requiresSecondApproval &&
    invoice.approvalCount < invoice.requiredApprovalCount;

  return (
    <article className="border border-[#D8D6D0] bg-white p-5 md:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
            <FileText size={19} />
          </div>

          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              {invoice.reference}
            </p>

            <h3 className="mt-2 break-words font-serif text-2xl text-[#171717]">
              {invoice.partyName}
            </h3>

            <p className="mt-2 text-xs text-[#77736C]">
              {invoice.partyType} invoice
              {invoice.projectName
                ? ` · ${invoice.projectName}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${approvalStatusStyle(invoice.status)}`}
          >
            {invoice.status}
          </span>

          {awaitingSecond && (
            <span className="bg-[#EAEFF5] px-3 py-2 text-[8px] uppercase tracking-widest text-[#526C8A]">
              Second approval required
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#E5E2DC] pt-5 md:grid-cols-3">
        <Metric
          label="Invoice Amount"
          value={formatCurrency(invoice.invoiceAmount)}
        />

        <Metric
          label="Previously Approved"
          value={formatCurrency(invoice.previouslyApprovedAmount)}
        />

        <Metric
          label="Submitted"
          value={formatDate(invoice.submittedAt)}
        />
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-5 sm:flex-row sm:items-center">
        <p className="text-[10px] text-[#77736C]">
          {invoice.approvalCount} of {invoice.requiredApprovalCount} approvals recorded
        </p>

        <button
          type="button"
          onClick={onReview}
          disabled={submitting}
          className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543] hover:text-[#171717] disabled:opacity-40"
        >
          Review Invoice
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

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p
        className={`text-xs ${
          strong
            ? "font-semibold text-[#171717]"
            : "text-[#77736C]"
        }`}
      >
        {label}
      </p>

      <p
        className={`text-right text-sm tabular-nums ${
          strong
            ? "font-semibold text-[#171717]"
            : "text-[#55514A]"
        }`}
      >
        {formatCurrency(value)}
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
