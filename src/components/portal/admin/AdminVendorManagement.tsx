
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Search,
  Building2,
  Mail,
  Phone,
  MapPin,
  FolderKanban,
  FileText,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
  AlertCircle,
  Users,
  Edit3,
  Trash2,
  CreditCard,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Copy,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { BillPhotoModal, type BillPhotoTarget } from "@/components/portal/admin/BillPhotoModal";

export type AdminVendorStatus =
  | "Active"
  | "Inactive"
  | "Suspended";

export type VendorPortalAccessStatus =
  | "Not Invited"
  | "Invitation Pending"
  | "Active"
  | "Expired"
  | "Suspended";

export interface AdminVendorProject {
  id: string;
  reference: string;
  name: string;
  status:
    | "Planning"
    | "Under Design"
    | "Under Execution"
    | "On Hold"
    | "Completed";
}

export interface AdminVendorBillItem {
  id: string;
  billId?: string;
  invoiceNumber?: string;
  projectName?: string;
  projectReference?: string;
  amount: number;
  paidAmount: number;
  outstandingAmount?: number;
  status: string;
  createdAt: string;
  billPhotoUrl?: string;
  tradeCategory?: string;
}

export interface AdminVendorRecord {
  id: string;
  reference: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  vendorCategory: string;
  category?: string;
  taxId?: string;
  location?: string;
  status: AdminVendorStatus;
  portalAccess: VendorPortalAccessStatus;
  linkedProjects: AdminVendorProject[];
  submittedInvoiceCount: number;
  outstandingInvoiceCount: number;
  totalBilledAmount?: number;
  totalSettledAmount?: number;
  associatedClients?: string[];
  createdAt: string;
  lastUpdated: string;
  bills?: AdminVendorBillItem[];
}

interface AdminVendorManagementProps {
  vendors: AdminVendorRecord[];
  loading?: boolean;
  updatingVendorId?: string;
  error?: string;

  onRefresh?: () => void;

  onOpenVendor?: (vendorId: string) => void;

  onInviteVendor: (
    vendorId: string
  ) => Promise<void>;

  onUpdateVendorStatus: (
    vendorId: string,
    status: AdminVendorStatus
  ) => Promise<void>;

  onUpdatePortalAccess: (
    vendorId: string,
    action: "resend" | "revoke"
  ) => Promise<void>;

  onCreatePortalAccount?: (
    vendorId: string,
    username: string,
    password: string
  ) => Promise<any>;

  onOpenProject?: (projectId: string) => void;
  onOpenInvoices?: (vendorId: string) => void;

  onAddVendor?: () => void;
  onEditVendor?: (vendor: AdminVendorRecord) => void;
  onManagePaymentSettings?: (vendor: AdminVendorRecord) => void;
  onDeleteVendor?: (vendorId: string) => Promise<void>;
}

type VendorStatusFilter = "All" | AdminVendorStatus;
type PortalFilter = "All" | VendorPortalAccessStatus;

const VENDOR_STATUSES: AdminVendorStatus[] = [
  "Active",
  "Inactive",
  "Suspended",
];

