
"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  ShieldCheck,
} from "lucide-react";

export type InvoiceDisputeReason =
  | "Incorrect Amount"
  | "Duplicate Invoice"
  | "Payment Not Reflected"
  | "Incorrect Service or Work"
  | "Unclear Invoice Details"
  | "Other";

export interface InvoiceDisputeSubmission {
  invoiceId: string;
  reason: InvoiceDisputeReason;
  explanation: string;
  supportingFiles: File[];
}

interface ClientInvoiceDisputeFormProps {
  invoiceId: string;
  invoiceNumber: string;
  projectName: string;
  invoiceAmount: number;
  submitting?: boolean;
  error?: string;
  onSubmit: (
    data: InvoiceDisputeSubmission
  ) => void | Promise<void>;
  onCancel: () => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const disputeReasons: InvoiceDisputeReason[] = [
  "Incorrect Amount",
  "Duplicate Invoice",
  "Payment Not Reflected",
  "Incorrect Service or Work",
  "Unclear Invoice Details",
  "Other",
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function ClientInvoiceDisputeForm({
  invoiceId,
  invoiceNumber,
  projectName,
  invoiceAmount,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}: ClientInvoiceDisputeFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reason, setReason] =
    useState<InvoiceDisputeReason>("Incorrect Amount");

  const [explanation, setExplanation] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState("");

  function handleFiles(files: FileList | null) {
    if (!files) return;

    setValidationError("");

    const selectedFiles = Array.from(files);

    if (supportingFiles.length + selectedFiles.length > MAX_FILES) {
      setValidationError(`You can attach a maximum of ${MAX_FILES} files.`);
      return;
    }

    for (const file of selectedFiles) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setValidationError(
          "Only PDF, JPG, PNG and WEBP files are accepted."
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setValidationError(
          `Each file must be smaller than 10 MB.`
        );
        return;
      }
    }

    setSupportingFiles((previous) => [
      ...previous,
      ...selectedFiles,
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setSupportingFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index)
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const cleanExplanation = explanation.trim();

    if (cleanExplanation.length < 20) {
      setValidationError(
        "Please explain the dispute in at least 20 characters."
      );
      return;
    }

    if (cleanExplanation.length > 3000) {
      setValidationError(
        "Your explanation cannot exceed 3,000 characters."
      );
      return;
    }

    await onSubmit({
      invoiceId,
      reason,
      explanation: cleanExplanation,
      supportingFiles,
    });
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-3xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Portal / Financial Review
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Raise an Invoice Dispute
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Tell us what is incorrect or unclear about this invoice.
            The finance team will review your submission.
          </p>
        </header>

        {/* Invoice Information */}
        <section className="mt-8 border border-[#D8D6D0] bg-white p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            Invoice Under Dispute
          </p>

          <h2 className="mt-4 font-serif text-2xl text-[#171717]">
            {invoiceNumber}
          </h2>

          <p className="mt-2 text-sm text-[#77736C]">
            {projectName}
          </p>

          <div className="mt-6 border-t border-[#E5E2DC] pt-5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
              Invoice Amount
            </p>

            <p className="mt-2 font-serif text-2xl text-[#171717]">
              {formatCurrency(invoiceAmount)}
            </p>
          </div>
        </section>

        {/* Dispute Form */}
        <form onSubmit={handleSubmit} className="mt-10 space-y-8">

          {/* Reason */}
          <div>
            <label
              htmlFor="dispute-reason"
              className="block text-xs font-medium text-[#33312D]"
            >
              Reason for Dispute *
            </label>

            <select
              id="dispute-reason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as InvoiceDisputeReason)
              }
              disabled={submitting}
              className="mt-3 w-full border border-[#D8D6D0] bg-white px-4 py-4 text-sm text-[#171717] outline-none focus:border-[#A58A64]"
            >
              {disputeReasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Explanation */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="dispute-explanation"
                className="block text-xs font-medium text-[#33312D]"
              >
                Explain the Issue *
              </label>

              <span className="font-mono text-[9px] text-[#99958D]">
                {explanation.length}/3000
              </span>
            </div>

            <textarea
              id="dispute-explanation"
              rows={7}
              minLength={20}
              maxLength={3000}
              required
              value={explanation}
              onChange={(event) =>
                setExplanation(event.target.value)
              }
              disabled={submitting}
              placeholder="Describe the invoice issue clearly. Include relevant dates, amounts or work details where applicable."
              className="mt-3 w-full resize-y border border-[#D8D6D0] bg-white px-4 py-4 text-sm leading-7 text-[#171717] outline-none focus:border-[#A58A64]"
            />
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-xs font-medium text-[#33312D]">
              Supporting Evidence (Optional)
            </label>

            <p className="mt-2 text-xs leading-6 text-[#99958D]">
              Attach relevant receipts, correspondence or documents
              that help explain your dispute.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              disabled={submitting || supportingFiles.length >= MAX_FILES}
              className="hidden"
              onChange={(event) =>
                handleFiles(event.target.files)
              }
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting || supportingFiles.length >= MAX_FILES}
              className="mt-4 flex w-full flex-col items-center border border-dashed border-[#C8C4BB] bg-white px-6 py-9 text-center transition-colors hover:border-[#A58A64] disabled:opacity-40"
            >
              <Upload size={24} className="text-[#A58A64]" />

              <span className="mt-4 text-sm text-[#33312D]">
                Attach Supporting Files
              </span>

              <span className="mt-2 text-[10px] text-[#99958D]">
                Maximum 5 files · 10 MB per file
              </span>
            </button>

            {supportingFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {supportingFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-4 border border-[#D8D6D0] bg-white p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {file.type === "application/pdf" ? (
                        <FileText
                          size={18}
                          className="shrink-0 text-[#A58A64]"
                        />
                      ) : (
                        <ImageIcon
                          size={18}
                          className="shrink-0 text-[#A58A64]"
                        />
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-xs text-[#33312D]">
                          {file.name}
                        </p>

                        <p className="mt-1 text-[10px] text-[#99958D]">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={submitting}
                      aria-label={`Remove ${file.name}`}
                      className="shrink-0 text-[#99958D] hover:text-[#9A5147]"
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
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

          {/* Review Notice */}
          <div className="flex items-start gap-3 border border-[#D8D6D0] bg-[#ECEAE5] p-5">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-[#A58A64]"
            />

            <p className="text-xs leading-6 text-[#77736C]">
              Submitting a dispute sends it for review. The invoice
              will not automatically be cancelled or marked as paid.
              Any payment reminders or collection actions must follow
              the studio&apos;s authorised dispute policy.
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
              disabled={submitting}
              className="bg-[#171717] px-8 py-4 text-xs uppercase tracking-widest text-white transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Dispute"}
            </button>
          </div>
        </form>

        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL CLIENT RECORD
          </p>
        </footer>
      </div>
    </main>
  );
}
