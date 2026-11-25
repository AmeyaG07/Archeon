
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Search,
  Users,
  Mail,
  Phone,
  MapPin,
  Building2,
  FolderKanban,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
  AlertCircle,
  Clock3,
  KeyRound,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Receipt,
} from "lucide-react";
import { BillPhotoModal, type BillPhotoTarget } from "@/components/portal/admin/BillPhotoModal";

export type AdminClientStatus =
  | "Active"
  | "Inactive"
  | "Suspended";

export type ClientPortalAccessStatus =
  | "Not Invited"
  | "Invitation Pending"
  | "Active"
  | "Expired"
  | "Suspended";

export interface AdminClientProject {
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

export interface AdminClientBillItem {
  id: string;
  billId?: string;
  invoiceNumber?: string;
  projectId?: string;
  projectName?: string;
  vendorId?: string;
  tradeCategory?: string;
  amount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  billPhotoUrl?: string;
}

export interface AdminClientRecord {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  organisation?: string;
  location?: string;
  status: AdminClientStatus;
  portalAccess: ClientPortalAccessStatus;
  createdAt: string;
  lastUpdated: string;
  notes?: string;
  projects: AdminClientProject[];
  bills?: AdminClientBillItem[];
}

interface AdminClientManagementProps {
  clients: AdminClientRecord[];
  loading?: boolean;
  updatingClientId?: string;
  error?: string;

  onRefresh?: () => void;

  onOpenClient?: (clientId: string) => void;

  onInviteClient: (
    clientId: string
  ) => Promise<void>;

  onUpdateClientStatus: (
    clientId: string,
    status: AdminClientStatus
  ) => Promise<void>;

  onUpdatePortalAccess: (
    clientId: string,
    action: "resend" | "revoke"
  ) => Promise<void>;

  onCreatePortalAccount?: (
    clientId: string,
    username: string,
    password: string
  ) => Promise<any>;

  onOpenProject?: (projectId: string) => void;
  onAddClient?: () => void;
  onAddBill?: (client?: AdminClientRecord) => void;
  onEditClient?: (client: AdminClientRecord) => void;
  onDeleteClient?: (clientId: string) => Promise<void>;
}

type ClientStatusFilter = "All" | AdminClientStatus;
type PortalFilter = "All" | ClientPortalAccessStatus;

const CLIENT_STATUSES: AdminClientStatus[] = [
  "Active",
  "Inactive",
  "Suspended",
];

const PORTAL_STATUSES: ClientPortalAccessStatus[] = [
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

function getClientStatusStyle(status: AdminClientStatus) {
  switch (status) {
    case "Active":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Suspended":
      return "bg-[#F8EAE7] text-[#9A5147]";
    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getPortalStatusStyle(status: ClientPortalAccessStatus) {
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

export function AdminClientManagement({
  clients,
  loading = false,
  updatingClientId,
  error,
  onRefresh,
  onOpenClient,
  onInviteClient,
  onUpdateClientStatus,
  onUpdatePortalAccess,
  onCreatePortalAccount,
  onOpenProject,
  onAddClient,
  onAddBill,
  onEditClient,
  onDeleteClient,
}: AdminClientManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ClientStatusFilter>("All");
  const [portalFilter, setPortalFilter] =
    useState<PortalFilter>("All");

  const [selectedClient, setSelectedClient] =
    useState<AdminClientRecord | null>(null);
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
    total: clients.length,
    active: clients.filter(
      (client) => client.status === "Active"
    ).length,
    suspended: clients.filter(
      (client) => client.status === "Suspended"
    ).length,
    portalActive: clients.filter(
      (client) => client.portalAccess === "Active"
    ).length,
    invitationsPending: clients.filter(
      (client) => client.portalAccess === "Invitation Pending"
    ).length,
  }), [clients]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !query ||
        client.fullName.toLowerCase().includes(query) ||
        client.reference.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        (client.organisation ?? "").toLowerCase().includes(query) ||
        (client.location ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        client.status === statusFilter;

      const matchesPortal =
        portalFilter === "All" ||
        client.portalAccess === portalFilter;

      return matchesSearch && matchesStatus && matchesPortal;
    });
  }, [clients, search, statusFilter, portalFilter]);

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

