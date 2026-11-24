
"use client";

import {
  FileText,
  IndianRupee,
  CalendarDays,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
} from "lucide-react";

export type ClientInvoiceStatus =
  | "Issued"
  | "Partially Paid"
  | "Paid"
  | "Overdue"
  | "Under Review"
  | "Disputed";

export type ClientDisputeStatus =
  | "Submitted"
  | "Under Review"
  | "Resolved"
  | "Rejected";

export interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  projectName: string;
  description: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: ClientInvoiceStatus;
  disputeStatus?: ClientDisputeStatus;
  currency?: "INR";
}

interface ClientInvoiceOverviewProps {
  invoices: ClientInvoice[];
  loading?: boolean;
  error?: string;
  onViewInvoice: (invoice: ClientInvoice) => void;
  onSubmitPaymentProof: (invoice: ClientInvoice) => void;
  onRaiseDispute: (invoice: ClientInvoice) => void;
  onRetry?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getStatusStyle(status: ClientInvoiceStatus) {
  switch (status) {
    case "Paid":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Overdue":
    case "Disputed":
      return "bg-[#F8EAE7] text-[#9A5147]";

    case "Under Review":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Partially Paid":
      return "bg-[#EAF0F5] text-[#58738C]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getOutstandingTotal(invoices: ClientInvoice[]) {
  return invoices.reduce(
    (total, invoice) =>
      total + Math.max(0, invoice.outstandingAmount),
    0
  );
}

function getPaidTotal(invoices: ClientInvoice[]) {
  return invoices.reduce(
    (total, invoice) =>
      total + Math.max(0, invoice.paidAmount),
    0
  );
}

export function ClientInvoiceOverview({
  invoices,
  loading = false,
  error,
  onViewInvoice,
  onSubmitPaymentProof,
  onRaiseDispute,
  onRetry,
}: ClientInvoiceOverviewProps) {
  if (loading) {
    return (
      <div className="min-h-80 bg-[#F2F0EB] p-8">
        <p className="text-sm text-[#77736C]">
          Loading invoice information...
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
        <AlertCircle className="text-[#9A5147]" size={22} />

        <h2 className="mt-4 font-serif text-2xl text-[#773B34]">
          Invoice information unavailable
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

  const outstandingTotal = getOutstandingTotal(invoices);
  const paidTotal = getPaidTotal(invoices);

  const invoicesWithBalance = invoices.filter(
    (invoice) => invoice.outstandingAmount > 0
  );

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-7xl">

        {/* Page Heading */}
        <header className="border-b border-[#D8D6D0] pb-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A58A64]">
            Client Portal / Financial Overview
          </p>

          <h1 className="mt-5 font-serif text-4xl text-[#171717] md:text-5xl">
            Invoices & Payments
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#77736C]">
            Review project invoices, track recorded payments and
            access the status of any payment disputes.
          </p>
        </header>

        {/* Financial Summary */}
        <section
          aria-label="Financial summary"
          className="grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2 lg:grid-cols-3"
        >
          <SummaryCard
            label="Outstanding Balance"
            amount={formatCurrency(outstandingTotal)}
            icon={<Clock3 size={19} />}
          />

          <SummaryCard
            label="Payments Recorded"
            amount={formatCurrency(paidTotal)}
            icon={<CheckCircle2 size={19} />}
          />

          <SummaryCard
            label="Invoices With Balance"
            amount={String(invoicesWithBalance.length)}
            icon={<FileText size={19} />}
          />
        </section>

        {/* Financial Notice */}
        <div className="mt-8 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5">
          <ShieldAlert
            size={20}
            className="mt-1 shrink-0 text-[#A58A64]"
          />

          <p className="text-xs leading-6 text-[#77736C]">
            Payment proofs submitted by clients are subject to
            verification by the studio&apos;s finance team. An uploaded
            receipt or screenshot does not itself confirm that an
            invoice has been paid.
          </p>
        </div>

        {/* Invoice List */}
        <section className="mt-14">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                Account Records
              </p>

              <h2 className="mt-4 font-serif text-3xl text-[#171717]">
                Project Invoices
              </h2>
            </div>

            <span className="font-mono text-[10px] text-[#99958D]">
              {invoices.length} RECORDS
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="mt-8 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
              <FileText
                size={28}
                strokeWidth={1.3}
                className="mx-auto text-[#A58A64]"
              />

              <h3 className="mt-5 font-serif text-2xl text-[#171717]">
                No invoices available
              </h3>

              <p className="mt-3 text-sm text-[#77736C]">
                Invoices shared with you will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 border-t border-[#D8D6D0]">
              {invoices.map((invoice) => (
                <article
                  key={invoice.id}
                  className="border-b border-[#D8D6D0] py-7"
                >
                  <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

                    {/* Invoice Information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A64]">
                          {invoice.invoiceNumber}
                        </span>

                        <span
                          className={`px-3 py-1 text-[9px] uppercase tracking-widest ${getStatusStyle(invoice.status)}`}
                        >
                          {invoice.status}
                        </span>
                      </div>

                      <h3 className="mt-4 font-serif text-2xl text-[#171717]">
                        {invoice.projectName}
                      </h3>

                      <p className="mt-2 text-sm text-[#77736C]">
                        {invoice.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 text-[10px] text-[#99958D]">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={13} />
                          Issued: {invoice.issueDate}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={13} />
                          Due: {invoice.dueDate}
                        </span>
                      </div>
                    </div>

                    {/* Amount Information */}
                    <div className="grid grid-cols-2 gap-x-7 gap-y-4 sm:min-w-72">
                      <AmountItem
                        label="Invoice Total"
                        amount={formatCurrency(invoice.totalAmount)}
                      />

                      <AmountItem
                        label="Recorded Paid"
                        amount={formatCurrency(invoice.paidAmount)}
                      />

                      <div className="col-span-2 border-t border-[#E1DED7] pt-4">
                        <AmountItem
                          label="Outstanding"
                          amount={formatCurrency(invoice.outstandingAmount)}
                          emphasis
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dispute Status */}
                  {invoice.disputeStatus && (
                    <div className="mt-6 flex items-start gap-3 border border-[#E8DFCE] bg-[#F8F4EB] p-4">
                      <AlertCircle
                        size={17}
                        className="mt-0.5 shrink-0 text-[#94743F]"
                      />

                      <div>
                        <p className="text-xs text-[#6F5C39]">
                          Payment dispute: {invoice.disputeStatus}
                        </p>

                        <p className="mt-1 text-[10px] leading-5 text-[#8B7958]">
                          Refer to the dispute details for the latest
                          information from the finance team.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap items-center gap-5">
                    <button
                      type="button"
                      onClick={() => onViewInvoice(invoice)}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#33312D] hover:text-[#A58A64]"
                    >
                      View Invoice
                      <ArrowUpRight size={15} />
                    </button>

                    {invoice.outstandingAmount > 0 &&
                      invoice.status !== "Disputed" && (
                        <button
                          type="button"
                          onClick={() => onSubmitPaymentProof(invoice)}
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#A58A64] hover:text-[#171717]"
                        >
                          Submit Payment Proof
                          <IndianRupee size={14} />
                        </button>
                      )}

                    {invoice.outstandingAmount > 0 &&
                      !invoice.disputeStatus && (
                        <button
                          type="button"
                          onClick={() => onRaiseDispute(invoice)}
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#77736C] hover:text-[#9A5147]"
                        >
                          Raise Dispute
                          <AlertCircle size={14} />
                        </button>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-14 border-t border-[#D8D6D0] pt-6">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
            ARCHEON DESIGN STUDIO / PRIVATE FINANCIAL RECORDS
          </p>
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  amount,
  icon,
}: {
  label: string;
  amount: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-7 md:p-9">
      <div className="flex items-center justify-between text-[#A58A64]">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
          {label}
        </span>
        {icon}
      </div>

      <p className="mt-7 font-serif text-3xl text-[#171717] md:text-4xl">
        {amount}
      </p>
    </div>
  );
}

function AmountItem({
  label,
  amount,
  emphasis = false,
}: {
  label: string;
  amount: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p
        className={`mt-2 text-sm ${
          emphasis
            ? "font-semibold text-[#171717]"
            : "text-[#66635D]"
        }`}
      >
        {amount}
      </p>
    </div>
  );
}
