
"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Search,
  Users,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  ArrowUpRight,
  RefreshCw,
  X,
  AlertCircle,
  MessageSquare,
  UserRound,
  BriefcaseBusiness,
  Filter,
} from "lucide-react";

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Consultation Scheduled"
  | "Proposal Sent"
  | "Converted"
  | "Lost";

export type LeadPriority = "Low" | "Normal" | "High" | "Urgent";

export type LeadSource =
  | "Website"
  | "WhatsApp"
  | "Phone"
  | "Referral"
  | "Social Media"
  | "Other";

export interface AdminLeadRecord {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  serviceInterest: string;
  projectLocation?: string;
  projectDescription?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo?: string;
  createdAt: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  consultationDate?: string;
  conversionProjectReference?: string;
}

export interface LeadAssignee {
  id: string;
  name: string;
  active: boolean;
}

interface AdminLeadManagementProps {
  leads: AdminLeadRecord[];
  assignees: LeadAssignee[];

  loading?: boolean;
  updatingLeadId?: string;
  error?: string;

  onRefresh?: () => void;

  onUpdateStatus: (
    leadId: string,
    status: LeadStatus
  ) => Promise<void>;

  onAssignLead: (
    leadId: string,
    assigneeId: string
  ) => Promise<void>;

  onUpdateFollowUp: (
    leadId: string,
    date: string | null
  ) => Promise<void>;

  onConvertLead: (
    leadId: string
  ) => Promise<void>;

  onOpenLead?: (leadId: string) => void;
}

type LeadStatusFilter = "All" | LeadStatus;

const STATUS_OPTIONS: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Consultation Scheduled",
  "Proposal Sent",
  "Converted",
  "Lost",
];

const STATUS_FILTERS: LeadStatusFilter[] = [
  "All",
  ...STATUS_OPTIONS,
];