  function openClient(client: AdminClientRecord) {
    if (selectedClient?.id === client.id) {
      setSelectedClient(null);
      return;
    }
    setSelectedClient(client);
    setActionError("");
    const defaultUsername = client.email
      ? client.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_")
      : `client_${client.reference.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
    setPortalUsername(defaultUsername);
    setPortalPassword("Password123!");
    setCredentialSuccess(null);
    setCredentialError(null);
    setShowDirectCredentials(false);
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-2.5 sm:px-5 py-6 sm:py-9 md:px-10 md:py-12 lg:px-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / Client Records
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Client Management
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Manage client records, project associations and
            invitation-controlled portal access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onAddBill && (
            <button
              type="button"
              onClick={() => onAddBill()}
              className="inline-flex items-center gap-2 rounded-sm border border-[#A58A64] bg-[#FAF9F5] px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-[#171717] hover:bg-[#A58A64] hover:text-white transition-colors shadow-sm font-semibold"
            >
              <Receipt size={15} className="text-[#A58A64]" />
              + Add Bill
            </button>
          )}

          {onAddClient && (
            <button
              type="button"
              onClick={onAddClient}
              className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors shadow-sm font-semibold"
            >
              <UserPlus size={15} />
              + Register Client
            </button>
          )}
        </div>
      </header>

      {/* Error */}
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

      {/* Summary */}
      <section className="mt-9 grid grid-cols-1 sm:grid-cols-2 gap-px border border-[#D8D6D0] bg-[#D8D6D0] lg:grid-cols-5">
        <SummaryCard label="Total Clients" value={counts.total} />
        <SummaryCard label="Active Clients" value={counts.active} />
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
            placeholder="Search client, reference, email, phone or organisation..."
            aria-label="Search clients"
            className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#A58A64]"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <FilterSelect
            label="Client Status"
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as ClientStatusFilter)
            }
            options={["All", ...CLIENT_STATUSES]}
          />

          <FilterSelect
            label="Portal Access"
            value={portalFilter}
            onChange={(value) =>
              setPortalFilter(value as PortalFilter)
            }
            options={["All", ...PORTAL_STATUSES]}
          />
        </div>

        {(search || statusFilter !== "All" || portalFilter !== "All") && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[#77736C]">
              Showing {filteredClients.length} of {clients.length} clients
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

      {/* Client Register */}
      <section className="mt-9">
        <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              Client Directory
            </p>

            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Registered Clients
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <p className="font-mono text-[9px] text-[#99958D]">
              {filteredClients.length} RECORDS
            </p>
            {onAddClient && (
              <button
                type="button"
                onClick={onAddClient}
                className="inline-flex items-center gap-2 rounded-sm bg-[#171717] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors shadow-xs"
              >
                <UserPlus size={13} />
                Register Client
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading client records...
            </p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
            <Users
              size={28}
              strokeWidth={1.3}
              className="mx-auto text-[#A58A64]"
            />

            <h3 className="mt-5 font-serif text-2xl text-[#171717]">
              No clients found
            </h3>

            <p className="mt-3 text-xs text-[#77736C]">
              No client records match your current search and filters.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredClients.map((client) => {
              const isExpanded = selectedClient?.id === client.id;
              const clientBills = client.bills || [];
              const totalBilled = clientBills.reduce((sum, b) => sum + b.amount, 0);
              const totalPaid = clientBills.reduce((sum, b) => sum + b.paidAmount, 0);
              const totalOutstanding = Math.max(0, totalBilled - totalPaid);

              return (
                <ClientCard
                  key={client.id}
                  client={client}
                  isExpanded={isExpanded}
                  onOpen={() => openClient(client)}
                  onAddBill={onAddBill ? () => onAddBill(client) : undefined}
                  expandedContent={
                    isExpanded && selectedClient ? (
                      <div className="mt-4 space-y-4 border-t border-[#D8D6D0] pt-4">
                        {/* Bills List for this Client */}
                        <section className="border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Receipt size={14} className="text-[#A58A64]" />
                              <h4 className="font-serif text-base text-[#171717]">
                                Client Bills ({clientBills.length})
                              </h4>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px]">
                              <span className="text-[#77736C]">
                                Billed: <strong className="text-[#171717]">{formatCurrency(totalBilled)}</strong>
                              </span>
                              <span className="text-[#77736C]">
                                Paid: <strong className="text-emerald-700">{formatCurrency(totalPaid)}</strong>
                              </span>
                              <span className="text-[#77736C]">
                                Bal: <strong className="text-[#A58A64]">{formatCurrency(totalOutstanding)}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="mt-3">
                            {clientBills.length === 0 ? (
                              <div className="border border-[#E5E2DC] bg-white px-4 py-3 text-center text-xs text-[#77736C]">
                                No bills recorded for this client yet.
                              </div>
                            ) : (
                              <div className="divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
                                {clientBills.map((bill) => {
                                  const balance = Math.max(0, bill.amount - bill.paidAmount);
                                  return (
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
                                        <span className="text-xs text-[#55514A] truncate max-w-[240px]">
                                          {bill.projectName || "Studio Project"}
                                        </span>
                                        <span className="text-xs text-[#888]">
                                          · {formatDate(bill.createdAt)}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-3 shrink-0">
                                        <span className="bg-[#F4EFE2] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[#94743F]">
                                          {bill.status}
                                        </span>
                                        <span className="font-mono text-xs font-semibold text-[#171717]">
                                          {formatCurrency(bill.amount)}
                                        </span>
                                        {balance > 0 && balance < bill.amount && (
                                          <span className="font-mono text-[10px] text-[#A58A64]">
                                            (Bal: {formatCurrency(balance)})
                                          </span>
                                        )}
                                        {bill.billPhotoUrl && (
                                          <a
                                            href={bill.billPhotoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#A58A64] hover:underline"
                                          >
                                            <ExternalLink size={11} />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </section>

                        {/* Two-column equal-height details: Account + Linked Projects */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 items-stretch">
                          <section className="flex flex-col justify-between border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <SectionHeading>Client Account</SectionHeading>
                                <span
                                  className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${getClientStatusStyle(selectedClient.status)}`}
                                >
                                  {selectedClient.status}
                                </span>
                              </div>

