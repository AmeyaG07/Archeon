
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  IndianRupee,
  Clock3,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  CalendarDays,
  Building2,
  Download,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

export interface FinanceAgeingBucket {
  label: string;
  amount: number;
  invoiceCount: number;
}

export interface FinanceMonthlyRecord {
  period: string;
  receivables: number;
  payables: number;
  collections: number;
  payments: number;
}

export interface FinanceRecentTransaction {
  id: string;
  reference: string;
  partyName: string;
  partyType: "Client" | "Vendor";
  description: string;
  amount: number;
  date: string;
  status:
    | "Recorded"
    | "Pending Verification"
    | "Under Review"
    | "Disputed"
    | "Rejected";
  direction: "Receivable" | "Payable";
}

export interface AdminFinanceData {
  currency: "INR";
  reportingPeriod: string;
  generatedAt: string;

  totalReceivables: number;
  totalPayables: number;

  overdueReceivables: number;
  overduePayables: number;

  collectionsThisPeriod: number;
  paymentsThisPeriod: number;

  pendingClientPayments: number;
  pendingVendorPayments: number;

  verifiedCashSettlements: number;
  disputedCashSettlements: number;

  receivablesAgeing: FinanceAgeingBucket[];
  payablesAgeing: FinanceAgeingBucket[];

  monthlyRecords: FinanceMonthlyRecord[];
  recentTransactions: FinanceRecentTransaction[];
}

interface AdminFinanceOverviewProps {
  data: AdminFinanceData | null;
  loading?: boolean;
  error?: string;

  onRefresh?: () => void;

  onOpenReceivables?: () => void;
  onOpenPayables?: () => void;
  onOpenInvoices?: () => void;
  onOpenCashSettlements?: () => void;
  onOpenTransaction?: (transactionId: string) => void;

  onExportReport?: () => void;
}

