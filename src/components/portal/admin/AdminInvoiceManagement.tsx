
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Search,
  FileText,
  RefreshCw,
  ArrowUpRight,
  X,
  AlertCircle,
  CalendarDays,
  Building2,
  UserRound,
  IndianRupee,
  Download,
  Eye,
  Filter,
  Clock3,
  CheckCircle2,
  FileSpreadsheet,
  Receipt,
  ImageIcon,
  MessageSquare,
} from "lucide-react";

export type AdminInvoicePartyType = "Client" | "Vendor";

export type AdminInvoiceStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Partially Approved"
  | "Approved"
  | "Rejected"
  | "Payment Processing"
  | "Partially Paid"
  | "Paid"
  | "Disputed"
  | "Cancelled";

export interface AdminInvoiceRecord {
  id: string;
  reference: string;
  partyType: AdminInvoicePartyType;
  partyId: string;
  partyName: string;
  projectId?: string;
  projectReference?: string;
  projectName?: string;
  invoiceDate: string;
  dueDate?: string;
  submittedAt?: string;
  currency: "INR";
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  approvedAmount?: number;
  paidAmount: number;
  outstandingAmount: number;
  status: AdminInvoiceStatus;
  description?: string;
  financeRemarks?: string;
  attachmentCount: number;
  lastUpdated: string;
  projectTotalExpenses?: number;
  billPhotoUrl?: string;
  clientId?: string;
}

export interface AdminInvoiceSummary {
  totalInvoices: number;
  submittedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  pendingReviewCount: number;
}

interface AdminInvoiceManagementProps {
  invoices: AdminInvoiceRecord[];
  summary?: AdminInvoiceSummary;
  clientsList?: { id: string; fullName: string; reference?: string }[];
  loading?: boolean;
  error?: string;
  updatingInvoiceId?: string;

  onRefresh?: () => void;
  onAddBill?: (clientId?: string) => void;
  onNotifyWhatsApp?: () => void;
  onOpenInvoice?: (invoiceId: string) => void;
  onReviewInvoice?: (invoiceId: string) => void;
  onOpenParty?: (
    partyType: AdminInvoicePartyType,
    partyId: string
  ) => void;
  onOpenProject?: (projectId: string) => void;
  onDownloadAttachment?: (invoiceId: string) => void;
}

type StatusFilter = "All" | AdminInvoiceStatus;
type PartyFilter = "All" | AdminInvoicePartyType;

const INVOICE_STATUSES: AdminInvoiceStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Partially Approved",
  "Approved",
  "Rejected",
  "Payment Processing",
  "Partially Paid",
  "Paid",
  "Disputed",
  "Cancelled",
];

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
  }).format(date);
}

