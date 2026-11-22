
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
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

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
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 border border-[#D8D6D0] bg-white px-5 py-3 text-[10px] uppercase tracking-widest text-[#55514A] hover:border-[#A58A64] disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh Clients
            </button>
          )}

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
      <section className="mt-9 grid grid-cols-2 gap-px border border-[#D8D6D0] bg-[#D8D6D0] lg:grid-cols-5">
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
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onOpen={() => openClient(client)}
                onAddBill={onAddBill ? () => onAddBill(client) : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Client Detail Drawer */}
      {selectedClient && (
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-[60] flex justify-end bg-black/50"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              setSelectedClient(null);
            }
          }}
        >
          <aside
            data-lenis-prevent="true"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-detail-title"
            className="flex h-full w-full max-w-2xl flex-col overflow-y-auto overscroll-contain bg-[#F2F0EB] shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6D0] bg-[#F2F0EB] px-6 py-5 md:px-8">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  Client Record / {selectedClient.reference}
                </p>

                <h2
                  id="client-detail-title"
                  className="mt-2 font-serif text-2xl text-[#171717]"
                >
                  Client Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                disabled={actionLoading}
                aria-label="Close client details"
                className="text-[#77736C] disabled:opacity-40"
              >
                <X size={21} />
              </button>
            </div>

            <div className="flex-1 space-y-7 p-6 md:p-8">

              {/* Identity */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
                    <Users size={20} />
                  </div>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${getClientStatusStyle(selectedClient.status)}`}
                  >
                    {selectedClient.status}
                  </span>
                </div>

                <h3 className="mt-5 font-serif text-3xl text-[#171717]">
                  {selectedClient.fullName}
                </h3>

                {selectedClient.organisation && (
                  <p className="mt-2 text-xs text-[#77736C]">
                    {selectedClient.organisation}
                  </p>
                )}

                <div className="mt-6 space-y-4 border-t border-[#E5E2DC] pt-5">
                  <DetailLine
                    icon={<Mail size={15} />}
                    label="Email"
                    value={selectedClient.email}
                  />

                  <DetailLine
                    icon={<Phone size={15} />}
                    label="Phone"
                    value={selectedClient.phone}
                  />

                  {selectedClient.location && (
                    <DetailLine
                      icon={<MapPin size={15} />}
                      label="Location"
                      value={selectedClient.location}
                    />
                  )}

                  {selectedClient.notes && (
                    <div className="mt-4 rounded-xs border border-[#E5E2DC] bg-[#FAF8F5] p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#A58A64] font-semibold mb-1">
                        <FileText size={11} /> Client Specifications
                      </div>
                      <p className="font-sans text-xs text-[#444] leading-relaxed">
                        {selectedClient.notes}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Account Status */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Client Account</SectionHeading>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[#77736C]">
                    Account status
                  </p>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${getClientStatusStyle(selectedClient.status)}`}
                  >
                    {selectedClient.status}
                  </span>
                </div>

                <label className="mt-5 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Update Account Status
                  </span>

                  <select
                    value={selectedClient.status}
                    disabled={
                      actionLoading ||
                      updatingClientId === selectedClient.id
                    }
                    onChange={(event) => {
                      const status = event.target.value as AdminClientStatus;

                      void runAction(() =>
                        onUpdateClientStatus(
                          selectedClient.id,
                          status
                        )
                      );
                    }}
                    className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
                  >
                    {CLIENT_STATUSES.map((status) => (
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
                    <SectionHeading>Portal Access Control</SectionHeading>

                    <p className="mt-2 text-xs leading-6 text-[#77736C]">
                      Client access is invitation-controlled.
                      Account activation and revocation must be
                      confirmed by the authentication service.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-[#E5E2DC] py-4">
                  <p className="text-xs text-[#77736C]">
                    Current portal status
                  </p>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${getPortalStatusStyle(selectedClient.portalAccess)}`}
                  >
                    {selectedClient.portalAccess}
                  </span>
                </div>

                {selectedClient.portalAccess === "Not Invited" && (
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      selectedClient.status !== "Active"
                    }
                    onClick={() =>
                      void runAction(() =>
                        onInviteClient(selectedClient.id)
                      )
                    }
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <UserPlus size={15} />
                    Send Portal Invitation
                  </button>
                )}

                {selectedClient.portalAccess === "Invitation Pending" && (
                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        void runAction(() =>
                          onUpdatePortalAccess(
                            selectedClient.id,
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
                            selectedClient.id,
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

                {selectedClient.portalAccess === "Expired" && (
                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      selectedClient.status !== "Active"
                    }
                    onClick={() =>
                      void runAction(() =>
                        onInviteClient(selectedClient.id)
                      )
                    }
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-40"
                  >
                    <RefreshCw size={15} />
                    Issue New Invitation
                  </button>
                )}

                {selectedClient.portalAccess === "Active" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void runAction(() =>
                        onUpdatePortalAccess(
                          selectedClient.id,
                          "revoke"
                        )
                      )
                    }
                    className="mt-5 w-full border border-[#E3C9C5] px-5 py-4 text-[9px] uppercase tracking-widest text-[#9A5147] disabled:opacity-40"
                  >
                    Revoke Portal Access
                  </button>
                )}

                {/* Direct Set Login Password Card */}
                {credentialSuccess && (
                  <div className="mt-5 p-4 border border-[#B68A4A]/50 bg-[#F9F7F3] rounded-sm space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-mono text-xs font-semibold">
                      <Check size={16} /> PORTAL LOGIN READY
                    </div>
                    <div className="text-xs font-mono text-[#333] space-y-1 bg-white p-3 border border-[#E5E2DC]">
                      <div><strong>Username:</strong> {credentialSuccess.username}</div>
                      <div><strong>Password:</strong> {credentialSuccess.password}</div>
                      <div><strong>Portal URL:</strong> <a href="/login" target="_blank" className="text-[#A58A64] underline">http://localhost:3000/login</a></div>
                    </div>
                    <p className="text-[10px] text-[#77736C]">
                      The client can now sign in at the login page using these credentials.
                    </p>
                  </div>
                )}

                {showDirectCredentials ? (
                  <div className="mt-5 border border-[#A58A64]/40 bg-[#FAF9F5] p-4 rounded-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                        <KeyRound size={14} className="text-[#A58A64]" /> Direct Login Credentials
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDirectCredentials(false)}
                        className="text-[10px] uppercase text-[#77736C] hover:text-[#171717]"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[11px] text-[#77736C] leading-relaxed">
                      Configure username &amp; password for immediate portal login without requiring email verification.
                    </p>

                    {credentialError && (
                      <p className="text-xs text-red-600 bg-red-50 p-2 border border-red-200">
                        {credentialError}
                      </p>
                    )}

                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-[#77736C] mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={portalUsername}
                        onChange={(e) => setPortalUsername(e.target.value)}
                        placeholder="e.g. client_username"
                        className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono focus:border-[#A58A64] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-[#77736C] mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={portalPassword}
                          onChange={(e) => setPortalPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full border border-[#D8D6D0] bg-white px-3 py-2 text-xs font-mono pr-9 focus:border-[#A58A64] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#77736C] hover:text-[#171717]"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={credentialsLoading || !portalUsername.trim() || !portalPassword.trim()}
                      onClick={async () => {
                        if (!onCreatePortalAccount) return;
                        setCredentialsLoading(true);
                        setCredentialError(null);
                        try {
                          await onCreatePortalAccount(selectedClient.id, portalUsername.trim(), portalPassword.trim());
                          setCredentialSuccess({ username: portalUsername.trim(), password: portalPassword.trim() });
                          setShowDirectCredentials(false);
                          selectedClient.portalAccess = "Active";
                        } catch (err: unknown) {
                          setCredentialError(err instanceof Error ? err.message : "Failed to create portal credentials.");
                        } finally {
                          setCredentialsLoading(false);
                        }
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#171717] px-4 py-3 text-[10px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-40 transition-colors"
                    >
                      <KeyRound size={14} />
                      {credentialsLoading ? "Saving..." : "Save Credentials & Enable Login"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-[#E5E2DC]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDirectCredentials(true);
                        setCredentialSuccess(null);
                        setCredentialError(null);
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 border border-[#A58A64] bg-[#F7F5F0] px-4 py-3 text-[9px] uppercase tracking-widest text-[#8A704C] hover:bg-[#A58A64] hover:text-white transition-colors"
                    >
                      <KeyRound size={14} />
                      {selectedClient.portalAccess === "Active" ? "Reset Login Password" : "Set Direct Login Password"}
                    </button>
                  </div>
                )}

                {selectedClient.portalAccess === "Suspended" && (
                  <p className="mt-5 text-xs leading-6 text-[#9A5147]">
                    Portal access is currently suspended. Reactivation
                    must follow the studio&apos;s authorised access-review
                    procedure.
                  </p>
                )}
              </section>

              {/* Linked Projects */}
              <section>
                <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-4">
                  <div>
                    <SectionHeading>Project Association</SectionHeading>

                    <h3 className="mt-3 font-serif text-2xl text-[#171717]">
                      Linked Projects
                    </h3>
                  </div>

                  <p className="font-mono text-[9px] text-[#99958D]">
                    {selectedClient.projects.length} PROJECTS
                  </p>
                </div>

                {selectedClient.projects.length === 0 ? (
                  <div className="mt-4 border border-[#D8D6D0] bg-white p-7 text-center">
                    <FolderKanban
                      size={24}
                      className="mx-auto text-[#A58A64]"
                    />

                    <p className="mt-3 text-xs text-[#77736C]">
                      No projects are linked to this client.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selectedClient.projects.map((project) => (
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

              {/* Record Metadata */}
              <section className="grid grid-cols-2 gap-3">
                <MetadataCard
                  label="Client Created"
                  value={formatDate(selectedClient.createdAt)}
                />

                <MetadataCard
                  label="Last Updated"
                  value={formatDate(selectedClient.lastUpdated)}
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

            {/* Drawer Footer */}
            <div className="sticky bottom-0 border-t border-[#D8D6D0] bg-[#F2F0EB] p-5">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  {onEditClient && (
                    <button
                      type="button"
                      onClick={() => onEditClient(selectedClient)}
                      disabled={actionLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#171717] px-4 py-3.5 font-mono text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors"
                    >
                      <Edit3 size={13} />
                      Edit Client
                    </button>
                  )}
                  {onDeleteClient && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete client "${selectedClient.fullName}"? This action cannot be undone.`)) {
                          void runAction(async () => {
                            await onDeleteClient(selectedClient.id);
                            setSelectedClient(null);
                          });
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 border border-red-300 bg-red-50 px-4 py-3.5 font-mono text-[9px] uppercase tracking-widest text-red-700 hover:bg-red-100 disabled:opacity-40 transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  disabled={actionLoading}
                  className="w-full border border-[#D8D6D0] bg-white px-5 py-3 font-mono text-[9px] uppercase tracking-widest text-[#77736C] hover:border-[#A58A64] disabled:opacity-40"
                >
                  Close Drawer
                </button>
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

function ClientCard({
  client,
  onOpen,
  onAddBill,
}: {
  client: AdminClientRecord;
  onOpen: () => void;
  onAddBill?: () => void;
}) {
  return (
    <article className="border border-[#D8D6D0] bg-white p-5 md:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#E5E2DC] bg-[#FAF9F6] text-[#A58A64]">
            <Users size={19} />
          </div>

          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
              {client.reference}
            </p>

            <h3 className="mt-2 break-words font-serif text-2xl text-[#171717]">
              {client.fullName}
            </h3>

            {client.organisation && (
              <p className="mt-2 text-xs text-[#77736C]">
                {client.organisation}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${getClientStatusStyle(client.status)}`}
          >
            {client.status}
          </span>

          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${getPortalStatusStyle(client.portalAccess)}`}
          >
            Portal: {client.portalAccess}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#E5E2DC] pt-5 md:grid-cols-3">
        <ClientDetail
          icon={<Mail size={14} />}
          value={client.email}
        />

        <ClientDetail
          icon={<Phone size={14} />}
          value={client.phone}
        />

        <ClientDetail
          icon={<MapPin size={14} />}
          value={client.location || "Location not specified"}
        />
      </div>

      {client.notes ? (
        <div className="mt-4 rounded-xs border border-[#E5E2DC] bg-[#FAF8F5] p-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#A58A64] font-semibold mb-1">
            <FileText size={11} /> Client Specifications
          </div>
          <p className="font-sans text-xs text-[#55524D] leading-relaxed line-clamp-2">
            {client.notes}
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-[#77736C]">
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

        <div className="flex items-center gap-3">
          {onAddBill && (
            <button
              type="button"
              onClick={onAddBill}
              className="inline-flex items-center gap-1.5 rounded-xs bg-[#171717] px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] transition-colors shadow-xs"
            >
              <Receipt size={12} className="text-[#A58A64]" />
              + Add Bill
            </button>
          )}

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
          >
            Review Client
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
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