type TransactionFilter = "All" | "Receivable" | "Payable";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
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

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function transactionStatusStyle(
  status: FinanceRecentTransaction["status"]
) {
  switch (status) {
    case "Recorded":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Pending Verification":
    case "Under Review":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Disputed":
    case "Rejected":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function validValue(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function AdminFinanceOverview({
  data,
  loading = false,
  error,
  onRefresh,
  onOpenReceivables,
  onOpenPayables,
  onOpenInvoices,
  onOpenCashSettlements,
  onOpenTransaction,
  onExportReport,
}: AdminFinanceOverviewProps) {
  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilter>("All");

  const filteredTransactions = useMemo(() => {
    if (!data) return [];

    if (transactionFilter === "All") {
      return data.recentTransactions;
    }

    return data.recentTransactions.filter(
      (transaction) =>
        transaction.direction === transactionFilter
    );
  }, [data, transactionFilter]);

  const invalidData = data
    ? [
        data.totalReceivables,
        data.totalPayables,
        data.overdueReceivables,
        data.overduePayables,
        data.collectionsThisPeriod,
        data.paymentsThisPeriod,
        data.pendingClientPayments,
        data.pendingVendorPayments,
        data.verifiedCashSettlements,
        data.disputedCashSettlements,
      ].some((value) => !validValue(value))
    : false;

  const monthlyMaximum = data
    ? Math.max(
        1,
        ...data.monthlyRecords.map((record) =>
          Math.max(
            record.receivables,
            record.payables,
            record.collections,
            record.payments
          )
        )
      )
    : 1;

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Finance
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Finance Overview
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Monitor receivables, payables, overdue balances,
            collections and verified financial activity.
          </p>

          {data && (
            <p className="mt-4 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
              Period: {data.reportingPeriod}
              {" · "}
              Generated: {formatDate(data.generatedAt)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {onExportReport && (
            <button
              type="button"
              onClick={onExportReport}
              disabled={!data || loading || invalidData}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64] disabled:opacity-40"
            >
              <Download size={14} />
              Export Report
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#171717] px-5 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-40"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          )}
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

      {loading && !data ? (
        <div className="flex min-h-80 items-center justify-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
            Loading financial information...
          </p>
        </div>
      ) : !data ? (
        <div className="mt-10 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
          <BarChart3
            size={30}
            className="mx-auto text-[#A58A64]"
          />

          <h2 className="mt-5 font-serif text-2xl text-[#171717]">
            Finance data unavailable
          </h2>

          <p className="mt-3 text-xs text-[#77736C]">
            Financial reports will appear when verified data is available.
          </p>
        </div>
      ) : (
        <>
          {invalidData && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 border border-[#E3C9C5] bg-[#FAF3F1] p-5"
            >
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-[#9A5147]"
              />

              <p className="text-xs leading-6 text-[#805B55]">
                Some financial values are invalid. Do not export or
                rely on this report until the source records are corrected.
              </p>
            </div>
          )}

          {/* Main Financial Position */}
          <section className="mt-9">
            <SectionHeading>Financial Position</SectionHeading>

            <div className="mt-5 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] md:grid-cols-2">
              <FinancialPositionCard
                title="Total Receivables"
                description="Amounts reported as due from clients"
                value={formatCurrency(data.totalReceivables)}
                icon={<TrendingUp size={19} />}
                overdue={data.overdueReceivables}
                onClick={onOpenReceivables}
              />

              <FinancialPositionCard
                title="Total Payables"
                description="Amounts reported as due to vendors"
                value={formatCurrency(data.totalPayables)}
                icon={<TrendingDown size={19} />}
                overdue={data.overduePayables}
                onClick={onOpenPayables}
              />
            </div>
          </section>

          {/* Collections and Payments */}
          <section className="mt-9">
            <SectionHeading>Period Activity</SectionHeading>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Collections This Period"
                value={formatCurrency(data.collectionsThisPeriod)}
                icon={<TrendingUp size={18} />}
              />

              <MetricCard
                label="Payments This Period"
                value={formatCurrency(data.paymentsThisPeriod)}
                icon={<TrendingDown size={18} />}
              />

              <MetricCard
                label="Pending Client Payments"
                value={formatCurrency(data.pendingClientPayments)}
                icon={<Clock3 size={18} />}
              />

              <MetricCard
                label="Pending Vendor Payments"
                value={formatCurrency(data.pendingVendorPayments)}
                icon={<Wallet size={18} />}
              />
            </div>
          </section>

          {/* Cash Settlement Monitoring */}
          <section className="mt-9">
            <SectionHeading>Cash Settlement Monitoring</SectionHeading>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <SettlementMetric
                label="Verified Settlements"
                value={formatNumber(data.verifiedCashSettlements)}
                description="Finance-verified settlement records"
                icon={<ShieldCheck size={19} />}
                onClick={onOpenCashSettlements}
              />

              <SettlementMetric
                label="Disputed Settlements"
                value={formatNumber(data.disputedCashSettlements)}
                description="Records requiring dispute resolution"
                icon={<AlertCircle size={19} />}
                onClick={onOpenCashSettlements}
              />
            </div>
          </section>

          {/* Ageing Analysis */}
          <section className="mt-10">
            <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
              <div>
                <SectionHeading>Outstanding Analysis</SectionHeading>

                <h2 className="mt-3 font-serif text-2xl text-[#171717]">
                  Receivables Ageing
                </h2>
              </div>

              <p className="font-mono text-[9px] text-[#99958D]">
                CLIENT BALANCES
              </p>
            </div>

            <AgeingTable buckets={data.receivablesAgeing} />
          </section>

          <section className="mt-10">
            <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
              <div>
                <SectionHeading>Outstanding Analysis</SectionHeading>

                <h2 className="mt-3 font-serif text-2xl text-[#171717]">
                  Payables Ageing
                </h2>
              </div>

              <p className="font-mono text-[9px] text-[#99958D]">
                VENDOR BALANCES
              </p>
            </div>

            <AgeingTable buckets={data.payablesAgeing} />
          </section>

          {/* Monthly Financial Trend */}
          <section className="mt-10">
            <div className="border-b border-[#D8D6D0] pb-5">
              <SectionHeading>Financial Performance</SectionHeading>

              <h2 className="mt-3 font-serif text-2xl text-[#171717]">
                Monthly Financial Trend
              </h2>

              <p className="mt-2 text-xs text-[#77736C]">
                Compare receivables, payables, collections and payments.
              </p>
            </div>

            <div className="mt-5 border border-[#D8D6D0] bg-white p-5 md:p-7">
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                <LegendItem label="Receivables" marker="bg-[#A58A64]" />
                <LegendItem label="Payables" marker="bg-[#343434]" />
                <LegendItem label="Collections" marker="bg-[#809B78]" />
                <LegendItem label="Payments" marker="bg-[#8C9EB0]" />
              </div>

              {data.monthlyRecords.length === 0 ? (
                <p className="py-16 text-center text-xs text-[#77736C]">
                  No monthly trend data is available.
                </p>
              ) : (
                <div className="mt-8 space-y-7">
                  {data.monthlyRecords.map((record) => (
                    <div key={record.period}>
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                          {record.period}
                        </p>

                        <p className="text-[9px] text-[#99958D]">
                          Monthly comparison
                        </p>
                      </div>

                      <div className="space-y-2">
                        <TrendBar
                          label="Receivables"
                          value={record.receivables}
                          maximum={monthlyMaximum}
                          marker="bg-[#A58A64]"
                        />

                        <TrendBar
                          label="Payables"
                          value={record.payables}
                          maximum={monthlyMaximum}
                          marker="bg-[#343434]"
                        />

                        <TrendBar
                          label="Collections"
                          value={record.collections}
                          maximum={monthlyMaximum}
                          marker="bg-[#809B78]"
                        />

                        <TrendBar
                          label="Payments"
                          value={record.payments}
                          maximum={monthlyMaximum}
                          marker="bg-[#8C9EB0]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent Transactions */}
          <section className="mt-10">
            <div className="flex flex-col justify-between gap-4 border-b border-[#D8D6D0] pb-5 sm:flex-row sm:items-end">
              <div>
                <SectionHeading>Financial Activity</SectionHeading>

                <h2 className="mt-3 font-serif text-2xl text-[#171717]">
                  Recent Transactions
                </h2>
              </div>

              <div className="flex gap-2">
                {(
                  ["All", "Receivable", "Payable"] as TransactionFilter[]
                ).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTransactionFilter(filter)}
                    aria-pressed={transactionFilter === filter}
                    className={`border px-3 py-2 text-[8px] uppercase tracking-widest ${
                      transactionFilter === filter
                        ? "border-[#171717] bg-[#171717] text-white"
                        : "border-[#D8D6D0] bg-white text-[#77736C]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="mt-5 border border-[#D8D6D0] bg-white p-12 text-center">
                <FileText
                  size={25}
                  className="mx-auto text-[#A58A64]"
                />

                <p className="mt-4 text-xs text-[#77736C]">
                  No transactions are available for this selection.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {filteredTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onOpen={
                      onOpenTransaction
                        ? () => onOpenTransaction(transaction.id)
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {/* Reporting Note */}
          <section className="mt-10 flex items-start gap-4 border border-[#D8D6D0] bg-white p-5 md:p-6">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[#A58A64]"
            />

            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                Reporting Integrity
              </p>

              <p className="mt-2 text-xs leading-6 text-[#77736C]">
                This overview is only as accurate as its underlying
                reconciled financial records. Pending payment proofs,
                disputed settlements and unverified transactions must
                not be counted as completed payments.
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
      {children}
    </p>
  );
}

function FinancialPositionCard({
  title,
  description,
  value,
  icon,
  overdue,
  onClick,
}: {
  title: string;
  description: string;
  value: string;
  icon: ReactNode;
  overdue: number;
  onClick?: () => void;
}) {
  return (
    <div className="bg-white p-6 md:p-8">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {title}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-6 break-words font-serif text-3xl text-[#171717] md:text-4xl">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-[#77736C]">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DC] pt-5">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
            Overdue Balance
          </p>

          <p className="mt-2 text-sm text-[#9A5147]">
            {formatCurrency(overdue)}
          </p>
        </div>

        {onClick && (
          <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-[#987543]"
          >
            View Details
            <ArrowUpRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="border border-[#D8D6D0] bg-white p-5 md:p-6">
      <span className="text-[#A58A64]">{icon}</span>

      <p className="mt-5 font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-3 break-words font-serif text-2xl text-[#171717]">
        {value}
      </p>
    </div>
  );
}

function SettlementMetric({
  label,
  value,
  description,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className="border border-[#D8D6D0] bg-white p-6 text-left transition-colors hover:border-[#A58A64] disabled:cursor-default"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <span className="text-[#A58A64]">{icon}</span>
      </div>

      <p className="mt-5 font-serif text-3xl text-[#171717]">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-[#77736C]">
        {description}
      </p>
    </button>
  );
}

function AgeingTable({
  buckets,
}: {
  buckets: FinanceAgeingBucket[];
}) {
  const totalAmount = buckets.reduce(
    (total, bucket) => total + bucket.amount,
    0
  );

  const totalCount = buckets.reduce(
    (total, bucket) => total + bucket.invoiceCount,
    0
  );

  return (
    <div className="mt-5 overflow-x-auto border border-[#D8D6D0] bg-white">
      <table className="w-full min-w-[520px] text-left">
        <thead>
          <tr className="border-b border-[#E5E2DC] bg-[#FAF9F6]">
            <th className="px-5 py-4 font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
              Ageing Period
            </th>

            <th className="px-5 py-4 text-right font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
              Invoice Count
            </th>

            <th className="px-5 py-4 text-right font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
              Outstanding Amount
            </th>

            <th className="px-5 py-4 text-right font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
              Share
            </th>
          </tr>
        </thead>

        <tbody>
          {buckets.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-5 py-12 text-center text-xs text-[#77736C]"
              >
                No ageing information available.
              </td>
            </tr>
          ) : (
            buckets.map((bucket) => (
              <tr
                key={bucket.label}
                className="border-b border-[#E5E2DC] last:border-0"
              >
                <td className="px-5 py-4 text-xs text-[#33312D]">
                  {bucket.label}
                </td>

                <td className="px-5 py-4 text-right text-xs tabular-nums text-[#55514A]">
                  {formatNumber(bucket.invoiceCount)}
                </td>

                <td className="px-5 py-4 text-right text-xs tabular-nums text-[#33312D]">
                  {formatCurrency(bucket.amount)}
                </td>

                <td className="px-5 py-4 text-right text-xs tabular-nums text-[#77736C]">
                  {totalAmount > 0
                    ? `${((bucket.amount / totalAmount) * 100).toFixed(1)}%`
                    : "0%"}
                </td>
              </tr>
            ))
          )}
        </tbody>

        {buckets.length > 0 && (
          <tfoot>
            <tr className="bg-[#FAF9F6]">
              <td className="px-5 py-4 text-xs font-semibold text-[#171717]">
                Total
              </td>

              <td className="px-5 py-4 text-right text-xs font-semibold text-[#171717]">
                {formatNumber(totalCount)}
              </td>

              <td className="px-5 py-4 text-right text-xs font-semibold text-[#171717]">
                {formatCurrency(totalAmount)}
              </td>

              <td className="px-5 py-4 text-right text-xs font-semibold text-[#171717]">
                100%
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function TrendBar({
  label,
  value,
  maximum,
  marker,
}: {
  label: string;
  value: number;
  maximum: number;
  marker: string;
}) {
  const percentage =
    Number.isFinite(value) && value > 0
      ? Math.min(100, (value / maximum) * 100)
      : 0;

  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3">
      <p className="text-[9px] text-[#77736C]">{label}</p>

      <div className="h-2 overflow-hidden bg-[#EAE7E0]">
        <div
          className={`h-full ${marker}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-right text-[9px] tabular-nums text-[#55514A]">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function LegendItem({
  label,
  marker,
}: {
  label: string;
  marker: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-[9px] text-[#77736C]">
      <span className={`h-2 w-2 ${marker}`} />
      {label}
    </span>
  );
}

function TransactionCard({
  transaction,
  onOpen,
}: {
  transaction: FinanceRecentTransaction;
  onOpen?: () => void;
}) {
  const receivable = transaction.direction === "Receivable";

  return (
    <article className="flex flex-col justify-between gap-5 border border-[#D8D6D0] bg-white p-5 md:flex-row md:items-center md:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
          {receivable ? (
            <ArrowDownRight size={18} />
          ) : (
            <ArrowUpRight size={18} />
          )}
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            {transaction.reference}
          </p>

          <h3 className="mt-2 break-words font-serif text-xl text-[#171717]">
            {transaction.partyName}
          </h3>

          <p className="mt-1 text-[10px] text-[#77736C]">
            {transaction.description}
          </p>

          <p className="mt-2 text-[9px] text-[#99958D]">
            {transaction.partyType} · {formatDate(transaction.date)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 md:justify-end">
        <div className="md:text-right">
          <p className="font-serif text-xl text-[#171717]">
            {formatCurrency(transaction.amount)}
          </p>

          <span
            className={`mt-2 inline-block px-3 py-2 text-[8px] uppercase tracking-widest ${transactionStatusStyle(transaction.status)}`}
          >
            {transaction.status}
          </span>
        </div>

        {onOpen && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open transaction ${transaction.reference}`}
            className="text-[#987543] hover:text-[#171717]"
          >
            <ArrowUpRight size={18} />
          </button>
        )}
      </div>
    </article>
  );
}