const PORTAL_STATUSES: VendorPortalAccessStatus[] = [
  "Not Invited",
  "Invitation Pending",
  "Active",
  "Expired",
  "Suspended",
];

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function printBillVoucher(bill: AdminVendorBillItem, vendor: AdminVendorRecord) {
  const win = window.open("", "_blank");
  if (!win) return;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${bill.invoiceNumber || bill.billId || "BILL"} - Trade Partner Bill Voucher</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 40px; color: #171717; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #171717; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 22px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
          .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; }
          .box { border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
          .box-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-bottom: 8px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { background: #f8f8f8; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; font-size: 11px; text-transform: uppercase; }
          td { padding: 12px 10px; border-bottom: 1px solid #eee; }
          .text-right { text-align: right; }
          .total-row { font-weight: 700; font-size: 15px; border-top: 2px solid #171717; }
          .badge { display: inline-block; padding: 3px 8px; font-size: 10px; text-transform: uppercase; font-weight: 600; background: #eee; border-radius: 3px; }
          .print-btn { background: #171717; color: #fff; border: none; padding: 8px 16px; font-size: 12px; cursor: pointer; border-radius: 3px; margin-top: 20px; }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">ArcheOn Design Studio</div>
            <div class="subtitle">Trade Contractor Disbursement Voucher · Ar. Mandar Bhalekar</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">${bill.status}</div>
            <div style="font-size: 14px; font-weight: 700; margin-top: 6px;">${bill.invoiceNumber || bill.billId || "BILL"}</div>
            <div class="subtitle">Date: ${formatDate(bill.createdAt)}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="box">
            <div class="box-title">Trade Partner (Vendor)</div>
            <div style="font-weight: 600;">${vendor.businessName}</div>
            <div style="color: #555; margin-top: 4px;">Ref: ${vendor.reference} · ${vendor.vendorCategory}</div>
            <div style="color: #555; margin-top: 2px;">Contact: ${vendor.contactPerson} (${vendor.phone})</div>
          </div>
          <div class="box">
            <div class="box-title">Project & Scope</div>
            <div style="font-weight: 600;">${bill.projectName || "Studio Project"}</div>
            <div style="color: #555; margin-top: 4px;">Category: ${bill.tradeCategory || vendor.vendorCategory}</div>
            <div style="color: #555; margin-top: 2px;">Total Bill: ₹${bill.amount.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description / Trade Category</th>
              <th class="text-right">Billed Amount</th>
              <th class="text-right">Recorded Paid</th>
              <th class="text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${bill.tradeCategory || "Contractor Services"} (${bill.projectName || "Studio Project"})</td>
              <td class="text-right">₹${bill.amount.toLocaleString("en-IN")}</td>
              <td class="text-right">₹${bill.paidAmount.toLocaleString("en-IN")}</td>
              <td class="text-right">₹${(bill.outstandingAmount ?? Math.max(0, bill.amount - bill.paidAmount)).toLocaleString("en-IN")}</td>
            </tr>
            <tr class="total-row">
              <td>Net Payable</td>
              <td class="text-right">₹${bill.amount.toLocaleString("en-IN")}</td>
              <td class="text-right">₹${bill.paidAmount.toLocaleString("en-IN")}</td>
              <td class="text-right">₹${(bill.outstandingAmount ?? Math.max(0, bill.amount - bill.paidAmount)).toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
      </body>
    </html>
  `;
  win.document.write(html);
  win.document.close();
}

function vendorStatusStyle(status: AdminVendorStatus) {
  switch (status) {
    case "Active":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Suspended":
      return "bg-[#F8EAE7] text-[#9A5147]";
    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function portalStatusStyle(status: VendorPortalAccessStatus) {
  switch (status) {
    case "Active":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Invitation Pending":
      return "bg-[#F4EFE2] text-[#94743F]";
    case "Expired":
    case "Suspended":
      return "bg-[#F8EAE7] text-[#9A5147]";
    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

export function AdminVendorManagement({
  vendors,
  loading = false,
  updatingVendorId,
  error,
  onRefresh,
  onOpenVendor,
  onInviteVendor,
  onUpdateVendorStatus,
  onUpdatePortalAccess,
  onCreatePortalAccount,
  onOpenProject,
  onOpenInvoices,
  onAddVendor,
  onEditVendor,
  onManagePaymentSettings,
  onDeleteVendor,
}: AdminVendorManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<VendorStatusFilter>("All");
  const [portalFilter, setPortalFilter] =
    useState<PortalFilter>("All");

  const [selectedVendor, setSelectedVendor] =
    useState<AdminVendorRecord | null>(null);
  const [previewBill, setPreviewBill] = useState<BillPhotoTarget | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const [showDirectCredentials, setShowDirectCredentials] = useState(false);
  const [portalUsername, setPortalUsername] = useState("");
  const [portalPassword, setPortalPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [credentialSuccess, setCredentialSuccess] = useState<{ username: string; password: string } | null>(null);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialError, setCredentialError] = useState<string | null>(null);

  const counts = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter(
      (vendor) => vendor.status === "Active"
    ).length,
    suspended: vendors.filter(
      (vendor) => vendor.status === "Suspended"
    ).length,
    portalActive: vendors.filter(
      (vendor) => vendor.portalAccess === "Active"
    ).length,
    invitationsPending: vendors.filter(
      (vendor) => vendor.portalAccess === "Invitation Pending"
    ).length,
  }), [vendors]);

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const matchesSearch =
        !query ||
        vendor.businessName.toLowerCase().includes(query) ||
        vendor.reference.toLowerCase().includes(query) ||
        vendor.contactPerson.toLowerCase().includes(query) ||
        vendor.email.toLowerCase().includes(query) ||
        vendor.phone.toLowerCase().includes(query) ||
        vendor.vendorCategory.toLowerCase().includes(query) ||
        (vendor.location ?? "").toLowerCase().includes(query) ||
        vendor.linkedProjects.some((project) =>
          `${project.reference} ${project.name}`
            .toLowerCase()
            .includes(query)
        );

      const matchesStatus =
        statusFilter === "All" ||
        vendor.status === statusFilter;

      const matchesPortal =
        portalFilter === "All" ||
        vendor.portalAccess === portalFilter;

      return matchesSearch && matchesStatus && matchesPortal;
    });
  }, [vendors, search, statusFilter, portalFilter]);

  async function runAction(action: () => Promise<void>) {
    if (actionLoading) return;

    setActionLoading(true);
    setActionError("");

    try {
      await action();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "The operation could not be completed."
      );
    } finally {
      setActionLoading(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPortalFilter("All");
  }

  function openVendor(vendor: AdminVendorRecord) {
    if (selectedVendor?.id === vendor.id) {
      setSelectedVendor(null);
      return;
    }
    setSelectedVendor(vendor);
    setActionError("");
    const defaultUsername = vendor.email
      ? vendor.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_")
      : `vendor_${vendor.reference.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
    setPortalUsername(defaultUsername);
    setPortalPassword("Password123!");
    setCredentialSuccess(null);
    setCredentialError(null);
    setShowDirectCredentials(false);
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Page Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Vendor Records
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Vendor Management
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Manage vendor profiles, project assignments,
            invoice relationships and controlled portal access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onAddVendor && (
            <button
              type="button"
              onClick={onAddVendor}
              className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors shadow-sm font-semibold"
            >
              <UserPlus size={15} />
              + Register Vendor
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

      {/* Summary Cards */}
      <section className="mt-9 grid grid-cols-2 gap-px border border-[#D8D6D0] bg-[#D8D6D0] lg:grid-cols-5">
        <SummaryCard label="Total Vendors" value={counts.total} />
        <SummaryCard label="Active Vendors" value={counts.active} />
        <SummaryCard label="Suspended" value={counts.suspended} />
        <SummaryCard label="Portal Accounts Active" value={counts.portalActive} />
        <SummaryCard label="Invitations Pending" value={counts.invitationsPending} />
      </section>

      {/* Search and Filters */}
      <section className="mt-10">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search vendor, reference, contact, email, category or project..."
            aria-label="Search vendors"
            className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#A58A64]"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FilterSelect
            label="Vendor Status"
            value={statusFilter}
            options={["All", ...VENDOR_STATUSES]}
            onChange={(value) =>
              setStatusFilter(value as VendorStatusFilter)
            }
          />

          <FilterSelect
            label="Portal Access"
            value={portalFilter}
            options={["All", ...PORTAL_STATUSES]}
            onChange={(value) =>
              setPortalFilter(value as PortalFilter)
            }
          />
        </div>

        {(search || statusFilter !== "All" || portalFilter !== "All") && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[#77736C]">
              Showing {filteredVendors.length} of {vendors.length} vendors
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="text-[9px] uppercase tracking-widest text-[#987543]"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* Vendor Directory */}
      <section className="mt-9">
        <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              Business Directory
            </p>

            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Registered Vendors
            </h2>
          </div>

          <p className="font-mono text-[9px] text-[#99958D]">
            {filteredVendors.length} RECORDS
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading vendor records...
            </p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
            <Building2
              size={28}
              strokeWidth={1.3}
              className="mx-auto text-[#A58A64]"
            />

            <h3 className="mt-5 font-serif text-2xl text-[#171717]">
              No vendors found
            </h3>

            <p className="mt-3 text-xs text-[#77736C]">
              No vendor records match your current search and filters.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredVendors.map((vendor) => {
              const isExpanded = selectedVendor?.id === vendor.id;
              return (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  isExpanded={isExpanded}
                  onOpen={() => openVendor(vendor)}
                  expandedContent={
                    isExpanded && selectedVendor ? (
                      <div className="mt-4 space-y-4 border-t border-[#D8D6D0] pt-4">
                        {/* 1. Financial Relationship & Bills List */}
                        <section className="border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Receipt size={14} className="text-[#A58A64]" />
                              <h4 className="font-serif text-base text-[#171717]">
                                Bills &amp; Vouchers ({(selectedVendor.bills || []).length})
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px]">
                              <span className="text-[#77736C]">
                                Billed: <strong className="text-[#171717]">{formatCurrency(selectedVendor.totalBilledAmount || 0)}</strong>
                              </span>
                              <span className="text-[#77736C]">
                                Settled: <strong className="text-emerald-700">{formatCurrency(selectedVendor.totalSettledAmount || 0)}</strong>
                              </span>
                              <span className="text-[#77736C]">
                                Bal: <strong className="text-[#A58A64]">{formatCurrency(Math.max(0, (selectedVendor.totalBilledAmount || 0) - (selectedVendor.totalSettledAmount || 0)))}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            {(!selectedVendor.bills || selectedVendor.bills.length === 0) ? (
                              <div className="border border-[#E5E2DC] bg-white px-4 py-3 text-center text-xs text-[#77736C]">
                                No bills recorded for this trade partner yet.
                              </div>
                            ) : (
                              <div className="divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
                                {selectedVendor.bills.map((bill) => (
                                  <div
                                    key={bill.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setPreviewBill(bill)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setPreviewBill(bill);
                                      }
                                    }}
                                    className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2.5 text-xs hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                                  >
                                    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                                      <span className="font-mono text-xs font-semibold text-[#171717]">
                                        {bill.invoiceNumber || bill.billId || "BILL"}
                                      </span>
                                      {bill.tradeCategory && (
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#A58A64] bg-[#F4EFE2] px-2 py-0.5">
                                          {bill.tradeCategory}
                                        </span>
                                      )}
                                      <span className="text-xs text-[#555] truncate max-w-[220px]">
                                        {bill.projectName || "Studio Project"}
                                      </span>
                                      <span className="text-xs text-[#888]">
                                        · {formatDate(bill.createdAt)}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <span
                                        className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                                          bill.status === "Paid"
                                            ? "bg-[#EAF1E8] text-[#547A51]"
                                            : bill.status === "Approved"
                                            ? "bg-[#EAEFF5] text-[#526C8A]"
                                            : "bg-[#F4EFE2] text-[#94743F]"
                                        }`}
                                      >
                                        {bill.status}
                                      </span>
                                      <span className="font-mono text-xs font-semibold text-[#171717]">
                                        {formatCurrency(bill.amount)}
                                      </span>
                                      {bill.outstandingAmount !== undefined && bill.outstandingAmount > 0 && bill.outstandingAmount < bill.amount && (
                                        <span className="font-mono text-[10px] text-[#A58A64]">
                                          (Bal: {formatCurrency(bill.outstandingAmount)})
                                        </span>
                                      )}
                                      {bill.billPhotoUrl && (
                                        <a
                                          href={bill.billPhotoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          title="View Upload"
                                          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#A58A64] hover:underline"
                                        >
                                          <ExternalLink size={11} />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          printBillVoucher(bill, selectedVendor);
                                        }}
                                        className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#171717] hover:text-[#A58A64] transition-colors"
                                      >
                                        <FileText size={11} /> Print
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </section>

                        {/* 2. Two-column equal-height details: Vendor Account + Assigned Projects */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch">
                          <section className="flex flex-col justify-between border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <SectionHeading>Vendor Account</SectionHeading>
                                <span
                                  className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${vendorStatusStyle(selectedVendor.status)}`}
                                >
                                  {selectedVendor.status}
                                </span>
                              </div>

                              <label className="mt-3 block">
                                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                                  Update Vendor Status
                                </span>
                                <select
                                  value={selectedVendor.status}
                                  disabled={actionLoading || updatingVendorId === selectedVendor.id}
                                  onChange={(event) => {
                                    const status = event.target.value as AdminVendorStatus;
                                    void runAction(() => onUpdateVendorStatus(selectedVendor.id, status));
                                  }}
                                  className="h-9 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
                                >
                                  {VENDOR_STATUSES.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#E5E2DC] pt-3">
                              <div className="border border-[#E5E2DC] bg-white px-3 py-2">
                                <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">Created</p>
                                <p className="mt-0.5 text-xs text-[#33312D]">{formatDate(selectedVendor.createdAt)}</p>
                              </div>
                              <div className="border border-[#E5E2DC] bg-white px-3 py-2">
                                <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">Last Updated</p>
                                <p className="mt-0.5 text-xs text-[#33312D]">{formatDate(selectedVendor.lastUpdated)}</p>
                              </div>
                            </div>
                          </section>

                          <section className="flex flex-col border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-2.5">
                              <SectionHeading>Assigned Projects</SectionHeading>
                              <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                                {selectedVendor.linkedProjects.length} Projects
                              </p>
                            </div>

                            {selectedVendor.linkedProjects.length === 0 ? (
                              <div className="mt-3 flex flex-1 items-center justify-center border border-[#E5E2DC] bg-white p-4 text-center text-xs text-[#77736C]">
                                No projects are assigned to this vendor.
                              </div>
                            ) : (
                              <div className="mt-3 divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
                                {selectedVendor.linkedProjects.map((project) => (
                                  <button
                                    key={project.id}
                                    type="button"
                                    disabled={!onOpenProject}
                                    onClick={() => onOpenProject?.(project.id)}
                                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-[#FAF9F6] disabled:cursor-default"
                                  >
                                    <span className="min-w-0 flex items-center gap-2.5">
                                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#A58A64]">
                                        {project.reference}
                                      </span>
                                      <span className="text-xs font-medium text-[#171717] truncate">
                                        {project.name}
                                      </span>
                                    </span>
                                    <span className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-[#77736C]">
                                      {project.status}
                                      <ArrowUpRight size={12} className="text-[#A58A64]" />
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </section>
                        </div>

                        {actionError && (
                          <div
                            role="alert"
                            className="border border-[#E3C9C5] bg-[#FAF3F1] p-3 text-xs text-[#805B55]"
                          >
                            {actionError}
                          </div>
                        )}

                        {/* Inline Action Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {onEditVendor && (
                              <button
                                type="button"
                                onClick={() => onEditVendor(selectedVendor)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 bg-[#171717] px-2 py-1 font-mono text-[7px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors"
                              >
                                <Edit3 size={9} />
                                Edit Details
                              </button>
                            )}
                            {onManagePaymentSettings && (
                              <button
                                type="button"
                                onClick={() => onManagePaymentSettings(selectedVendor)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 border border-[#B68A4A] bg-white px-2 py-1 font-mono text-[7px] uppercase tracking-widest text-[#B68A4A] hover:bg-[#B68A4A] hover:text-white transition-colors"
                              >
                                <CreditCard size={9} />
                                Bank & QR
                              </button>
                            )}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedVendor(null)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-white px-2 py-1 font-mono text-[7px] uppercase tracking-widest text-[#77736C] hover:border-[#171717] hover:text-[#171717] disabled:opacity-40 transition-colors"
                            >
                              <X size={9} />
                              Close Review
                            </button>
                          </div>
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

      <BillPhotoModal
        bill={previewBill}
        onClose={() => setPreviewBill(null)}
        onPhotoUploaded={(updatedBill, newPhotoUrl) => {
          setPreviewBill((prev) => (prev ? { ...prev, billPhotoUrl: newPhotoUrl } : prev));
          setSelectedVendor((prev) =>
            prev
              ? {
                  ...prev,
                  bills: (prev.bills || []).map((b) =>
                    b.id === updatedBill.id ? { ...b, billPhotoUrl: newPhotoUrl } : b
                  ),
                }
              : prev
          );
          onRefresh?.();
        }}
      />
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white p-5 md:p-6">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-5 font-serif text-3xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function VendorCard({
  vendor,
  isExpanded = false,
  onOpen,
  expandedContent,
}: {
  vendor: AdminVendorRecord;
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
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
            <Building2 size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="break-words font-serif text-xl text-[#171717]">
                {vendor.businessName}
              </h3>
              <span className="text-xs text-[#77736C]">
                · {vendor.vendorCategory} · {vendor.contactPerson}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {!isExpanded && (
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-[#FAF9F6] px-2 py-1 text-[7px] uppercase tracking-widest text-[#987543] hover:border-[#171717] hover:text-[#171717] transition-colors rounded-sm"
            >
              Review Vendor
              <ArrowUpRight size={9} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E5E2DC] pt-4 sm:grid-cols-3">
        <VendorDetail
          icon={<Mail size={13} />}
          value={vendor.email}
        />

        <VendorDetail
          icon={<Phone size={13} />}
          value={vendor.phone}
        />

        <VendorDetail
          icon={<MapPin size={13} />}
          value={vendor.location || "Location not specified"}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DC] pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#77736C]">
          <span>Projects: <strong className="text-[#171717]">{vendor.linkedProjects.length}</strong></span>
          <span>Billed: <strong className="text-[#171717]">{formatCurrency(vendor.totalBilledAmount || 0)}</strong></span>
          <span>Bills: <strong className="text-[#171717]">{vendor.submittedInvoiceCount}</strong></span>
          <span>Due: <strong className="text-[#A58A64]">{vendor.outstandingInvoiceCount}</strong></span>
          <span>· Created: {formatDate(vendor.createdAt)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${vendorStatusStyle(vendor.status)}`}
          >
            {vendor.status}
          </span>

          <span
            className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${portalStatusStyle(vendor.portalAccess)}`}
          >
            Portal: {vendor.portalAccess}
          </span>
        </div>
      </div>

      {isExpanded && expandedContent}
    </article>
  );
}

function VendorDetail({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 text-xs text-[#77736C]">
      <span className="shrink-0 text-[#A58A64]">{icon}</span>
      <span className="break-all">{value}</span>
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
      <span className="mt-0.5 shrink-0 text-[#A58A64]">{icon}</span>

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

function MetadataCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[#D8D6D0] bg-white p-4">
      <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-2 text-xs text-[#33312D]">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-[#FAF9F6] px-3 py-2.5">
      <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-1 font-serif text-xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="font-serif text-base text-[#171717]">
      {children}
    </h4>
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
