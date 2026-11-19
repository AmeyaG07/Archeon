
"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  FileText,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export interface VendorInvoiceProject {
  id: string;
  projectName: string;
  referenceCode: string;
}

export interface VendorInvoiceLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface VendorInvoiceSubmissionData {
  projectId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendorGstin: string;
  placeOfSupply: string;
  taxRate: number;
  notes: string;
  lineItems: VendorInvoiceLineItem[];
  attachments: File[];
}

interface VendorInvoiceSubmissionFormProps {
  projects: VendorInvoiceProject[];
  submitting?: boolean;
  error?: string;
  onSubmit: (
    data: VendorInvoiceSubmissionData
  ) => void | Promise<void>;
  onCancel?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const initialLineItem: VendorInvoiceLineItem = {
  description: "",
  quantity: 1,
  unit: "Nos",
  unitPrice: 0,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function VendorInvoiceSubmissionForm({
  projects,
  submitting = false,
  error,
  onSubmit,
  onCancel,
}: VendorInvoiceSubmissionFormProps) {
  const [projectId, setProjectId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [vendorGstin, setVendorGstin] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<
    VendorInvoiceLineItem[]
  >([{ ...initialLineItem }]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [validationError, setValidationError] = useState("");

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((total, item) => {
      return total + item.quantity * item.unitPrice;
    }, 0);

    const rate = Number(taxRate) || 0;
    const taxAmount = subtotal * (rate / 100);

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  }, [lineItems, taxRate]);

  function updateLineItem(
    index: number,
    field: keyof VendorInvoiceLineItem,
    value: string
  ) {
    setLineItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "description" || field === "unit") {
          return { ...item, [field]: value };
        }

        return {
          ...item,
          [field]: Math.max(0, Number(value) || 0),
        };
      })
    );
  }

  function addLineItem() {
    setLineItems((current) => [
      ...current,
      { ...initialLineItem },
    ]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) =>
      current.length === 1
        ? current
        : current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const selected = Array.from(files);

    if (attachments.length + selected.length > MAX_FILES) {
      setValidationError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    const invalidFile = selected.find(
      (file) =>
        !ACCEPTED_FILE_TYPES.includes(file.type) ||
        file.size > MAX_FILE_SIZE
    );

    if (invalidFile) {
      setValidationError(
        "Only PDF, JPG and PNG files up to 10 MB each are accepted."
      );
      return;
    }

    setValidationError("");
    setAttachments((current) => [...current, ...selected]);
  }

  function validate(): string | null {
    if (!projectId) return "Select an assigned project.";

    if (!invoiceNumber.trim()) {
      return "Enter the invoice number.";
    }

    if (!invoiceDate) return "Select the invoice date.";

    if (!dueDate) return "Select the payment due date.";

    if (dueDate < invoiceDate) {
      return "The due date cannot be earlier than the invoice date.";
    }

    if (
      !lineItems.length ||
      lineItems.some(
        (item) =>
          !item.description.trim() ||
          item.quantity <= 0 ||
          item.unitPrice < 0 ||
          !item.unit.trim()
      )
    ) {
      return "Complete every invoice line item with valid values.";
    }

    if (!Number.isFinite(Number(taxRate)) ||
        Number(taxRate) < 0 ||
        Number(taxRate) > 100) {
      return "Enter a valid tax rate between 0 and 100.";
    }

    if (totals.total <= 0) {
      return "The invoice total must be greater than zero.";
    }

    if (attachments.length === 0) {
      return "Attach at least one supporting invoice document.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    const problem = validate();

    if (problem) {
      setValidationError(problem);
      return;
    }

    setValidationError("");

    await onSubmit({
      projectId,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      dueDate,
      vendorGstin: vendorGstin.trim(),
      placeOfSupply: placeOfSupply.trim(),
      taxRate: Number(taxRate),
      notes: notes.trim(),
      lineItems: lineItems.map((item) => ({ ...item })),
      attachments,
    });
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="border-b border-[#D8D6D0] pb-8">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mb-7 inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
            >
              <ArrowLeft size={15} />
              Back to Vendor Portal
            </button>
          )}

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Vendor Portal / Finance
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Submit Invoice
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Submit your invoice against an assigned project.
            Provide accurate billing information and attach the
            supporting invoice document.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-9 space-y-9">

          {/* Project and Invoice Details */}
          <section className="border border-[#D8D6D0] bg-white p-6 md:p-8">
            <SectionHeading
              number="01"
              title="Project & Invoice Details"
            />

            <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Assigned Project" required>
                <select
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  required
                  disabled={submitting}
                  className="invoice-input"
                >
                  <option value="">Select assigned project</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.projectName} — {project.referenceCode}
                    </option>
                  ))}
                </select>

                {projects.length === 0 && (
                  <p className="mt-2 text-xs text-[#9A5147]">
                    No assigned projects are available for invoicing.
                  </p>
                )}
              </Field>

              <Field label="Invoice Number" required>
                <input
                  value={invoiceNumber}
                  onChange={(event) =>
                    setInvoiceNumber(event.target.value)
                  }
                  placeholder="e.g. INV-2026-001"
                  required
                  disabled={submitting}
                  maxLength={80}
                  className="invoice-input"
                />
              </Field>

              <Field label="Invoice Date" required>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(event) =>
                    setInvoiceDate(event.target.value)
                  }
                  required
                  disabled={submitting}
                  className="invoice-input"
                />
              </Field>

              <Field label="Payment Due Date" required>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(event.target.value)
                  }
                  min={invoiceDate || undefined}
                  required
                  disabled={submitting}
                  className="invoice-input"
                />
              </Field>
            </div>
          </section>

          {/* Tax Details */}
          <section className="border border-[#D8D6D0] bg-white p-6 md:p-8">
            <SectionHeading
              number="02"
              title="Tax & Billing Details"
            />

            <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Vendor GSTIN">
                <input
                  value={vendorGstin}
                  onChange={(event) =>
                    setVendorGstin(event.target.value.toUpperCase())
                  }
                  placeholder="Enter GSTIN, if applicable"
                  maxLength={15}
                  disabled={submitting}
                  className="invoice-input"
                />
              </Field>

              <Field label="Place of Supply">
                <input
                  value={placeOfSupply}
                  onChange={(event) =>
                    setPlaceOfSupply(event.target.value)
                  }
                  placeholder="State / Union Territory"
                  maxLength={100}
                  disabled={submitting}
                  className="invoice-input"
                />
              </Field>

              <Field label="Tax Rate (%)" required>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                  required
                  disabled={submitting}
                  className="invoice-input"
                />
              </Field>
            </div>

            <p className="mt-5 text-xs leading-6 text-[#99958D]">
              Enter the tax rate applicable to your invoice. The
              submitted rate and tax treatment must be verified
              against the actual invoice and applicable tax rules.
            </p>
          </section>

          {/* Line Items */}
          <section className="border border-[#D8D6D0] bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <SectionHeading
                number="03"
                title="Invoice Line Items"
              />

              <button
                type="button"
                onClick={addLineItem}
                disabled={submitting}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#987543] hover:text-[#171717] disabled:opacity-40"
              >
                <Plus size={15} />
                Add Item
              </button>
            </div>

            <div className="mt-7 space-y-5">
              {lineItems.map((item, index) => (
                <div
                  key={index}
                  className="border border-[#E5E2DC] p-5"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                      Item {String(index + 1).padStart(2, "0")}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      disabled={submitting || lineItems.length === 1}
                      aria-label={`Remove invoice item ${index + 1}`}
                      className="text-[#99958D] hover:text-[#9A5147] disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Description" required>
                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateLineItem(
                            index,
                            "description",
                            event.target.value
                          )
                        }
                        placeholder="Work or material description"
                        maxLength={250}
                        required
                        disabled={submitting}
                        className="invoice-input"
                      />
                    </Field>

                    <Field label="Unit" required>
                      <input
                        value={item.unit}
                        onChange={(event) =>
                          updateLineItem(index, "unit", event.target.value)
                        }
                        placeholder="Nos, Sq.ft, Hours..."
                        maxLength={30}
                        required
                        disabled={submitting}
                        className="invoice-input"
                      />
                    </Field>

                    <Field label="Quantity" required>
                      <input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={item.quantity}
                        onChange={(event) =>
                          updateLineItem(
                            index,
                            "quantity",
                            event.target.value
                          )
                        }
                        required
                        disabled={submitting}
                        className="invoice-input"
                      />
                    </Field>

                    <Field label="Unit Price (₹)" required>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateLineItem(
                            index,
                            "unitPrice",
                            event.target.value
                          )
                        }
                        required
                        disabled={submitting}
                        className="invoice-input"
                      />
                    </Field>
                  </div>

                  <div className="mt-5 flex justify-between border-t border-[#E5E2DC] pt-4">
                    <span className="text-xs text-[#99958D]">
                      Line Total
                    </span>

                    <span className="text-sm font-medium text-[#33312D]">
                      {formatCurrency(
                        item.quantity * item.unitPrice
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Invoice Summary */}
          <section className="border border-[#D8D6D0] bg-white p-6 md:p-8">
            <SectionHeading
              number="04"
              title="Invoice Summary"
            />

            <div className="ml-auto mt-7 max-w-sm space-y-4">
              <TotalRow
                label="Subtotal"
                value={formatCurrency(totals.subtotal)}
              />

              <TotalRow
                label={`Tax (${Number(taxRate) || 0}%)`}
                value={formatCurrency(totals.taxAmount)}
              />

              <div className="border-t border-[#D8D6D0] pt-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-serif text-xl text-[#171717]">
                    Invoice Total
                  </span>

                  <span className="font-serif text-2xl text-[#A58A64]">
                    {formatCurrency(totals.total)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Attachments */}
          <section className="border border-[#D8D6D0] bg-white p-6 md:p-8">
            <SectionHeading
              number="05"
              title="Supporting Documents"
            />

            <div className="mt-7">
              <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-[#C9C4BA] bg-[#FAF9F6] px-6 py-10 text-center transition-colors hover:border-[#A58A64]">
                <Upload
                  size={24}
                  className="text-[#A58A64]"
                />

                <span className="mt-4 text-sm text-[#33312D]">
                  Upload invoice and supporting files
                </span>

                <span className="mt-2 text-xs text-[#99958D]">
                  PDF, JPG or PNG · Maximum 10 MB per file · Up to 5 files
                </span>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  disabled={submitting || attachments.length >= MAX_FILES}
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                  className="sr-only"
                />
              </label>

              {attachments.length > 0 && (
                <div className="mt-5 space-y-3">
                  {attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center gap-3 border border-[#E5E2DC] p-4"
                    >
                      <FileText
                        size={17}
                        className="shrink-0 text-[#A58A64]"
                      />

                      <span className="min-w-0 flex-1 truncate text-xs text-[#33312D]">
                        {file.name}
                      </span>

                      <span className="shrink-0 font-mono text-[9px] text-[#99958D]">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((current) =>
                            current.filter((_, i) => i !== index)
                          )
                        }
                        disabled={submitting}
                        aria-label={`Remove ${file.name}`}
                        className="text-[#99958D] hover:text-[#9A5147]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Notes */}
          <section className="border border-[#D8D6D0] bg-white p-6 md:p-8">
            <SectionHeading
              number="06"
              title="Additional Notes"
            />

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add relevant billing notes or clarifications..."
              rows={4}
              maxLength={2000}
              disabled={submitting}
              className="invoice-input mt-7 resize-y"
            />
          </section>

          {/* Validation and Backend Error */}
          {(validationError || error) && (
            <div
              role="alert"
              className="flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-5"
            >
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-[#9A5147]"
              />

              <p className="text-xs leading-6 text-[#805B55]">
                {validationError || error}
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
            <ShieldCheck
              size={20}
              className="mt-1 shrink-0 text-[#A58A64]"
            />

            <p className="text-xs leading-6 text-[#77736C]">
              Submission does not mean invoice approval or payment.
              The studio&apos;s authorised finance team must review the
              invoice and supporting documents before approval.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse justify-end gap-4 sm:flex-row">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="border border-[#D8D6D0] px-8 py-4 text-[10px] uppercase tracking-widest text-[#77736C] hover:border-[#A58A64] disabled:opacity-40"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={submitting || projects.length === 0}
              className="bg-[#171717] px-9 py-4 text-[10px] uppercase tracking-widest text-white transition-colors hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Invoice"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function SectionHeading({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-mono text-[10px] text-[#A58A64]">
        {number}
      </span>

      <h2 className="font-serif text-2xl text-[#171717]">
        {title}
      </h2>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
        {label}
        {required && <span className="ml-1 text-[#A58A64]">*</span>}
      </span>

      {children}
    </label>
  );
}

function TotalRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[#77736C]">{label}</span>
      <span className="text-sm text-[#33312D]">{value}</span>
    </div>
  );
}
