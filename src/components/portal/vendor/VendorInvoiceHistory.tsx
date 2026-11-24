
"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  FileText,
  Search,
  Filter,
  Clock3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  CalendarDays,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export type VendorInvoiceStatus =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Partially Approved"
  | "Rejected"
  | "Payment Processing"
  | "Partially Paid"
  | "Paid";

export interface VendorInvoiceRecord {
  id: string;
  invoiceNumber: string;
  projectName: string;
  projectReference: string;
  invoiceDate: string;
  submittedAt: string;
  dueDate: string;
  submittedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  status: VendorInvoiceStatus;
  financeRemark?: string;
  lastUpdatedAt: string;
}

interface VendorInvoiceHistoryProps {
  invoices: VendorInvoiceRecord[];
  loading?: boolean;
  error?: string;
  onOpenInvoice: (invoice: VendorInvoiceRecord) => void;
  onRefresh?: () => void;
}

type FilterStatus = "All" | VendorInvoiceStatus;

const FILTERS: FilterStatus[] = [
  "All",
  "Submitted",
  "Under Review",
  "Approved",
  "Partially Approved",
  "Rejected",
  "Payment Processing",
  "Partially Paid",
  "Paid",
];

function formatCurrency(value = 0) {
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
  }).format(date);
}

function getStatusPresentation(status: VendorInvoiceStatus) {
  switch (status) {
    case "Paid":
      return {
        icon: CheckCircle2,
        className: "bg-[#EAF1E8] text-[#547A51]",
      };

    case "Approved":
      return {
        icon: CheckCircle2,
        className: "bg-[#EAF0F5] text-[#58738C]",
      };

    case "Partially Approved":
    case "Partially Paid":
      return {
        icon: AlertCircle,
        className: "bg-[#F4EFE2] text-[#94743F]",
      };

    case "Rejected":
      return {
        icon: XCircle,
        className: "bg-[#F8EAE7] text-[#9A5147]",
      };

    case "Payment Processing":
      return {
        icon: IndianRupee,
        className: "bg-[#F1ECF6] text-[#78628D]",
      };

    case "Under Review":
      return {
        icon: Clock3,
        className: "bg-[#EAF0F5] text-[#58738C]",
      };

    default:
      return {
        icon: FileText,
        className: "bg-[#ECEAE5] text-[#77736C]",
      };
  }
}