function statusStyle(status: AdminInvoiceStatus) {
  switch (status) {
    case "Approved":
    case "Paid":
      return "bg-[#EAF1E8] text-[#547A51]";

    case "Submitted":
    case "Under Review":
    case "Payment Processing":
      return "bg-[#F4EFE2] text-[#94743F]";

    case "Partially Approved":
    case "Partially Paid":
      return "bg-[#EAEFF5] text-[#526C8A]";

    case "Rejected":
    case "Disputed":
      return "bg-[#F8EAE7] text-[#9A5147]";

    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getBalancePercentage(invoice: AdminInvoiceRecord) {
  if (invoice.totalAmount <= 0) return 0;

  const paid = Math.max(
    0,
    Math.min(invoice.paidAmount, invoice.totalAmount)
  );

  return Math.round((paid / invoice.totalAmount) * 100);
}

function isValidMoney(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function AdminInvoiceManagement({
  invoices,
  summary,
  clientsList = [],
  loading = false,
  error,
  updatingInvoiceId,
  onRefresh,
  onAddBill,
  onNotifyWhatsApp,
  onOpenInvoice,
  onReviewInvoice,
  onOpenParty,
  onOpenProject,
  onDownloadAttachment,
}: AdminInvoiceManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");
  const [partyFilter, setPartyFilter] =
    useState<PartyFilter>("All");
  const [selectedClientId, setSelectedClientId] = useState<string>("All");
  const [selectedInvoice, setSelectedInvoice] =
    useState<AdminInvoiceRecord | null>(null);

  const calculatedSummary = useMemo<AdminInvoiceSummary>(() => ({
    totalInvoices: invoices.length,

    submittedAmount: invoices.reduce(
      (total, invoice) => total + invoice.totalAmount,
      0
    ),

    approvedAmount: invoices.reduce(
      (total, invoice) =>
        total + (invoice.approvedAmount ?? 0),
      0
    ),

    paidAmount: invoices.reduce(
      (total, invoice) => total + invoice.paidAmount,
      0
    ),

    outstandingAmount: invoices.reduce(
      (total, invoice) =>
        total + invoice.outstandingAmount,
      0
    ),

    pendingReviewCount: invoices.filter(
      (invoice) =>
        invoice.status === "Submitted" ||
        invoice.status === "Under Review"
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
        invoice.partyId.toLowerCase().includes(query) ||
        (invoice.projectReference ?? "").toLowerCase().includes(query) ||
        (invoice.projectName ?? "").toLowerCase().includes(query) ||
        (invoice.description ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        invoice.status === statusFilter;

      const matchesParty =
        partyFilter === "All" ||
        invoice.partyType === partyFilter;

      const matchesClient =
        selectedClientId === "All" ||
        invoice.clientId === selectedClientId ||
        invoice.partyId === selectedClientId;

      return matchesSearch && matchesStatus && matchesParty && matchesClient;
    });
  }, [invoices, search, statusFilter, partyFilter, selectedClientId]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPartyFilter("All");
    setSelectedClientId("All");
  }

  function openInvoice(invoice: AdminInvoiceRecord) {
    setSelectedInvoice(invoice);
  }

  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      alert("No invoices or bills available to export.");
      return;
    }

    const headers = [
      "Bill / Invoice Ref",
      "Party Type",
      "Client / Vendor Name",
      "Project Name",
      "Issue Date",
      "Bill Amount (INR)",
      "Total Project Expenses (INR)",
      "Status",
      "Details / Scope Description",
      "Attachment Available"
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.reference.replace(/"/g, '""')}"`,
      `"${inv.partyType}"`,
      `"${inv.partyName.replace(/"/g, '""')}"`,
      `"${(inv.projectName || "General Architecture").replace(/"/g, '""')}"`,
      `"${formatDate(inv.invoiceDate)}"`,
      inv.totalAmount,
      inv.projectTotalExpenses ?? inv.totalAmount,
      `"${inv.status}"`,
      `"${(inv.description || "N/A").replace(/"/g, '""')}"`,
      inv.attachmentCount > 0 || inv.billPhotoUrl ? "Yes" : "No"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ArcheOn_Invoices_and_Bills_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedClientObj = clientsList.find((c) => c.id === selectedClientId);
  const selectedClientTotalExpenses = filteredInvoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const hasFilters =
    Boolean(search) ||
    statusFilter !== "All" ||
    partyFilter !== "All" ||
    selectedClientId !== "All";

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Finance
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Invoice Management
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Review client and vendor invoices, monitor approval
            progress and track outstanding balances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex w-fit items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64] disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-sm border border-[#2e7d32] bg-[#f1f8e9] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#1b5e20] hover:bg-[#2e7d32] hover:text-white transition-colors shadow-xs font-semibold cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            Export Excel Report
          </button>

          {onNotifyWhatsApp && (
            <button
              type="button"
              onClick={onNotifyWhatsApp}
              className="inline-flex items-center gap-2 rounded-sm border border-[#25D366] bg-[#E8F8EE] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#128C7E] hover:bg-[#25D366] hover:text-white transition-colors shadow-xs font-semibold cursor-pointer"
            >
              <MessageSquare size={15} />
              Notify Clients via WhatsApp
            </button>
          )}

          {onAddBill && (
            <button
              type="button"
              onClick={() => onAddBill(selectedClientId !== "All" ? selectedClientId : undefined)}
              className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors shadow-sm font-semibold cursor-pointer"
            >
              <Receipt size={15} className="text-[#A58A64]" />
              + Add Amount / Bill
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

      {/* Financial Summary */}
      <section className="mt-9 grid grid-cols-1 gap-px border border-[#D8D6D0] bg-[#D8D6D0] sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Invoice Records"
          value={totals.totalInvoices.toLocaleString("en-IN")}
          description="Total records"
        />

        <SummaryCard
          label="Invoice Value"
          value={formatCurrency(totals.submittedAmount)}
          description="Submitted invoice value"
        />

        <SummaryCard
          label="Approved Value"
          value={formatCurrency(totals.approvedAmount)}
          description="Approved invoice value"
        />

        <SummaryCard
          label="Payments Recorded"
          value={formatCurrency(totals.paidAmount)}
          description="Verified payment records"
        />

        <SummaryCard
          label="Outstanding Balance"
          value={formatCurrency(totals.outstandingAmount)}
          description="Reported outstanding value"
        />
      </section>

      {/* Review Queue */}
      <section className="mt-6 flex flex-col justify-between gap-4 border border-[#D8D6D0] bg-white p-5 md:flex-row md:items-center md:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#F4EFE2] text-[#94743F]">
            <Clock3 size={19} />
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              Finance Review Queue
            </p>

            <p className="mt-2 font-serif text-2xl text-[#171717]">
              {totals.pendingReviewCount} invoices awaiting review
            </p>

            <p className="mt-1 text-[10px] leading-5 text-[#77736C]">
              Review eligibility and approval authority must be
              checked by the finance workflow.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#94743F]">
          <AlertCircle size={14} />
          Review required
        </span>
      </section>

      {/* Filters */}
      <section className="mt-10">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice, party, project or reference..."
            aria-label="Search invoices"
            className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#A58A64]"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FilterSelect
            label="Invoice Status"
            value={statusFilter}
            options={["All", ...INVOICE_STATUSES]}
            onChange={(value) =>
              setStatusFilter(value as StatusFilter)
            }
          />

          <FilterSelect
            label="Party Type"
            value={partyFilter}
            options={["All", "Client", "Vendor"]}
            onChange={(value) =>
              setPartyFilter(value as PartyFilter)
            }
          />

          <div>
            <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
              Client List / Select Client
            </span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="h-12 w-full border border-[#D8D6D0] bg-white px-4 text-xs font-mono text-[#171717] outline-none focus:border-[#A58A64]"
            >
              <option value="All">All Clients (Full Registry)</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.reference ? `(${c.reference})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Client Project Financial Banner */}
        {selectedClientId !== "All" && selectedClientObj && (
          <div className="mt-5 border border-[#C6A779]/40 bg-[#FAF8F5] p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#A58A64] font-semibold">
                  Client Project Expenses Summary
                </span>
                <h3 className="font-serif text-xl text-[#171717] mt-0.5">
                  {selectedClientObj.fullName}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="block font-mono text-[9px] uppercase text-[#77736C]">
                    Total Expenses for that Project
                  </span>
                  <span className="font-mono text-base font-bold text-[#171717]">
                    {formatCurrency(selectedClientTotalExpenses)}
                  </span>
                </div>
                {onAddBill && (
                  <button
                    type="button"
                    onClick={() => onAddBill(selectedClientId)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#171717] hover:bg-[#A58A64] text-white text-xs font-mono uppercase tracking-wider rounded-xs transition-colors"
                  >
                    <Receipt size={13} />
                    + Add Bill for Client
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#77736C]">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[9px] uppercase tracking-widest text-[#987543]"
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Invoice Register */}
      <section className="mt-9">
        <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              Financial Records
            </p>

            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Invoice Register
            </h2>
          </div>

          <p className="font-mono text-[9px] text-[#99958D]">
            {filteredInvoices.length} RECORDS
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading invoice records...
            </p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
            <FileText
              size={28}
              strokeWidth={1.3}
              className="mx-auto text-[#A58A64]"
            />

            <h3 className="mt-5 font-serif text-2xl text-[#171717]">
              No invoices found
            </h3>

            <p className="mt-3 text-xs text-[#77736C]">
              No invoice records match your current search and filters.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredInvoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                updating={updatingInvoiceId === invoice.id}
                onOpen={() => openInvoice(invoice)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Invoice Details */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-black/50"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedInvoice(null);
            }
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-detail-title"
            className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#F2F0EB] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6D0] bg-[#F2F0EB] px-6 py-5 md:px-8">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  Invoice / {selectedInvoice.reference}
                </p>

                <h2
                  id="invoice-detail-title"
                  className="mt-2 font-serif text-2xl text-[#171717]"
                >
                  Invoice Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close invoice details"
                className="text-[#77736C]"
              >
                <X size={21} />
              </button>
            </div>

            <div className="flex-1 space-y-7 p-6 md:p-8">

              {/* Invoice Identity */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
                    <FileText size={20} />
                  </div>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${statusStyle(selectedInvoice.status)}`}
                  >
                    {selectedInvoice.status}
                  </span>
                </div>

                <h3 className="mt-5 break-words font-serif text-3xl text-[#171717]">
                  {selectedInvoice.reference}
                </h3>

                <p className="mt-2 text-xs text-[#77736C]">
                  {selectedInvoice.partyType} invoice
                </p>

                <div className="mt-6 space-y-4 border-t border-[#E5E2DC] pt-5">
                  <DetailLine
                    icon={<Building2 size={15} />}
                    label="Invoice Party"
                    value={selectedInvoice.partyName}
                  />

                  <DetailLine
                    icon={<CalendarDays size={15} />}
                    label="Invoice Date"
                    value={formatDate(selectedInvoice.invoiceDate)}
                  />

                  <DetailLine
                    icon={<Clock3 size={15} />}
                    label="Due Date"
                    value={formatDate(selectedInvoice.dueDate)}
                  />

                  <DetailLine
                    icon={<CalendarDays size={15} />}
                    label="Last Updated"
                    value={formatDate(selectedInvoice.lastUpdated)}
                  />
                </div>

                {onOpenParty && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenParty(
                        selectedInvoice.partyType,
                        selectedInvoice.partyId
                      )
                    }
                    className="mt-6 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
                  >
                    Open {selectedInvoice.partyType} Record
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </section>

              {/* Project */}
              {(selectedInvoice.projectId ||
                selectedInvoice.projectName) && (
                <section className="border border-[#D8D6D0] bg-white p-6">
                  <SectionHeading>Project Association</SectionHeading>

                  <h3 className="mt-3 font-serif text-xl text-[#171717]">
                    {selectedInvoice.projectName || "Project"}
                  </h3>

                  {selectedInvoice.projectReference && (
                    <p className="mt-2 font-mono text-[9px] text-[#A58A64]">
                      {selectedInvoice.projectReference}
                    </p>
                  )}

                  {selectedInvoice.projectId && onOpenProject && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenProject(selectedInvoice.projectId!)
                      }
                      className="mt-5 inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543]"
                    >
                      Open Project
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                </section>
              )}

              {/* Financial Breakdown */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Financial Breakdown</SectionHeading>

                <div className="mt-5 space-y-4">
                  <MoneyRow
                    label="Subtotal"
                    value={selectedInvoice.subtotal}
                  />

                  <MoneyRow
                    label="Tax Amount"
                    value={selectedInvoice.taxAmount}
                  />

                  <div className="border-t border-[#E5E2DC] pt-4">
                    <MoneyRow
                      label="Invoice Total"
                      value={selectedInvoice.totalAmount}
                      strong
                    />
                  </div>

                  <MoneyRow
                    label="Approved Amount"
                    value={selectedInvoice.approvedAmount ?? 0}
                  />

                  <MoneyRow
                    label="Paid Amount"
                    value={selectedInvoice.paidAmount}
                  />

                  <div className="border-t border-[#E5E2DC] pt-4">
                    <MoneyRow
                      label="Outstanding Amount"
                      value={selectedInvoice.outstandingAmount}
                      strong
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                      Payment Progress
                    </p>

                    <p className="font-mono text-[9px] text-[#77736C]">
                      {getBalancePercentage(selectedInvoice)}%
                    </p>
                  </div>

                  <div
                    className="h-2 overflow-hidden bg-[#EAE7E0]"
                    role="progressbar"
                    aria-valuenow={getBalancePercentage(selectedInvoice)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Invoice payment progress"
                  >
                    <div
                      className="h-full bg-[#A58A64]"
                      style={{
                        width: `${getBalancePercentage(selectedInvoice)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xs border border-[#C6A779]/40 bg-[#FAF8F5] p-3">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64] font-semibold">
                    Total Expenses for this Project
                  </p>
                  <p className="font-mono text-lg font-bold text-[#171717] mt-1">
                    {formatCurrency(selectedInvoice.projectTotalExpenses ?? selectedInvoice.totalAmount)}
                  </p>
                  <p className="font-mono text-[8px] uppercase text-[#77736C] mt-0.5">
                    Cumulative Recorded Project Spend
                  </p>
                </div>
              </section>

              {/* Attached Bill Voucher Photo */}
              {selectedInvoice.billPhotoUrl && (
                <section className="border border-[#D8D6D0] bg-white p-6">
                  <SectionHeading>Attached Bill Voucher</SectionHeading>
                  <div className="mt-3 overflow-hidden rounded-xs border border-[#D8D6D0] bg-[#FAF9F6] p-2">
                    <img
                      src={selectedInvoice.billPhotoUrl}
                      alt="Bill Voucher"
                      className="max-h-72 w-full object-contain"
                    />
                    <div className="mt-2 flex justify-end">
                      <a
                        href={selectedInvoice.billPhotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] uppercase text-[#987543] hover:underline"
                      >
                        Open High-Res Attachment ↗
                      </a>
                    </div>
                  </div>
                </section>
              )}

              {/* Description and Finance Remarks */}
              {(selectedInvoice.description ||
                selectedInvoice.financeRemarks) && (
                <section className="border border-[#D8D6D0] bg-white p-6">
                  {selectedInvoice.description && (
                    <>
                      <SectionHeading>Invoice Description</SectionHeading>

                      <p className="mt-3 whitespace-pre-wrap text-xs leading-7 text-[#55514A]">
                        {selectedInvoice.description}
                      </p>
                    </>
                  )}

                  {selectedInvoice.financeRemarks && (
                    <div className="mt-6 border-t border-[#E5E2DC] pt-5">
                      <SectionHeading>Finance Remarks</SectionHeading>

                      <p className="mt-3 whitespace-pre-wrap text-xs leading-7 text-[#55514A]">
                        {selectedInvoice.financeRemarks}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* Attachments */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-center justify-between">
                  <SectionHeading>Invoice Attachments</SectionHeading>

                  <span className="font-mono text-[9px] text-[#99958D]">
                    {selectedInvoice.attachmentCount} FILES
                  </span>
                </div>

                <p className="mt-3 text-xs leading-6 text-[#77736C]">
                  Attachments are available only through the
                  authorised document service.
                </p>

                {selectedInvoice.attachmentCount > 0 &&
                  onDownloadAttachment && (
                    <button
                      type="button"
                      onClick={() =>
                        onDownloadAttachment(selectedInvoice.id)
                      }
                      className="mt-5 inline-flex items-center gap-2 border border-[#D8D6D0] px-5 py-3 text-[9px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64]"
                    >
                      <Download size={14} />
                      Access Attachments
                    </button>
                  )}
              </section>

              {/* Validation Warnings */}
              {!isValidMoney(selectedInvoice.totalAmount) ||
              !isValidMoney(selectedInvoice.paidAmount) ||
              !isValidMoney(selectedInvoice.outstandingAmount) ? (
                <div
                  role="alert"
                  className="border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs leading-6 text-[#805B55]"
                >
                  The supplied invoice contains an invalid financial
                  value. Do not use these figures for financial
                  approval or payment decisions.
                </div>
              ) : null}
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 border-t border-[#D8D6D0] bg-[#F2F0EB] p-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 border border-[#D8D6D0] px-5 py-4 text-[9px] uppercase tracking-widest text-[#77736C]"
                >
                  Close
                </button>

                {onOpenInvoice && (
                  <button
                    type="button"
                    onClick={() => onOpenInvoice(selectedInvoice.id)}
                    className="flex-1 border border-[#D8D6D0] bg-white px-5 py-4 text-[9px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64]"
                  >
                    Open Full Invoice
                  </button>
                )}

                {onReviewInvoice &&
                  (selectedInvoice.status === "Submitted" ||
                    selectedInvoice.status === "Under Review") && (
                    <button
                      type="button"
                      disabled={
                        updatingInvoiceId === selectedInvoice.id
                      }
                      onClick={() =>
                        onReviewInvoice(selectedInvoice.id)
                      }
                      className="flex-1 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-40"
                    >
                      Review Invoice
                    </button>
                  )}
              </div>
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
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-white p-5 md:p-6">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-5 break-words font-serif text-2xl text-[#171717] md:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-[9px] text-[#99958D]">
        {description}
      </p>
    </div>
  );
}

function InvoiceCard({
  invoice,
  updating,
  onOpen,
}: {
  invoice: AdminInvoiceRecord;
  updating: boolean;
  onOpen: () => void;
}) {
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

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${statusStyle(invoice.status)}`}
          >
            {invoice.status}
          </span>

          {updating && (
            <span className="text-[8px] uppercase tracking-widest text-[#94743F]">
              Updating...
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#E5E2DC] pt-5 sm:grid-cols-3 md:grid-cols-5">
        <InvoiceMetric
          label="Bill / Invoice Total"
          value={formatCurrency(invoice.totalAmount)}
        />

        <InvoiceMetric
          label="Approved"
          value={formatCurrency(invoice.approvedAmount ?? 0)}
        />

        <InvoiceMetric
          label="Paid"
          value={formatCurrency(invoice.paidAmount)}
        />

        <InvoiceMetric
          label="Outstanding"
          value={formatCurrency(invoice.outstandingAmount)}
        />

        <div className="rounded-xs border border-[#C6A779]/40 bg-[#FAF8F5] p-2.5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64] font-semibold">
            Total Project Expenses
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-[#171717]">
            {formatCurrency(invoice.projectTotalExpenses ?? invoice.totalAmount)}
          </p>
          <p className="text-[8px] text-[#77736C] uppercase font-mono mt-0.5">Project Cumulative</p>
        </div>
      </div>

      {invoice.description && (
        <div className="mt-4 rounded-xs border border-[#E5E2DC] bg-[#FAF8F5] p-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#A58A64] font-semibold mb-1">
            <FileText size={11} /> Bill Scope &amp; Details
          </div>
          <p className="font-sans text-xs text-[#55524D] leading-relaxed">
            {invoice.description}
          </p>
        </div>
      )}

      {invoice.billPhotoUrl && (
        <div className="mt-3 flex items-center gap-3 rounded-xs border border-[#E5E2DC] bg-white p-2">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xs border border-[#D8D6D0]">
            <img src={invoice.billPhotoUrl} alt="Bill Voucher" className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9.5px] font-semibold text-[#171717] truncate">
              Attached Physical Bill Voucher
            </p>
            <p className="font-mono text-[8.5px] uppercase tracking-wider text-[#A58A64]">
              Available to Client &amp; Vendor
            </p>
          </div>
          <a
            href={invoice.billPhotoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono uppercase tracking-wider text-[#987543] hover:underline shrink-0"
          >
            View Full Voucher ↗
          </a>
        </div>
      )}

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-[#77736C]">
          <span>
            Invoice date: {formatDate(invoice.invoiceDate)}
          </span>

          <span>
            Due: {formatDate(invoice.dueDate)}
          </span>

          <span>
            {invoice.attachmentCount} attachments
          </span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
        >
          Review Details
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

function InvoiceMetric({
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
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[#A58A64]">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
          {label}
        </p>

        <p className="mt-1 break-all text-xs text-[#55514A]">
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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === "All" ? `All ${label}` : option}
          </option>
        ))}
      </select>
    </label>
  );
}
