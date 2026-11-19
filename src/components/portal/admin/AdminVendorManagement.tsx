
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
} from "lucide-react";

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

export interface AdminVendorRecord {
  id: string;
  reference: string;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  vendorCategory: string;
  location?: string;
  status: AdminVendorStatus;
  portalAccess: VendorPortalAccessStatus;
  linkedProjects: AdminVendorProject[];
  submittedInvoiceCount: number;
  outstandingInvoiceCount: number;
  createdAt: string;
  lastUpdated: string;
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

  onOpenProject?: (projectId: string) => void;

  onOpenInvoices?: (vendorId: string) => void;
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
  onOpenProject,
  onOpenInvoices,
}: AdminVendorManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<VendorStatusFilter>("All");
  const [portalFilter, setPortalFilter] =
    useState<PortalFilter>("All");

  const [selectedVendor, setSelectedVendor] =
    useState<AdminVendorRecord | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

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
    setSelectedVendor(vendor);
    setActionError("");
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

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64] disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh Vendors
          </button>
        )}
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
            {filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onOpen={() => openVendor(vendor)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Vendor Detail Drawer */}
      {selectedVendor && (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-black/50"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              setSelectedVendor(null);
            }
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-detail-title"
            className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#F2F0EB] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6D0] bg-[#F2F0EB] px-6 py-5 md:px-8">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  Vendor Record / {selectedVendor.reference}
                </p>

                <h2
                  id="vendor-detail-title"
                  className="mt-2 font-serif text-2xl text-[#171717]"
                >
                  Vendor Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                disabled={actionLoading}
                aria-label="Close vendor details"
                className="text-[#77736C] disabled:opacity-40"
              >
                <X size={21} />
              </button>
            </div>

            <div className="flex-1 space-y-7 p-6 md:p-8">

              {/* Business Profile */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
                    <Building2 size={20} />
                  </div>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${vendorStatusStyle(selectedVendor.status)}`}
                  >
                    {selectedVendor.status}
                  </span>
                </div>

                <h3 className="mt-5 font-serif text-3xl text-[#171717]">
                  {selectedVendor.businessName}
                </h3>

                <p className="mt-2 text-xs text-[#77736C]">
                  {selectedVendor.vendorCategory}
                </p>

                <div className="mt-6 space-y-4 border-t border-[#E5E2DC] pt-5">
                  <DetailLine
                    icon={<Users size={15} />}
                    label="Contact Person"
                    value={selectedVendor.contactPerson}
                  />

                  <DetailLine
                    icon={<Mail size={15} />}
                    label="Email"
                    value={selectedVendor.email}
                  />

                  <DetailLine
                    icon={<Phone size={15} />}
                    label="Phone"
                    value={selectedVendor.phone}
                  />

                  {selectedVendor.location && (
                    <DetailLine
                      icon={<MapPin size={15} />}
                      label="Location"
                      value={selectedVendor.location}
                    />
                  )}
                </div>
              </section>

              {/* Vendor Account */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Vendor Account</SectionHeading>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#77736C]">
                    Account status
                  </p>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${vendorStatusStyle(selectedVendor.status)}`}
                  >
                    {selectedVendor.status}
                  </span>
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Update Vendor Status
                  </span>

                  <select
                    value={selectedVendor.status}
                    disabled={
                      actionLoading ||
                      updatingVendorId === selectedVendor.id
                    }
                    onChange={(event) => {
                      const status = event.target.value as AdminVendorStatus;

                      void runAction(() =>
                        onUpdateVendorStatus(
                          selectedVendor.id,
                          status
                        )
                      );
                    }}
                    className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
                  >
                    {VENDOR_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              {/* Portal Access */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-[#A58A64]"
                  />

                  <div>
                    <SectionHeading>Vendor Portal Access</SectionHeading>

                    <p className="mt-2 text-xs leading-6 text-[#77736C]">
                      Vendor accounts are invitation-controlled.
                      Invitations, expiry and account activation
                      must be managed by the authentication service.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-[#E5E2DC] py-4">
                  <p className="text-xs text-[#77736C]">
                    Current portal status
                  </p>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${portalStatusStyle(selectedVendor.portalAccess)}`}
                  >
                    {selectedVendor.portalAccess}
                  </span>
                </div>

                {selectedVendor.portalAccess === "Not Invited" && (
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      selectedVendor.status !== "Active"
                    }
                    onClick={() =>
                      void runAction(() =>
                        onInviteVendor(selectedVendor.id)
                      )
                    }
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <UserPlus size={15} />
                    Send Vendor Invitation
                  </button>
                )}

                {selectedVendor.portalAccess === "Invitation Pending" && (
                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        void runAction(() =>
                          onUpdatePortalAccess(
                            selectedVendor.id,
                            "resend"
                          )
                        )
                      }
                      className="inline-flex w-full items-center justify-center gap-2 border border-[#D8D6D0] px-5 py-4 text-[9px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64] disabled:opacity-40"
                    >
                      <Mail size={15} />
                      Resend Invitation
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        void runAction(() =>
                          onUpdatePortalAccess(
                            selectedVendor.id,
                            "revoke"
                          )
                        )
                      }
                      className="w-full border border-[#E3C9C5] px-5 py-4 text-[9px] uppercase tracking-widest text-[#9A5147] disabled:opacity-40"
                    >
                      Revoke Invitation
                    </button>
                  </div>
                )}

                {selectedVendor.portalAccess === "Expired" && (
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      selectedVendor.status !== "Active"
                    }
                    onClick={() =>
                      void runAction(() =>
                        onInviteVendor(selectedVendor.id)
                      )
                    }
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-40"
                  >
                    <RefreshCw size={15} />
                    Issue New Invitation
                  </button>
                )}

                {selectedVendor.portalAccess === "Active" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void runAction(() =>
                        onUpdatePortalAccess(
                          selectedVendor.id,
                          "revoke"
                        )
                      )
                    }
                    className="mt-5 w-full border border-[#E3C9C5] px-5 py-4 text-[9px] uppercase tracking-widest text-[#9A5147] disabled:opacity-40"
                  >
                    Revoke Portal Access
                  </button>
                )}

                {selectedVendor.portalAccess === "Suspended" && (
                  <p className="mt-5 text-xs leading-6 text-[#9A5147]">
                    Vendor portal access is suspended. Reactivation
                    must follow the studio&apos;s authorised access-review
                    procedure.
                  </p>
                )}
              </section>

              {/* Project Associations */}
              <section>
                <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-4">
                  <div>
                    <SectionHeading>Project Association</SectionHeading>

                    <h3 className="mt-3 font-serif text-2xl text-[#171717]">
                      Assigned Projects
                    </h3>
                  </div>

                  <p className="font-mono text-[9px] text-[#99958D]">
                    {selectedVendor.linkedProjects.length} PROJECTS
                  </p>
                </div>

                {selectedVendor.linkedProjects.length === 0 ? (
                  <div className="mt-4 border border-[#D8D6D0] bg-white p-7 text-center">
                    <FolderKanban
                      size={24}
                      className="mx-auto text-[#A58A64]"
                    />

                    <p className="mt-3 text-xs text-[#77736C]">
                      No projects are assigned to this vendor.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedVendor.linkedProjects.map((project) => (
                      <button
                        key={project.id}
                        type="button"
                        disabled={!onOpenProject}
                        onClick={() => onOpenProject?.(project.id)}
                        className="flex w-full items-center justify-between gap-4 border border-[#D8D6D0] bg-white p-5 text-left hover:border-[#A58A64] disabled:cursor-default"
                      >
                        <span className="min-w-0">
                          <span className="block font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                            {project.reference}
                          </span>

                          <span className="mt-2 block font-serif text-xl text-[#171717]">
                            {project.name}
                          </span>

                          <span className="mt-2 block text-[9px] text-[#77736C]">
                            {project.status}
                          </span>
                        </span>

                        <ArrowUpRight
                          size={17}
                          className="shrink-0 text-[#A58A64]"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </section>

              {/* Invoice Relationship */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <SectionHeading>Financial Relationship</SectionHeading>

                    <h3 className="mt-3 font-serif text-2xl text-[#171717]">
                      Invoice Overview
                    </h3>
                  </div>

                  <FileText
                    size={21}
                    className="text-[#A58A64]"
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-px border border-[#D8D6D0] bg-[#D8D6D0]">
                  <div className="bg-[#FAF9F6] p-5">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                      Submitted Invoices
                    </p>

                    <p className="mt-3 font-serif text-3xl text-[#171717]">
                      {selectedVendor.submittedInvoiceCount}
                    </p>
                  </div>

                  <div className="bg-[#FAF9F6] p-5">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
                      Outstanding Invoices
                    </p>

                    <p className="mt-3 font-serif text-3xl text-[#171717]">
                      {selectedVendor.outstandingInvoiceCount}
                    </p>
                  </div>
                </div>

                {onOpenInvoices && (
                  <button
                    type="button"
                    onClick={() => onOpenInvoices(selectedVendor.id)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 border border-[#D8D6D0] px-5 py-4 text-[9px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64]"
                  >
                    <FileText size={15} />
                    Open Vendor Invoices
                    <ArrowUpRight size={14} />
                  </button>
                )}

                <p className="mt-4 text-[10px] leading-5 text-[#99958D]">
                  Invoice counts are informational. Approval,
                  outstanding balances and payment status must come
                  from verified finance records.
                </p>
              </section>

              {/* Metadata */}
              <section className="grid grid-cols-2 gap-3">
                <MetadataCard
                  label="Vendor Created"
                  value={formatDate(selectedVendor.createdAt)}
                />

                <MetadataCard
                  label="Last Updated"
                  value={formatDate(selectedVendor.lastUpdated)}
                />
              </section>

              {actionError && (
                <div
                  role="alert"
                  className="border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs leading-6 text-[#805B55]"
                >
                  {actionError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-[#D8D6D0] bg-[#F2F0EB] p-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSelectedVendor(null)}
                  disabled={actionLoading}
                  className="flex-1 border border-[#D8D6D0] px-5 py-4 text-[9px] uppercase tracking-widest text-[#77736C] disabled:opacity-40"
                >
                  Close
                </button>

                {onOpenVendor && (
                  <button
                    type="button"
                    onClick={() => onOpenVendor(selectedVendor.id)}
                    className="flex-1 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64]"
                  >
                    Open Full Vendor Record
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
  onOpen,
}: {
  vendor: AdminVendorRecord;
  onOpen: () => void;
}) {
  return (
    <article className="border border-[#D8D6D0] bg-white p-5 md:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
            <Building2 size={19} />
          </div>

          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              {vendor.reference}
            </p>

            <h3 className="mt-2 break-words font-serif text-2xl text-[#171717]">
              {vendor.businessName}
            </h3>

            <p className="mt-2 text-xs text-[#77736C]">
              {vendor.vendorCategory} · {vendor.contactPerson}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${vendorStatusStyle(vendor.status)}`}
          >
            {vendor.status}
          </span>

          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${portalStatusStyle(vendor.portalAccess)}`}
          >
            Portal: {vendor.portalAccess}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E5E2DC] pt-5 md:grid-cols-3">
        <VendorDetail
          icon={<Mail size={14} />}
          value={vendor.email}
        />

        <VendorDetail
          icon={<Phone size={14} />}
          value={vendor.phone}
        />

        <VendorDetail
          icon={<MapPin size={14} />}
          value={vendor.location || "Location not specified"}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#E5E2DC] pt-5 md:grid-cols-3">
        <MiniMetric
          label="Assigned Projects"
          value={vendor.linkedProjects.length}
        />

        <MiniMetric
          label="Submitted Invoices"
          value={vendor.submittedInvoiceCount}
        />

        <MiniMetric
          label="Outstanding Invoices"
          value={vendor.outstandingInvoiceCount}
        />
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-5 sm:flex-row sm:items-center">
        <p className="text-[10px] text-[#77736C]">
          Created: {formatDate(vendor.createdAt)}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
        >
          Review Vendor
          <ArrowUpRight size={14} />
        </button>
      </div>
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
    <div className="bg-[#FAF9F6] p-4">
      <p className="font-mono text-[8px] uppercase tracking-widest text-[#99958D]">
        {label}
      </p>

      <p className="mt-3 font-serif text-2xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
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
