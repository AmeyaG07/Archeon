
"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  Upload,
  FileImage,
  FileText,
  X,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface PaymentProofSubmission {
  invoiceId: string;
  amountPaid: number;
  paymentMethod: "UPI" | "Bank Transfer" | "NEFT" | "RTGS" | "Other";
  transactionReference: string;
  paymentDate: string;
  notes: string;
  proofFile: File;
}

interface ClientPaymentProofFormProps {
  invoiceId: string;
  invoiceNumber: string;
  outstandingAmount: number;
  submitting?: boolean;
  error?: string;
  onSubmit: (
    data: PaymentProofSubmission
  ) => void | Promise<void>;
  onCancel: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function ClientPaymentProofForm({
  invoiceId,
  invoiceNumber,
  outstandingAmount,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}: ClientPaymentProofFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentProofSubmission["paymentMethod"]>("UPI");
  const [transactionReference, setTransactionReference] =
    useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState("");

  function handleFileChange(file: File | null) {
    setValidationError("");

    if (!file) {
      setProofFile(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setValidationError(
        "Please select a PDF, JPG, PNG or WEBP file."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(
        "The selected file exceeds the 10 MB limit."
      );
      return;
    }

    setProofFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const amount = Number(amountPaid);

    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError("Enter a valid payment amount.");
      return;
    }

    if (amount > outstandingAmount) {
      setValidationError(
        "The submitted amount cannot exceed the outstanding balance."
      );
      return;
    }

    if (!transactionReference.trim()) {
      setValidationError(
        "Enter the transaction reference or UTR number."
      );
      return;
    }

    if (!paymentDate) {
      setValidationError("Select the payment date.");
      return;
    }

    if (new Date(paymentDate).getTime() > Date.now()) {
      setValidationError(
        "The payment date cannot be in the future."
      );
      return;
    }

    if (!proofFile) {
      setValidationError("Attach your payment proof.");
      return;
    }

    await onSubmit({
      invoiceId,
      amountPaid: amount,
      paymentMethod,
      transactionReference: transactionReference.trim(),
      paymentDate,
      notes: notes.trim(),
      proofFile,
    });
  }

  return (
    <section className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Portal / Payment Verification
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Submit Payment Proof
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#77736C]">
            Provide your transaction details and upload the
            corresponding payment receipt.
          </p>
        </header>

        {/* Invoice Reference */}
        <div className="mt-8 border border-[#D8D6D0] bg-white p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            Selected Invoice
          </p>

          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl text-[#171717]">
                {invoiceNumber}
              </h2>

              <p className="mt-2 text-xs text-[#77736C]">
                Invoice reference
              </p>
            </div>

            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                Outstanding Balance
              </p>

              <p className="mt-2 font-serif text-2xl text-[#171717]">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                }).format(outstandingAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-8">

          {/* Amount */}
          <div>
            <label
              htmlFor="payment-amount"
              className="block text-xs font-medium text-[#33312D]"
            >
              Amount Paid (₹) *
            </label>

            <input
              id="payment-amount"
              type="number"
              min="0.01"
              max={outstandingAmount}
              step="0.01"
              required
              value={amountPaid}
              onChange={(event) => setAmountPaid(event.target.value)}
              placeholder="Enter amount paid"
              disabled={submitting}
              className="mt-3 w-full border border-[#D8D6D0] bg-white px-4 py-4 text-sm text-[#171717] outline-none focus:border-[#A58A64]"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label
              htmlFor="payment-method"
              className="block text-xs font-medium text-[#33312D]"
            >
              Payment Method *
            </label>

            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(
                  event.target.value as PaymentProofSubmission["paymentMethod"]
                )
              }
              disabled={submitting}
              className="mt-3 w-full border border-[#D8D6D0] bg-white px-4 py-4 text-sm text-[#171717] outline-none focus:border-[#A58A64]"
            >
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Transaction Reference */}
          <div>
            <label
              htmlFor="transaction-reference"
              className="block text-xs font-medium text-[#33312D]"
            >
              Transaction Reference / UTR *
            </label>

            <input
              id="transaction-reference"
              type="text"
              required
              maxLength={120}
              value={transactionReference}
              onChange={(event) =>
                setTransactionReference(event.target.value)
              }
              placeholder="Enter your transaction reference"
              disabled={submitting}
              className="mt-3 w-full border border-[#D8D6D0] bg-white px-4 py-4 text-sm text-[#171717] outline-none focus:border-[#A58A64]"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label
              htmlFor="payment-date"
              className="block text-xs font-medium text-[#33312D]"
            >
              Payment Date *
            </label>

            <input
              id="payment-date"
              type="date"
              required
              max={new Date().toLocaleDateString("en-CA")}
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              disabled={submitting}
              className="mt-3 w-full border border-[#D8D6D0] bg-white px-4 py-4 text-sm text-[#171717] outline-none focus:border-[#A58A64]"
            />
          </div>

          {/* Proof Upload */}
          <div>
            <label className="block text-xs font-medium text-[#33312D]">
              Payment Receipt / Screenshot *
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              disabled={submitting}
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
            />

            {proofFile ? (
              <div className="mt-3 flex items-center justify-between gap-4 border border-[#D8D6D0] bg-white p-5">
                <div className="flex min-w-0 items-center gap-3">
                  {proofFile.type === "application/pdf" ? (
                    <FileText className="shrink-0 text-[#A58A64]" />
                  ) : (
                    <FileImage className="shrink-0 text-[#A58A64]" />
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#171717]">
                      {proofFile.name}
                    </p>

                    <p className="mt-1 text-[10px] text-[#99958D]">
                      {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProofFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={submitting}
                  aria-label="Remove selected file"
                  className="shrink-0 text-[#99958D] hover:text-[#9A5147]"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
                className="mt-3 flex w-full flex-col items-center border border-dashed border-[#C8C4BB] bg-white px-6 py-10 text-center transition-colors hover:border-[#A58A64]"
              >
                <Upload size={25} className="text-[#A58A64]" />

                <span className="mt-4 text-sm text-[#33312D]">
                  Choose a file to upload
                </span>

                <span className="mt-2 text-[10px] text-[#99958D]">
                  PDF, JPG, PNG or WEBP · Maximum 10 MB
                </span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="payment-notes"
              className="block text-xs font-medium text-[#33312D]"
            >
              Additional Notes (Optional)
            </label>

            <textarea
              id="payment-notes"
              rows={4}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any relevant payment details..."
              disabled={submitting}
              className="mt-3 w-full resize-y border border-[#D8D6D0] bg-white px-4 py-4 text-sm text-[#171717] outline-none focus:border-[#A58A64]"
            />
          </div>

          {/* Validation / API Error */}
          {(validationError || error) && (
            <div
              role="alert"
              className="flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-4"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-[#9A5147]"
              />

              <p className="text-xs leading-6 text-[#805B55]">
                {validationError || error}
              </p>
            </div>
          )}

          {/* Verification Notice */}
          <div className="flex items-start gap-3 border border-[#D8D6D0] bg-[#ECEAE5] p-5">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-[#A58A64]"
            />

            <p className="text-xs leading-6 text-[#77736C]">
              Your submission will be reviewed by the finance team.
              The invoice status will change only after successful
              verification and approval.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-4 border-t border-[#D8D6D0] pt-7 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-7 py-4 text-xs uppercase tracking-widest text-[#77736C] hover:text-[#171717] disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || !proofFile}
              className="bg-[#171717] px-8 py-4 text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Verification"}
            </button>
          </div>
        </form>

        {/* Privacy Footer */}
        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <div className="flex items-center gap-2 text-[#99958D]">
            <CheckCircle2 size={14} />

            <p className="font-mono text-[9px] uppercase tracking-widest">
              Secure Client Financial Submission
            </p>
          </div>
        </footer>
      </div>
    </section>
  );
}
