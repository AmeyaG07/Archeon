
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

type StatusFilter = "All" | "Paid" | "Partially Paid" | "Pending";
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
        (statusFilter === "Paid" && invoice.status === "Paid") ||
        (statusFilter === "Partially Paid" && invoice.status === "Partially Paid") ||
        (statusFilter === "Pending" &&
          invoice.status !== "Paid" &&
          invoice.status !== "Partially Paid" &&
          invoice.status !== "Cancelled" &&
          invoice.status !== "Rejected");

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
    if (selectedInvoice?.id === invoice.id) {
      setSelectedInvoice(null);
      return;
    }
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
      <header className="border-b border-[#D8D6D0] pb-8">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Finance
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Invoice Management
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Review client and vendor invoices, monitor payment
            progress and track outstanding balances.
          </p>
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
              className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
            >
              <option value="All">All Clients (Full Registry)</option>
              {clientsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.reference ? `(${c.reference})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
              Invoice Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending</option>
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
        <div className="border-b border-[#D8D6D0] pb-4 space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
                Financial Records
              </p>

              <h2 className="mt-2 font-serif text-2xl text-[#171717]">
                Invoice Register
              </h2>
            </div>

            <p className="font-mono text-[9px] text-[#99958D] shrink-0">
              {filteredInvoices.length} RECORDS
            </p>
          </div>

          {/* Action Tiles moved after Invoice Register Label */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#2e7d32] bg-[#f1f8e9] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-[#1b5e20] hover:bg-[#2e7d32] hover:text-white transition-colors font-semibold cursor-pointer"
            >
              <FileSpreadsheet size={12} />
              Export Excel Report
            </button>

            {onNotifyWhatsApp && (
              <button
                type="button"
                onClick={onNotifyWhatsApp}
                className="inline-flex items-center gap-1.5 rounded-sm border border-[#25D366] bg-[#E8F8EE] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-[#128C7E] hover:bg-[#25D366] hover:text-white transition-colors font-semibold cursor-pointer"
              >
                <MessageSquare size={12} />
                Bill Reminder
              </button>
            )}

            {onAddBill && (
              <button
                type="button"
                onClick={() => onAddBill(selectedClientId !== "All" ? selectedClientId : undefined)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-[#171717] px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white hover:bg-[#A58A64] transition-colors font-semibold cursor-pointer"
              >
                <Receipt size={12} className="text-[#A58A64]" />
                + Add Amount / Bill
              </button>
            )}
          </div>
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
            {filteredInvoices.map((invoice) => {
              const isExpanded = selectedInvoice?.id === invoice.id;
              return (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  updating={updatingInvoiceId === invoice.id}
                  isExpanded={isExpanded}
                  onOpen={() => openInvoice(invoice)}
                  expandedContent={
                    isExpanded && selectedInvoice ? (
                      <div className="mt-4 space-y-4 border-t border-[#D8D6D0] pt-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch">
                          {/* Left: Identity, Dates & Project */}
                          <section className="flex flex-col justify-between border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                            <div>
                              <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-2.5">
                                <SectionHeading>Invoice Details</SectionHeading>
                                <span className="font-mono text-[10px] uppercase tracking-wider text-[#A58A64]">
                                  {selectedInvoice.reference}
                                </span>
                              </div>

                              <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="border border-[#E5E2DC] bg-white px-3 py-2">
                                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">Party</p>
                                  <p className="mt-0.5 text-xs text-[#171717] truncate">{selectedInvoice.partyName}</p>
                                </div>
                                <div className="border border-[#E5E2DC] bg-white px-3 py-2">
                                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">Invoice Date</p>
                                  <p className="mt-0.5 text-xs text-[#171717]">{formatDate(selectedInvoice.invoiceDate)}</p>
                                </div>
                                <div className="border border-[#E5E2DC] bg-white px-3 py-2">
                                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">Due Date</p>
                                  <p className="mt-0.5 text-xs text-[#171717]">{formatDate(selectedInvoice.dueDate)}</p>
                                </div>
                                <div className="border border-[#E5E2DC] bg-white px-3 py-2">
                                  <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">Last Updated</p>
                                  <p className="mt-0.5 text-xs text-[#171717]">{formatDate(selectedInvoice.lastUpdated)}</p>
                                </div>
                              </div>

                              {(selectedInvoice.projectId || selectedInvoice.projectName) && (
                                <div className="mt-3 border border-[#E5E2DC] bg-white px-3 py-2.5 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">Project</p>
                                    <p className="mt-0.5 text-xs font-medium text-[#171717] truncate">
                                      {selectedInvoice.projectName || "Project"}
                                      {selectedInvoice.projectReference ? ` (${selectedInvoice.projectReference})` : ""}
                                    </p>
                                  </div>
                                  {selectedInvoice.projectId && onOpenProject && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenProject(selectedInvoice.projectId!)}
                                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#987543] hover:text-[#171717] shrink-0"
                                    >
                                      Open <ArrowUpRight size={11} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {onOpenParty && (
                              <div className="mt-3 border-t border-[#E5E2DC] pt-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenParty(
                                      selectedInvoice.partyType,
                                      selectedInvoice.partyId
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#987543] hover:text-[#171717]"
                                >
                                  Open {selectedInvoice.partyType} Record
                                  <ArrowUpRight size={12} />
                                </button>
                              </div>
                            )}
                          </section>

                          {/* Right: Financial Breakdown */}
                          <section className="flex flex-col justify-between border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                            <div>
                              <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-2.5">
                                <SectionHeading>Financial Breakdown</SectionHeading>
                                <span className="font-mono text-[10px] text-[#77736C]">
                                  {getBalancePercentage(selectedInvoice)}% Paid
                                </span>
                              </div>

                              <div className="mt-3 space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-[#77736C]">Subtotal</span>
                                  <span className="font-mono text-[#171717]">{formatCurrency(selectedInvoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#77736C]">Tax Amount</span>
                                  <span className="font-mono text-[#171717]">{formatCurrency(selectedInvoice.taxAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t border-[#E5E2DC] pt-2 font-semibold">
                                  <span className="text-[#171717]">Invoice Total</span>
                                  <span className="font-mono text-[#171717]">{formatCurrency(selectedInvoice.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#77736C]">Approved / Paid</span>
                                  <span className="font-mono text-emerald-700">
                                    {formatCurrency(selectedInvoice.approvedAmount ?? 0)} / {formatCurrency(selectedInvoice.paidAmount)}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-[#E5E2DC] pt-2 font-semibold">
                                  <span className="text-[#171717]">Outstanding</span>
                                  <span className="font-mono text-[#A58A64]">{formatCurrency(selectedInvoice.outstandingAmount)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3">
                              <div
                                className="h-1.5 overflow-hidden bg-[#EAE7E0]"
                                role="progressbar"
                                aria-valuenow={getBalancePercentage(selectedInvoice)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label="Invoice payment progress"
                              >
                                <div
                                  className="h-full bg-[#A58A64]"
                                  style={{ width: `${getBalancePercentage(selectedInvoice)}%` }}
                                />
                              </div>
                            </div>
                          </section>
                        </div>

                        {/* Remarks & Attachments */}
                        {(selectedInvoice.financeRemarks || selectedInvoice.attachmentCount > 0) && (
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {selectedInvoice.financeRemarks && (
                              <section className="border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                                <SectionHeading>Finance Remarks</SectionHeading>
                                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-[#55514A]">
                                  {selectedInvoice.financeRemarks}
                                </p>
                              </section>
                            )}
                            {selectedInvoice.attachmentCount > 0 && (
                              <section className="flex items-center justify-between border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                                <div>
                                  <SectionHeading>Attachments ({selectedInvoice.attachmentCount})</SectionHeading>
                                  <p className="mt-1 text-xs text-[#77736C]">
                                    Available via authorised document service.
                                  </p>
                                </div>
                                {onDownloadAttachment && (
                                  <button
                                    type="button"
                                    onClick={() => onDownloadAttachment(selectedInvoice.id)}
                                    className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#55514A] hover:border-[#A58A64]"
                                  >
                                    <Download size={12} />
                                    Access
                                  </button>
                                )}
                              </section>
                            )}
                          </div>
                        )}

                        {/* Validation Warnings */}
                        {(!isValidMoney(selectedInvoice.totalAmount) ||
                          !isValidMoney(selectedInvoice.paidAmount) ||
                          !isValidMoney(selectedInvoice.outstandingAmount)) && (
                          <div
                            role="alert"
                            className="border border-[#E3C9C5] bg-[#FAF3F1] p-3 text-xs text-[#805B55]"
                          >
                            The supplied invoice contains an invalid financial value. Do not use these figures for financial approval or payment decisions.
                          </div>
                        )}

                        {/* Inline Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {onOpenInvoice && (
                              <button
                                type="button"
                                onClick={() => onOpenInvoice(selectedInvoice.id)}
                                className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-white px-3 py-1 font-mono text-[8px] uppercase tracking-widest text-[#55514A] hover:border-[#171717]"
                              >
                                Open Full Invoice
                              </button>
                            )}
                            {onReviewInvoice &&
                              (selectedInvoice.status === "Submitted" ||
                                selectedInvoice.status === "Under Review") && (
                                <button
                                  type="button"
                                  disabled={updatingInvoiceId === selectedInvoice.id}
                                  onClick={() => onReviewInvoice(selectedInvoice.id)}
                                  className="inline-flex items-center gap-1 bg-[#171717] px-3 py-1 font-mono text-[8px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-40"
                                >
                                  Review Invoice
                                </button>
                              )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(null)}
                            className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-white px-3 py-1 font-mono text-[8px] uppercase tracking-widest text-[#77736C] hover:border-[#171717] hover:text-[#171717] transition-colors"
                          >
                            <X size={9} />
                            Close Review
                          </button>
                        </div>
                      </div>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </section>
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
    <div className="min-w-0 bg-white p-5 md:p-6">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p
        title={value}
        className="mt-5 whitespace-nowrap font-serif text-xl tabular-nums text-[#171717] md:text-2xl xl:text-[22px] 2xl:text-2xl"
      >
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
  isExpanded = false,
  onOpen,
  expandedContent,
}: {
  invoice: AdminInvoiceRecord;
  updating: boolean;
  isExpanded?: boolean;
  onOpen: () => void;
  expandedContent?: ReactNode;
}) {
  return (
    <article
      className={`border bg-white p-5 transition-all ${
        isExpanded
          ? "border-[#A58A64] ring-1 ring-[#A58A64]/40 shadow-md"
          : "border-[#D8D6D0]"
      }`}
    >
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

        {!isExpanded && (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 border border-[#D8D6D0] bg-[#FAF9F6] px-2.5 py-1 font-mono text-[8px] uppercase tracking-widest text-[#987543] hover:border-[#171717] hover:text-[#171717] transition-colors rounded-sm"
          >
            Review Details
            <ArrowUpRight size={10} />
          </button>
        )}
      </div>

      {isExpanded && expandedContent}
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