export function VendorInvoiceHistory({
  invoices,
  loading = false,
  error,
  onOpenInvoice,
  onRefresh,
}: VendorInvoiceHistoryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("All");

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.projectName.toLowerCase().includes(query) ||
        invoice.projectReference.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const summary = useMemo(() => {
    return invoices.reduce(
      (result, invoice) => {
        result.submitted += invoice.submittedAmount;
        result.approved += invoice.approvedAmount ?? 0;
        result.paid += invoice.paidAmount ?? 0;

        if (
          invoice.status === "Submitted" ||
          invoice.status === "Under Review"
        ) {
          result.underReview += 1;
        }

        if (invoice.status === "Rejected") {
          result.rejected += 1;
        }

        return result;
      },
      {
        submitted: 0,
        approved: 0,
        paid: 0,
        underReview: 0,
        rejected: 0,
      }
    );
  }, [invoices]);

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading invoice records...
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
          Invoice records unavailable
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
            Retry
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
            Vendor Portal / Finance
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Invoice History
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Track submitted invoices, review decisions and recorded
            payments associated with your project assignments.
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
            >
              <RefreshCw size={14} />
              Refresh Records
            </button>
          )}
        </header>

        {/* Financial Summary */}
        <section className="mt-9 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Submitted Value"
            value={formatCurrency(summary.submitted)}
          />

          <SummaryCard
            label="Approved Value"
            value={formatCurrency(summary.approved)}
          />

          <SummaryCard
            label="Recorded Payments"
            value={formatCurrency(summary.paid)}
          />

          <SummaryCard
            label="Under Review"
            value={String(summary.underReview)}
          />
        </section>

        {/* Search and Filter */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-5 border-b border-[#D8D6D0] pb-5 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Financial Records
              </p>

              <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                Your Invoices
              </h2>
            </div>

            <span className="font-mono text-[10px] text-[#99958D]">
              {filteredInvoices.length} RECORDS
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
                placeholder="Search invoice number or project..."
                aria-label="Search invoices"
                className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
              />
            </div>

            <div className="relative md:w-64">
              <Filter
                size={15}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as FilterStatus)
                }
                aria-label="Filter invoices by status"
                className="h-12 w-full appearance-none border border-[#D8D6D0] bg-white pl-10 pr-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
              >
                {FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter === "All" ? "All Statuses" : filter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoice Records */}
          <div className="mt-7 space-y-4">
            {filteredInvoices.length === 0 ? (
              <div className="border border-[#D8D6D0] bg-white px-6 py-16 text-center">
                <FileText
                  size={28}
                  strokeWidth={1.3}
                  className="mx-auto text-[#A58A64]"
                />

                <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                  No invoices found
                </h3>

                <p className="mt-3 text-sm text-[#77736C]">
                  Try changing your search or status filter.
                </p>
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onOpen={() => onOpenInvoice(invoice)}
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
            Invoice statuses and payment records are supplied by the
            studio&apos;s finance system. A submitted invoice is not
            evidence of approval or payment. Only verified finance
            records determine payment status.
          </p>
        </div>

        <footer className="mt-12 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / CONFIDENTIAL VENDOR WORKSPACE
          </p>
        </footer>
      </div>
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
    <div className="bg-white p-6 md:p-7">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-6 break-words font-serif text-2xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function InvoiceCard({
  invoice,
  onOpen,
}: {
  invoice: VendorInvoiceRecord;
  onOpen: () => void;
}) {
  const presentation = getStatusPresentation(invoice.status);
  const StatusIcon = presentation.icon;

  const approved = invoice.approvedAmount ?? 0;
  const paid = invoice.paidAmount ?? 0;

  return (
    <article className="border border-[#D8D6D0] bg-white p-6 md:p-7">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            Invoice Reference
          </p>

          <h3 className="mt-3 font-serif text-2xl text-[#171717]">
            {invoice.invoiceNumber}
          </h3>

          <p className="mt-2 text-xs text-[#77736C]">
            {invoice.projectName}
          </p>

          <p className="mt-1 font-mono text-[9px] text-[#99958D]">
            {invoice.projectReference}
          </p>
        </div>

        <span
          className={`inline-flex w-fit items-center gap-2 px-3 py-2 text-[9px] uppercase tracking-widest ${presentation.className}`}
        >
          <StatusIcon size={13} />
          {invoice.status}
        </span>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 border-t border-[#E5E2DC] pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <AmountItem
          label="Submitted"
          value={formatCurrency(invoice.submittedAmount)}
        />

        <AmountItem
          label="Approved"
          value={formatCurrency(approved)}
        />

        <AmountItem
          label="Paid"
          value={formatCurrency(paid)}
        />

        <AmountItem
          label="Remaining Approved"
          value={formatCurrency(Math.max(0, approved - paid))}
        />
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 border-t border-[#E5E2DC] pt-6 sm:grid-cols-3">
        <DateItem label="Invoice Date" value={invoice.invoiceDate} />
        <DateItem label="Submitted On" value={invoice.submittedAt} />
        <DateItem label="Payment Due" value={invoice.dueDate} />
      </div>

      {invoice.financeRemark && (
        <div className="mt-6 border border-[#E8DFCE] bg-[#F8F4EB] p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#94743F]">
            Finance Remark
          </p>

          <p className="mt-3 text-xs leading-7 text-[#6F5C39]">
            {invoice.financeRemark}
          </p>
        </div>
      )}

      <div className="mt-7 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-5 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-[10px] text-[#99958D]">
          <CalendarDays size={14} />
          Updated {formatDate(invoice.lastUpdatedAt)}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
        >
          View Invoice Details
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}

function AmountItem({
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

      <p className="mt-3 text-sm font-medium text-[#33312D]">
        {value}
      </p>
    </div>
  );
}

function DateItem({
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
        {formatDate(value)}
      </p>
    </div>
  );
}
