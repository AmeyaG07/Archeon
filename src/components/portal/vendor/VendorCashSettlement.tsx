
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
  Plus,
  X,
  Upload,
  Camera,
  Edit3,
} from "lucide-react";
import { useVendorLanguage } from "@/providers/VendorLanguageProvider";

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
  receiptUrl?: string;
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
  onRaiseCashBill?: (
    photoUrl: string,
    amount: number,
    cashRequest: string,
    markPaidInCash: boolean
  ) => void | Promise<void>;
  onEditCashBill?: (
    settlementId: string,
    photoUrl: string,
    amount: number,
    cashRequest: string,
    markPaidInCash: boolean
  ) => void | Promise<void>;
  onDirectMarkPaidInCash?: (settlementId: string) => void | Promise<void>;
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
  onRaiseCashBill,
  onEditCashBill,
  onDirectMarkPaidInCash,
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

  // Raise / Edit Cash Bill Modal State
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<VendorCashSettlementRecord | null>(null);
  const [raisePhotoUrl, setRaisePhotoUrl] = useState("");
  const [raiseAmount, setRaiseAmount] = useState("");
  const [raiseRequestNotes, setRaiseRequestNotes] = useState("");
  const [markPaidInCash, setMarkPaidInCash] = useState(false);
  const [isRaising, setIsRaising] = useState(false);
  const [directUpdatingId, setDirectUpdatingId] = useState<string | null>(null);
  const { t } = useVendorLanguage();

  function openCreateCashModal() {
    setEditingSettlement(null);
    setRaisePhotoUrl("");
    setRaiseAmount("");
    setRaiseRequestNotes("");
    setMarkPaidInCash(false);
    setShowRaiseModal(true);
  }

  function openEditCashModal(settlement: VendorCashSettlementRecord) {
    setEditingSettlement(settlement);
    setRaisePhotoUrl(settlement.receiptUrl || "");
    setRaiseAmount(String(settlement.settlementAmount ?? ""));
    setRaiseRequestNotes(settlement.description || "");
    setMarkPaidInCash(
      settlement.status === "Finance Verification Pending" ||
      settlement.status === "Vendor Acknowledged"
    );
    setShowRaiseModal(true);
  }

  const handleRaiseSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!raiseAmount || !raiseRequestNotes) return;
    if (editingSettlement && !onEditCashBill) return;
    if (!editingSettlement && !onRaiseCashBill) return;

    setIsRaising(true);
    try {
      if (editingSettlement && onEditCashBill) {
        await onEditCashBill(
          editingSettlement.id,
          raisePhotoUrl,
          parseFloat(raiseAmount),
          raiseRequestNotes,
          markPaidInCash
        );
      } else if (onRaiseCashBill) {
        await onRaiseCashBill(
          raisePhotoUrl,
          parseFloat(raiseAmount),
          raiseRequestNotes,
          markPaidInCash
        );
      }
      setShowRaiseModal(false);
      setEditingSettlement(null);
      setRaisePhotoUrl("");
      setRaiseAmount("");
      setRaiseRequestNotes("");
      setMarkPaidInCash(false);
    } catch (err) {
      console.error(err);
      alert(
        (editingSettlement ? "Failed to update cash bill: " : "Failed to raise cash bill: ") +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsRaising(false);
    }
  };

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
          {t("loadingCashRecords")}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
                {t("cashEyebrow")}
              </p>

              <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
                {t("cashPageTitle")}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#77736C]">
                {t("cashSubtitle")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCreateCashModal}
                className="inline-flex items-center gap-2 bg-[#171717] px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-[#A58A64] transition-colors shadow-sm"
              >
                <Plus size={14} /> {t("raiseCashBill")}
              </button>
            </div>
          </div>
        </header>

        {/* Important Notice */}
        <section className="mt-8 flex items-start gap-4 border border-[#E8DFCE] bg-[#F8F4EB] p-6">
          <ShieldCheck
            size={22}
            className="mt-1 shrink-0 text-[#94743F]"
          />

          <div>
            <h2 className="text-sm font-medium text-[#6F5C39]">
              {t("twoPartyNoticeTitle")}
            </h2>

            <p className="mt-2 text-xs leading-7 text-[#806D4A]">
              {t("twoPartyNoticeBody")}
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
              {t("settlementRecords")}
            </p>

            <h2 className="mt-3 font-serif text-3xl text-[#171717]">
              {t("yourSettlements")}
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
                {t("noSettlementRecords")}
              </h3>

              <p className="mt-3 text-sm text-[#77736C]">
                {t("noSettlementsDesc")}
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
                        {t("recordedSettlementAmount")}
                      </p>

                      <p className="mt-3 font-serif text-3xl text-[#171717]">
                        {formatCurrency(settlement.settlementAmount)}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <Detail
                        icon={<CalendarDays size={15} />}
                        label={t("settlementDate")}
                        value={formatDate(settlement.settlementDate)}
                      />

                      <Detail
                        icon={<FileText size={15} />}
                        label={t("recordedBy")}
                        value={settlement.recordedBy}
                      />

                      <Detail
                        icon={<Clock3 size={15} />}
                        label={t("vendorResponse")}
                        value={
                          settlement.vendorAcknowledgedAt
                            ? formatDate(settlement.vendorAcknowledgedAt)
                            : t("awaitingResponse")
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
                            {t("acknowledgeReceipt")}
                          </button>

                          {onDirectMarkPaidInCash && (
                            <button
                              type="button"
                              onClick={async () => {
                                setDirectUpdatingId(settlement.id);
                                try {
                                  await onDirectMarkPaidInCash(settlement.id);
                                } finally {
                                  setDirectUpdatingId(null);
                                }
                              }}
                              disabled={Boolean(submittingId) || directUpdatingId === settlement.id}
                              className="inline-flex items-center gap-1.5 bg-[#2D6A4F] px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-white hover:bg-[#1B4332] transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              {directUpdatingId === settlement.id ? "Updating..." : "Directly Update: Paid in Cash"}
                            </button>
                          )}
                        </>
                      )}

                      {onEditCashBill &&
                        settlement.status !== "Finance Verified" &&
                        settlement.status !== "Rejected" && (
                          <button
                            type="button"
                            onClick={() => openEditCashModal(settlement)}
                            disabled={Boolean(submittingId)}
                            className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-white px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-[#171717] hover:border-[#A58A64] transition-colors disabled:opacity-50"
                          >
                            <Edit3 size={14} className="text-[#A58A64]" />
                            Edit
                          </button>
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

              <form onSubmit={handleSubmit}>
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
                    type="submit"
                    disabled={Boolean(submittingId)}
                    className="bg-[#171717] px-6 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
                  >
                    {submittingId === selectedSettlement.id
                      ? "Processing..."
                      : decision === "ACKNOWLEDGE"
                        ? "Confirm Receipt"
                        : "Submit Dispute"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* Raise a Cash Bill Modal */}
        {showRaiseModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onClick={() => setShowRaiseModal(false)}
            data-lenis-prevent
          >
            <div
              className="relative w-full max-w-lg border border-[#D8D6D0] bg-[#F2F0EB] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#D8D6D0] pb-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                    {editingSettlement ? editingSettlement.referenceCode : "Physical Site Settlement"}
                  </p>
                  <h3 className="font-serif text-xl text-[#171717]">
                    {editingSettlement ? "Edit Cash Bill" : "Raise a Cash Bill"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowRaiseModal(false);
                    setEditingSettlement(null);
                  }}
                  className="flex h-8 w-8 items-center justify-center border border-[#D8D6D0] bg-white text-[#777] hover:text-[#111]"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRaiseSubmit} className="mt-4 space-y-4 font-mono text-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                    Cash Bill Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 35000"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white p-2.5 text-[#111] focus:border-[#A58A64] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                    Cash Request &amp; Purpose Notes *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Specify cash purpose: e.g. Site emergency procurement, daily wage labour cash payout, site diesel delivery..."
                    value={raiseRequestNotes}
                    onChange={(e) => setRaiseRequestNotes(e.target.value)}
                    className="w-full border border-[#D8D6D0] bg-white p-2.5 text-[#111] focus:border-[#A58A64] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[#555] mb-1">
                    Bill Photograph / Physical Cash Voucher Receipt
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setRaisePhotoUrl(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full border border-[#D8D6D0] bg-white p-2 text-[#333] file:mr-3 file:border-0 file:bg-[#171717] file:px-3 file:py-1 file:font-mono file:text-[10px] file:uppercase file:text-white hover:file:bg-[#A58A64]"
                  />
                </div>

                {raisePhotoUrl && (
                  <div className="border border-[#D8D6D0] bg-white p-2 text-center">
                    {raisePhotoUrl.startsWith("data:application/pdf") ? (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs text-[#4F4B45]">
                        <FileText size={16} className="text-[#A58A64]" />
                        <span>PDF Voucher Attached</span>
                      </div>
                    ) : (
                      <img src={raisePhotoUrl} alt="Bill Preview" className="max-h-32 mx-auto object-contain" />
                    )}
                  </div>
                )}

                {/* Option to directly update to show bill paid in cash */}
                <div className="flex items-start gap-3 rounded bg-[#FAF9F5] border border-[#EAE8E3] p-3">
                  <input
                    type="checkbox"
                    id="markPaidInCashToggle"
                    checked={markPaidInCash}
                    onChange={(e) => setMarkPaidInCash(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2D6A4F] focus:ring-[#2D6A4F]"
                  />
                  <label htmlFor="markPaidInCashToggle" className="cursor-pointer text-[11px] text-[#333]">
                    <strong>Directly update to show bill paid in cash</strong>
                    <span className="block text-[10px] text-[#777] mt-0.5">
                      Check this if physical cash handover has already been received on site.
                    </span>
                  </label>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-2 border-t border-[#D8D6D0]">
                  <button
                    type="button"
                    onClick={() => setShowRaiseModal(false)}
                    className="border border-[#D8D6D0] bg-white px-4 py-2 uppercase tracking-wider text-[#555] hover:bg-[#e8e6e1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRaising}
                    className="bg-[#171717] px-5 py-2 uppercase tracking-wider text-white hover:bg-[#A58A64] disabled:opacity-50"
                  >
                    {isRaising
                      ? "Submitting..."
                      : editingSettlement
                        ? "Save Changes"
                        : markPaidInCash
                          ? "Raise & Mark Paid in Cash"
                          : "Raise Cash Request"}
                  </button>
                </div>
              </form>
            </div>
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