                              <label className="mt-3 block">
                                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-[#77736C]">
                                  Update Account Status
                                </span>
                                <select
                                  value={selectedClient.status}
                                  disabled={actionLoading || updatingClientId === selectedClient.id}
                                  onChange={(event) => {
                                    const status = event.target.value as AdminClientStatus;
                                    void runAction(() => onUpdateClientStatus(selectedClient.id, status));
                                  }}
                                  className="h-9 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
                                >
                                  {CLIENT_STATUSES.map((status) => (
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
                                <p className="mt-0.5 text-xs text-[#33312D]">{formatDate(selectedClient.createdAt)}</p>
                              </div>
                              <div className="border border-[#E5E2DC] bg-white px-3 py-2">
                                <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">Last Updated</p>
                                <p className="mt-0.5 text-xs text-[#33312D]">{formatDate(selectedClient.lastUpdated)}</p>
                              </div>
                            </div>
                          </section>

                          <section className="flex flex-col border border-[#D8D6D0] bg-[#FAF9F6] p-4">
                            <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-2.5">
                              <SectionHeading>Linked Projects</SectionHeading>
                              <p className="font-mono text-[10px] uppercase tracking-wider text-[#99958D]">
                                {selectedClient.projects.length} Projects
                              </p>
                            </div>

                            {selectedClient.projects.length === 0 ? (
                              <div className="mt-3 flex flex-1 items-center justify-center border border-[#E5E2DC] bg-white p-4 text-center text-xs text-[#77736C]">
                                No projects are linked to this client.
                              </div>
                            ) : (
                              <div className="mt-3 divide-y divide-[#E5E2DC] border border-[#D8D6D0] bg-white">
                                {selectedClient.projects.map((project) => (
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
                          <div>
                            {onEditClient && (
                              <button
                                type="button"
                                onClick={() => onEditClient(selectedClient)}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1 bg-[#171717] px-2 py-1 font-mono text-[7px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors"
                              >
                                <Edit3 size={9} />
                                Edit Client
                              </button>
                            )}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedClient(null)}
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
          setSelectedClient((prev) =>
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
    <div className="bg-white p-3.5 sm:p-5 md:p-6 min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-wider text-[#99958D] break-words">
        {label}
      </p>

      <p className="mt-3 sm:mt-5 font-serif text-2xl sm:text-3xl text-[#171717]">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}

function ClientCard({
  client,
  isExpanded = false,
  onOpen,
  onAddBill,
  expandedContent,
}: {
  client: AdminClientRecord;
  isExpanded?: boolean;
  onOpen: () => void;
  onAddBill?: () => void;
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
            <Users size={16} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="break-words font-serif text-xl text-[#171717]">
                {client.fullName}
              </h3>
              {client.organisation && (
                <span className="text-xs text-[#77736C]">
                  · {client.organisation}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {onAddBill && (
            <button
              type="button"
              onClick={onAddBill}
              className="inline-flex items-center gap-1 rounded-xs bg-[#171717] px-2 py-1 font-mono text-[7px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors shadow-xs"
            >
              <Receipt size={9} className="text-[#A58A64]" />
              + Add Bill
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#E5E2DC] pt-4 sm:grid-cols-3">
        <ClientDetail
          icon={<Mail size={13} />}
          value={client.email}
        />

        <ClientDetail
          icon={<Phone size={13} />}
          value={client.phone}
        />

        <ClientDetail
          icon={<MapPin size={13} />}
          value={client.location || "Location not specified"}
        />
      </div>

      {client.notes ? (
        <div className="mt-3 rounded-xs border border-[#E5E2DC] bg-[#FAF8F5] px-3 py-2 text-xs">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#A58A64] font-semibold mr-2">
            Notes:
          </span>
          <span className="font-sans text-xs text-[#55524D] line-clamp-1">
            {client.notes}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DC] pt-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#77736C]">
          <span>
            <FolderKanban
              size={12}
              className="mr-1 inline-block"
            />
            {client.projects.length} linked projects
          </span>

          <span>
            Created: {formatDate(client.createdAt)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${getClientStatusStyle(client.status)}`}
          >
            {client.status}
          </span>

          <span
            className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${getPortalStatusStyle(client.portalAccess)}`}
          >
            Portal: {client.portalAccess}
          </span>

          {!isExpanded && (
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center gap-1 border border-[#D8D6D0] bg-[#FAF9F6] px-2 py-1 text-[7px] uppercase tracking-widest text-[#987543] hover:border-[#171717] hover:text-[#171717] transition-colors rounded-sm"
            >
              Review Client
              <ArrowUpRight size={9} />
            </button>
          )}
        </div>
      </div>

      {isExpanded && expandedContent}
    </article>
  );
}

function ClientDetail({
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
