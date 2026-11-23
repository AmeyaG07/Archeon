
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  IndianRupee,
  Search,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export type VendorPaymentStatus =
  | "Verified"
  | "Reversed"
  | "Returned";

export interface VendorPaymentRecord {
  id: string;
  paymentReference: string;
  projectName: string;
  projectReference: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  transactionReference: string;
  paymentMethod: string;
  status: VendorPaymentStatus;
  remittanceAvailable: boolean;
  financeRemark?: string;
}

interface VendorPaymentHistoryProps {
  payments: VendorPaymentRecord[];
  loading?: boolean;
  error?: string;
  onOpenPayment: (payment: VendorPaymentRecord) => void;
  onDownloadRemittance: (
    payment: VendorPaymentRecord
  ) => void | Promise<void>;
  onRefresh?: () => void;
}

type PaymentFilter = "All" | VendorPaymentStatus;

const FILTERS: PaymentFilter[] = [
  "All",
  "Verified",
  "Reversed",
  "Returned",
];

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

function getStatusStyle(status: VendorPaymentStatus) {
  switch (status) {
    case "Verified":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Reversed":
      return "bg-[#F8EAE7] text-[#9A5147]";

    case "Returned":
      return "bg-[#F4EFE2] text-[#94743F]";
  }
}

export function VendorPaymentHistory({
  payments,
  loading = false,
  error,
  onOpenPayment,
  onDownloadRemittance,
  onRefresh,
}: VendorPaymentHistoryProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<PaymentFilter>("All");

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.paymentReference.toLowerCase().includes(query) ||
        payment.invoiceNumber.toLowerCase().includes(query) ||
        payment.projectName.toLowerCase().includes(query) ||
        payment.transactionReference.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const summary = useMemo(() => {
    return payments.reduce(
      (result, payment) => {
        if (payment.status === "Verified") {
          result.verifiedAmount += payment.amount;
          result.verifiedCount += 1;
        }

        if (payment.status === "Reversed") {
          result.reversedCount += 1;
        }

        if (payment.status === "Returned") {
          result.returnedCount += 1;
        }

        return result;
      },
      {
        verifiedAmount: 0,
        verifiedCount: 0,
        reversedCount: 0,
        returnedCount: 0,
      }
    );
  }, [payments]);

  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading verified payment records...
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
          Payment history unavailable
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
            Vendor Portal / Finance
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Payment History
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Review payments verified by the studio&apos;s finance team.
            Access transaction references and available remittance records.
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

        {/* Summary */}
        <section className="mt-9 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2">
          <SummaryCard
            label="Verified Payment Value"
            value={formatCurrency(summary.verifiedAmount)}
            icon={<IndianRupee size={19} />}
          />

          <SummaryCard
            label="Verified Transactions"
            value={String(summary.verifiedCount)}
            icon={<CheckCircle2 size={19} />}
          />
        </section>

        {/* Search and Filters */}
        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Finance Records
              </p>

              <h2 className="mt-3 font-serif text-3xl text-[#171717]">
                Recorded Payments
              </h2>
            </div>

            <span className="font-mono text-[10px] text-[#99958D]">
              {filteredPayments.length} RECORDS
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
                placeholder="Search payment, invoice or transaction reference..."
                aria-label="Search payment records"
                className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
              />
            </div>

            <div className="md:w-60">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as PaymentFilter)
                }
                aria-label="Filter payments by status"
                className="h-12 w-full border border-[#D8D6D0] bg-white px-4 text-sm text-[#33312D] outline-none focus:border-[#A58A64]"
              >
                {FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter === "All" ? "All Payment Statuses" : filter}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Cards */}
          <div className="mt-7 space-y-5">
            {filteredPayments.length === 0 ? (
              <div className="border border-[#D8D6D0] bg-white px-6 py-16 text-center">
                <IndianRupee
                  size={28}
                  strokeWidth={1.3}
                  className="mx-auto text-[#A58A64]"
                />

                <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                  No payment records found
                </h3>

                <p className="mt-3 text-sm text-[#77736C]">
                  Try another search or filter.
                </p>
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onOpen={() => onOpenPayment(payment)}
                  onDownload={() => onDownloadRemittance(payment)}
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
            Only finance-verified payment records are displayed as
            verified payments. Payment screenshots, vendor acknowledgements
            and submitted claims are not treated as proof of completed
            financial settlement.
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

      <p className="mt-7 break-words font-serif text-3xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function PaymentCard({
  payment,
  onOpen,
  onDownload,
}: {
  payment: VendorPaymentRecord;
  onOpen: () => void;
  onDownload: () => void | Promise<void>;
}) {
  return (
    <article className="border border-[#D8D6D0] bg-white p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            Payment Reference
          </p>

          <h3 className="mt-3 font-serif text-2xl text-[#171717]">
            {payment.paymentReference}
          </h3>

          <p className="mt-2 text-xs text-[#77736C]">
            {payment.projectName}
          </p>

          <p className="mt-1 font-mono text-[9px] text-[#99958D]">
            {payment.projectReference}
          </p>
        </div>

        <span
          className={`w-fit px-3 py-2 text-[9px] uppercase tracking-widest ${getStatusStyle(payment.status)}`}
        >
          {payment.status}
        </span>
      </div>

      {/* Amount */}
      <div className="mt-7 border-y border-[#E5E2DC] py-6">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          Recorded Payment Amount
        </p>

        <p className="mt-3 font-serif text-3xl text-[#171717]">
          {formatCurrency(payment.amount)}
        </p>
      </div>

      {/* Transaction Details */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Detail
          icon={<CalendarDays size={15} />}
          label="Payment Date"
          value={formatDate(payment.paymentDate)}
        />

        <Detail
          icon={<FileText size={15} />}
          label="Invoice Number"
          value={payment.invoiceNumber}
        />

        <Detail
          icon={<IndianRupee size={15} />}
          label="Payment Method"
          value={payment.paymentMethod}
        />
      </div>

      <div className="mt-6 border-t border-[#E5E2DC] pt-6">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          Transaction Reference
        </p>

        <p className="mt-2 break-all text-xs text-[#33312D]">
          {payment.transactionReference}
        </p>
      </div>

      {payment.financeRemark && (
        <div className="mt-6 border border-[#E8DFCE] bg-[#F8F4EB] p-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#94743F]">
            Finance Remark
          </p>

          <p className="mt-3 text-xs leading-7 text-[#6F5C39]">
            {payment.financeRemark}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-7 flex flex-wrap items-center gap-5 border-t border-[#E5E2DC] pt-6">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
        >
          View Payment Details
          <ArrowUpRight size={15} />
        </button>

        {payment.remittanceAvailable && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#77736C] hover:text-[#A58A64]"
          >
            <ArrowDownToLine size={15} />
            Download Remittance
          </button>
        )}
      </div>
    </article>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        <span className="text-[#A58A64]">{icon}</span>
        {label}
      </p>

      <p className="mt-2 break-words text-xs text-[#33312D]">
        {value}
      </p>
    </div>
  );
}