function formatDate(value?: string) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusStyle(status: LeadStatus) {
  switch (status) {
    case "New":
      return "bg-[#EAF0F5] text-[#58738C]";
    case "Contacted":
      return "bg-[#F4EFE2] text-[#94743F]";
    case "Qualified":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Consultation Scheduled":
      return "bg-[#F0EAF5] text-[#765A91]";
    case "Proposal Sent":
      return "bg-[#E8EEF0] text-[#54737C]";
    case "Converted":
      return "bg-[#EAF1E8] text-[#547A51]";
    case "Lost":
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

function getPriorityStyle(priority: LeadPriority) {
  switch (priority) {
    case "Urgent":
      return "bg-[#F8EAE7] text-[#9A5147]";
    case "High":
      return "bg-[#F4EFE2] text-[#94743F]";
    default:
      return "bg-[#ECEAE5] text-[#77736C]";
  }
}

export function AdminLeadManagement({
  leads,
  assignees,
  loading = false,
  updatingLeadId,
  error,
  onRefresh,
  onUpdateStatus,
  onAssignLead,
  onUpdateFollowUp,
  onConvertLead,
  onOpenLead,
}: AdminLeadManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<LeadStatusFilter>("All");
  const [priorityFilter, setPriorityFilter] =
    useState<"All" | LeadPriority>("All");
  const [sourceFilter, setSourceFilter] =
    useState<"All" | LeadSource>("All");

  const [selectedLead, setSelectedLead] =
    useState<AdminLeadRecord | null>(null);

  const [followUpDate, setFollowUpDate] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const counts = useMemo(() => ({
    total: leads.length,
    new: leads.filter((lead) => lead.status === "New").length,
    qualified: leads.filter(
      (lead) => lead.status === "Qualified"
    ).length,
    scheduled: leads.filter(
      (lead) => lead.status === "Consultation Scheduled"
    ).length,
    converted: leads.filter(
      (lead) => lead.status === "Converted"
    ).length,
  }), [leads]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        lead.fullName.toLowerCase().includes(query) ||
        lead.reference.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.serviceInterest.toLowerCase().includes(query) ||
        (lead.projectLocation ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        lead.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        lead.priority === priorityFilter;

      const matchesSource =
        sourceFilter === "All" ||
        lead.source === sourceFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesSource
      );
    });
  }, [leads, search, statusFilter, priorityFilter, sourceFilter]);

  const hasFilters =
    search.trim().length > 0 ||
    statusFilter !== "All" ||
    priorityFilter !== "All" ||
    sourceFilter !== "All";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setSourceFilter("All");
  }

  function openLead(lead: AdminLeadRecord) {
    setSelectedLead(lead);
    setFollowUpDate(
      lead.nextFollowUpAt
        ? lead.nextFollowUpAt.slice(0, 10)
        : ""
    );
    setActionError("");
  }

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

  async function handleFollowUpSave() {
    if (!selectedLead) return;

    await runAction(async () => {
      await onUpdateFollowUp(
        selectedLead.id,
        followUpDate || null
      );
    });
  }

  async function handleConversion() {
    if (!selectedLead) return;

    if (
      !window.confirm(
        "Submit this lead for conversion? The backend must validate the conversion."
      )
    ) {
      return;
    }

    await runAction(async () => {
      await onConvertLead(selectedLead.id);
    });
  }

  return (
    <main className="min-h-screen bg-[#F2F0EB] px-5 py-9 md:px-10 md:py-12 lg:px-12">

      {/* Header */}
      <header className="flex flex-col justify-between gap-6 border-b border-[#D8D6D0] pb-8 md:flex-row md:items-end">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
            Administration / CRM
          </p>

          <h1 className="mt-4 font-serif text-4xl text-[#171717] md:text-5xl">
            Enquiries & Leads
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-[#77736C]">
            Manage incoming enquiries, consultation requests,
            follow-ups and potential client conversions.
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
            Refresh Leads
          </button>
        )}
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
      <section className="mt-9">
        <div className="grid grid-cols-2 gap-px border border-[#D8D6D0] bg-[#D8D6D0] lg:grid-cols-5">
          <SummaryCard label="Total Enquiries" value={counts.total} />
          <SummaryCard label="New" value={counts.new} />
          <SummaryCard label="Qualified" value={counts.qualified} />
          <SummaryCard label="Consultations" value={counts.scheduled} />
          <SummaryCard label="Converted" value={counts.converted} />
        </div>
      </section>

      {/* Search */}
      <section className="mt-10">
        <div className="relative">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#99958D]"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, reference, email, phone or service..."
            aria-label="Search leads"
            className="h-12 w-full border border-[#D8D6D0] bg-white pl-11 pr-4 text-sm outline-none focus:border-[#A58A64]"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FilterSelect
            label="Lead Status"
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as LeadStatusFilter)
            }
            options={STATUS_FILTERS.map((value) => ({
              value,
              label: value === "All" ? "All Statuses" : value,
            }))}
          />

          <FilterSelect
            label="Priority"
            value={priorityFilter}
            onChange={(value) =>
              setPriorityFilter(value as "All" | LeadPriority)
            }
            options={["All", "Low", "Normal", "High", "Urgent"].map(
              (value) => ({
                value,
                label: value === "All" ? "All Priorities" : value,
              })
            )}
          />

          <FilterSelect
            label="Source"
            value={sourceFilter}
            onChange={(value) =>
              setSourceFilter(value as "All" | LeadSource)
            }
            options={[
              "All",
              "Website",
              "WhatsApp",
              "Phone",
              "Referral",
              "Social Media",
              "Other",
            ].map((value) => ({
              value,
              label: value === "All" ? "All Sources" : value,
            }))}
          />
        </div>

        {hasFilters && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-[#77736C]">
              Showing {filteredLeads.length} of {leads.length} leads
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

      {/* Lead Register */}
      <section className="mt-9">
        <div className="flex items-end justify-between border-b border-[#D8D6D0] pb-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A58A64]">
              CRM Records
            </p>

            <h2 className="mt-3 font-serif text-2xl text-[#171717]">
              Enquiry Register
            </h2>
          </div>

          <p className="font-mono text-[9px] text-[#99958D]">
            {filteredLeads.length} RECORDS
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#99958D]">
              Loading enquiries...
            </p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="mt-5 border border-[#D8D6D0] bg-white px-6 py-16 text-center">
            <Users
              size={28}
              strokeWidth={1.3}
              className="mx-auto text-[#A58A64]"
            />

            <h3 className="mt-5 font-serif text-2xl text-[#171717]">
              No enquiries found
            </h3>

            <p className="mt-3 text-xs text-[#77736C]">
              No records match the selected search and filters.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onOpen={() => openLead(lead)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-black/50"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !actionLoading
            ) {
              setSelectedLead(null);
            }
          }}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-detail-title"
            className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#F2F0EB] shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D8D6D0] bg-[#F2F0EB] px-6 py-5 md:px-8">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                  Lead Record / {selectedLead.reference}
                </p>

                <h2
                  id="lead-detail-title"
                  className="mt-2 font-serif text-2xl text-[#171717]"
                >
                  Enquiry Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                disabled={actionLoading}
                aria-label="Close lead details"
                className="text-[#77736C] disabled:opacity-40"
              >
                <X size={21} />
              </button>
            </div>

            <div className="flex-1 space-y-7 p-6 md:p-8">

              {/* Contact Details */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
                      Prospective Client
                    </p>

                    <h3 className="mt-3 font-serif text-2xl text-[#171717]">
                      {selectedLead.fullName}
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-2 text-[8px] uppercase tracking-widest ${getStatusStyle(selectedLead.status)}`}
                  >
                    {selectedLead.status}
                  </span>
                </div>

                <div className="mt-6 space-y-4 border-t border-[#E5E2DC] pt-5">
                  <DetailLine
                    icon={<Mail size={15} />}
                    value={selectedLead.email}
                  />

                  <DetailLine
                    icon={<Phone size={15} />}
                    value={selectedLead.phone}
                  />

                  <DetailLine
                    icon={<BriefcaseBusiness size={15} />}
                    value={selectedLead.serviceInterest}
                  />

                  {selectedLead.projectLocation && (
                    <DetailLine
                      icon={<MapPin size={15} />}
                      value={selectedLead.projectLocation}
                    />
                  )}
                </div>

                {selectedLead.projectDescription && (
                  <div className="mt-6 border-t border-[#E5E2DC] pt-5">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#99958D]">
                      Project Description
                    </p>

                    <p className="mt-3 text-xs leading-7 text-[#55514A]">
                      {selectedLead.projectDescription}
                    </p>
                  </div>
                )}
              </section>

              {/* Lead Metadata */}
              <section>
                <SectionHeading>Enquiry Information</SectionHeading>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MetadataCard
                    label="Source"
                    value={selectedLead.source}
                  />

                  <MetadataCard
                    label="Priority"
                    value={selectedLead.priority}
                  />

                  <MetadataCard
                    label="Received"
                    value={formatDate(selectedLead.createdAt)}
                  />

                  <MetadataCard
                    label="Last Contact"
                    value={formatDate(selectedLead.lastContactedAt)}
                  />
                </div>
              </section>

              {/* Assignment */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Lead Assignment</SectionHeading>

                <p className="mt-3 text-xs text-[#77736C]">
                  Current assignee: {selectedLead.assignedTo || "Unassigned"}
                </p>

                <label className="mt-5 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Assign To
                  </span>

                  <select
                    value={
                      assignees.find(
                        (person) => person.name === selectedLead.assignedTo
                      )?.id ?? ""
                    }
                    disabled={actionLoading}
                    onChange={(event) => {
                      const assigneeId = event.target.value;

                      if (!assigneeId) return;

                      void runAction(async () => {
                        await onAssignLead(
                          selectedLead.id,
                          assigneeId
                        );
                      });
                    }}
                    className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
                  >
                    <option value="">Select an assignee</option>

                    {assignees
                      .filter((person) => person.active)
                      .map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                  </select>
                </label>
              </section>

              {/* Status */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Lead Progress</SectionHeading>

                <label className="mt-5 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Update Status
                  </span>

                  <select
                    value={selectedLead.status}
                    disabled={actionLoading}
                    onChange={(event) => {
                      const nextStatus = event.target.value as LeadStatus;

                      void runAction(async () => {
                        await onUpdateStatus(
                          selectedLead.id,
                          nextStatus
                        );
                      });
                    }}
                    className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedLead.status === "Converted" &&
                  selectedLead.conversionProjectReference && (
                    <p className="mt-4 text-xs text-[#547A51]">
                      Converted project:{" "}
                      {selectedLead.conversionProjectReference}
                    </p>
                  )}
              </section>

              {/* Follow-up */}
              <section className="border border-[#D8D6D0] bg-white p-6">
                <SectionHeading>Follow-up Schedule</SectionHeading>

                <p className="mt-3 text-xs text-[#77736C]">
                  Current follow-up:{" "}
                  {formatDate(selectedLead.nextFollowUpAt)}
                </p>

                <label className="mt-5 block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-[#77736C]">
                    Next Follow-up Date
                  </span>

                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(event) =>
                      setFollowUpDate(event.target.value)
                    }
                    disabled={actionLoading}
                    className="h-11 w-full border border-[#D8D6D0] bg-white px-3 text-xs outline-none focus:border-[#A58A64]"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleFollowUpSave}
                  disabled={actionLoading}
                  className="mt-4 bg-[#171717] px-6 py-3 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
                >
                  Save Follow-up
                </button>
              </section>

              {/* Consultation */}
              {selectedLead.consultationDate && (
                <section className="border border-[#D8D6D0] bg-white p-6">
                  <SectionHeading>Consultation</SectionHeading>

                  <p className="mt-4 flex items-center gap-3 text-xs text-[#55514A]">
                    <CalendarDays size={16} className="text-[#A58A64]" />
                    {formatDate(selectedLead.consultationDate)}
                  </p>
                </section>
              )}

              {/* Convert */}
              {selectedLead.status !== "Converted" &&
                selectedLead.status !== "Lost" && (
                  <section className="border border-[#D8D6D0] bg-white p-6">
                    <SectionHeading>Conversion</SectionHeading>

                    <p className="mt-3 text-xs leading-6 text-[#77736C]">
                      Convert this qualified enquiry into a client or
                      project through the authorised conversion workflow.
                    </p>

                    <button
                      type="button"
                      onClick={handleConversion}
                      disabled={actionLoading}
                      className="mt-5 bg-[#171717] px-6 py-3 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64] disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Processing..."
                        : "Start Conversion"}
                    </button>
                  </section>
                )}

              {actionError && (
                <div
                  role="alert"
                  className="border border-[#E3C9C5] bg-[#FAF3F1] p-4 text-xs leading-6 text-[#805B55]"
                >
                  {actionError}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-[#D8D6D0] bg-[#F2F0EB] p-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 border border-[#D8D6D0] px-5 py-4 text-[9px] uppercase tracking-widest text-[#77736C]"
                >
                  Close
                </button>

                {onOpenLead && (
                  <button
                    type="button"
                    onClick={() => onOpenLead(selectedLead.id)}
                    className="flex-1 bg-[#171717] px-5 py-4 text-[9px] uppercase tracking-widest text-white hover:bg-[#A58A64]"
                  >
                    Open Full Record
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

function LeadCard({
  lead,
  onOpen,
}: {
  lead: AdminLeadRecord;
  onOpen: () => void;
}) {
  return (
    <article className="border border-[#D8D6D0] bg-white p-5 md:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#A58A64]">
            {lead.reference}
          </p>

          <h3 className="mt-3 font-serif text-2xl text-[#171717]">
            {lead.fullName}
          </h3>

          <p className="mt-2 text-xs text-[#77736C]">
            {lead.serviceInterest}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LeadDetail icon={<Mail size={14} />} value={lead.email} />
            <LeadDetail icon={<Phone size={14} />} value={lead.phone} />

            {lead.projectLocation && (
              <LeadDetail
                icon={<MapPin size={14} />}
                value={lead.projectLocation}
              />
            )}

            <LeadDetail
              icon={<CalendarDays size={14} />}
              value={`Received ${formatDate(lead.createdAt)}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${getStatusStyle(lead.status)}`}
          >
            {lead.status}
          </span>

          <span
            className={`px-3 py-2 text-[8px] uppercase tracking-widest ${getPriorityStyle(lead.priority)}`}
          >
            {lead.priority}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-4 border-t border-[#E5E2DC] pt-5 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-[#77736C]">
          <span>Source: {lead.source}</span>
          <span>Assigned: {lead.assignedTo || "Unassigned"}</span>
          <span>
            Follow-up: {formatDate(lead.nextFollowUpAt)}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-[9px] uppercase tracking-widest text-[#987543] hover:text-[#171717]"
        >
          Review Enquiry
          <ArrowUpRight size={14} />
        </button>
      </div>
    </article>
  );
}

function LeadDetail({
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
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-xs text-[#55514A]">
      <span className="mt-0.5 shrink-0 text-[#A58A64]">{icon}</span>
      <span className="break-all">{value}</span>
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
    <div className="border border-[#E5E2DC] bg-white p-4">
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
  options: { value: string; label: string }[];
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
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
